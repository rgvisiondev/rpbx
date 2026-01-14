// app/api/checkout/evaluation/route.ts
export const runtime = "nodejs";

import { ensureCustomer } from "@/lib/ensure-customer";
import { pickEvaluationPriceId } from "@/lib/evaluations/pricing";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getStripe } from "@/lib/stripe";

type ListingRow = {
  id: string;
  owner_id: string;
  status: "draft" | "published" | "archived" | string;
  is_active: boolean;
};

type EvalRequestBody = { listingId?: string };

export async function POST(req: Request) {
  try {
    const { createClientRSC } = await import("@/../utils/supabase/server");
    // Give supabase its concrete type
    const supabase = (await createClientRSC()) as SupabaseClient<Database>;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Parse body safely (no any)
    const ct = req.headers.get("content-type") ?? "";
    const body: EvalRequestBody = {};
    if (ct.includes("application/json")) {
      const json = (await req.json()) as unknown;
      if (isObject(json) && typeof json.listingId === "string") {
        body.listingId = json.listingId;
      }
    } else {
      const fd = await req.formData();
      const v = fd.get("listingId");
      if (typeof v === "string") body.listingId = v;
    }

    const listingId = (body.listingId ?? "").trim();
    if (!listingId) return new Response("Missing listingId", { status: 400 });

    // Verify listing ownership
    const { data: listing, error: listErr } = await supabase
      .from("business_listings")
      .select("id, owner_id, status, is_active")
      .eq("id", listingId)
      .maybeSingle()
      .returns<ListingRow | null>();

    if (listErr) return new Response("DB error", { status: 500 });
    if (!listing || listing.owner_id !== user.id)
      return new Response("Forbidden", { status: 403 });
    if (!listing.is_active || listing.status !== "published") {
      return new Response("Listing is not eligible for evaluation", {
        status: 400,
      });
    }

    // Member vs public price — no `any`
    const priceId = await pickEvaluationPriceId(supabase, user.id);

    // Ensure Stripe customer
    const customerId = await ensureCustomer(user);

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const successUrl = `${origin}/api/evaluations/redirect?listing_id=${encodeURIComponent(listingId)}`;
    const cancelUrl = `${origin}/dashboard/listings?eval=canceled`;
    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      metadata: {
        purpose: "evaluation",
        listing_id: listingId,
        supabase_user_id: user.id,
      },
      payment_intent_data: {
        metadata: {
          purpose: "evaluation",
          listing_id: listingId,
          supabase_user_id: user.id,
        },
      },
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Evaluation checkout error:", err);
    return new Response("Checkout error", { status: 500 });
  }
}

// tiny helper
function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}
