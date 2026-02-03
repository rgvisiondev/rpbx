// app/api/listings/ensure/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClientRSC } from "@/../utils/supabase/server";
import { getAdmin, ensureListingForSubscription, upsertSubscription } from "@/lib/billing/subscriptionSync";

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return new NextResponse("Stripe not configured", { status: 500 });

    // Auth user (cookie session)
    const supabase = await createClientRSC();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const body = (await req.json().catch(() => null)) as { subId?: string } | null;
    const subId = body?.subId;
    if (!subId) return new NextResponse("Missing subId", { status: 400 });

    const admin = getAdmin();

    // 1) Retrieve subscription from Stripe (source of truth)
    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price.product", "customer"],
    });

    // 2) Resolve uid robustly (same logic as your webhook)
    const stripeCustomerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

    let uid: string | null =
      (sub.metadata?.supabase_user_id as string | undefined) ?? null;

    // customers table mapping
    if (!uid && stripeCustomerId) {
      const { data: mapRow, error: mapErr } = await admin
        .from("customers")
        .select("id")
        .eq("stripe_customer_id", stripeCustomerId)
        .maybeSingle();

      if (mapErr) console.error("[ensure route] customers map lookup error", mapErr);
      uid = (mapRow?.id as string | undefined) ?? null;
    }

    // fallback: Stripe customer metadata
    if (!uid && stripeCustomerId) {
      try {
        const cust = await stripe.customers.retrieve(stripeCustomerId);
        uid =
          "deleted" in cust
            ? null
            : ((cust.metadata?.supabase_user_id as string | undefined) ?? null);
      } catch (e) {
        console.error("[ensure route] failed to retrieve customer for uid", e);
      }
    }

    if (!uid || uid !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3) Ensure listing + stamp Stripe metadata + mirror subscription row
    const listingId = await ensureListingForSubscription(admin, stripe, sub, user.id);
    if (!listingId) return new NextResponse("Failed to ensure listing", { status: 500 });

    // Extra safety: ensure subscription mirror exists even if webhook lagged
    await upsertSubscription(admin, await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price.product", "customer"],
    }));

    return NextResponse.json({ listingId });
  } catch (e) {
    console.error("ensure route error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
