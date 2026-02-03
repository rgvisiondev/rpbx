// app/api/listings/ensure/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClientRSC } from "@/../utils/supabase/server";
import {getAdmin, ensureListingForSubscription } from "@/lib/billing/subscriptionSync";


export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) return new NextResponse("Stripe not configured", { status: 500 });

    // Auth user (cookie session)
    const supabase = await createClientRSC();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return new NextResponse("Unauthorized", { status: 401 });

    const body = (await req.json().catch(() => null)) as { subId?: string } | null;
    const subId = body?.subId;
    if (!subId) return new NextResponse("Missing subId", { status: 400 });

    // Verify subscription belongs to this user (using RLS-safe client)
    const { data: subRow, error: subErr } = await supabase
      .from("subscriptions")
      .select("id, user_id, listing_id")
      .eq("id", subId)
      .maybeSingle();

    if (subErr || !subRow || subRow.user_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // If already present, return immediately
    if (subRow.listing_id) {
      return NextResponse.json({ listingId: subRow.listing_id });
    }

    // Service role: ensure listing + stamp metadata
    const admin = getAdmin();

    const sub = await stripe.subscriptions.retrieve(subId, {
      expand: ["items.data.price.product", "customer"],
    });

    const listingId = await ensureListingForSubscription(admin, stripe, sub, user.id);
    if (!listingId) return new NextResponse("Failed to ensure listing", { status: 500 });

    return NextResponse.json({ listingId });
  } catch (e) {
    console.error("ensure route error:", e);
    return new NextResponse("Internal error", { status: 500 });
  }
}
