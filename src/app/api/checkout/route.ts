// app/api/checkout/route.ts
export const runtime = "nodejs";

import { stripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";
/**
 * Supports base plans (business monthly/yearly/trial, investor monthly/yearly)
 * and (optionally) listing promo. Enforces via Stripe Price metadata:
 *  - Base membership prices must have metadata.user_type = 'business' | 'investor'
 *  - Listing promo prices must have metadata.purpose = 'listing_promo' and a listingId
 *  - Optional trial days via price.metadata.trial_days (numeric)
 *  - Duplicate base subscription prevention -> Billing Portal
 */
export async function POST(req: Request) {
  try {
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const supabase = await createClientRSC();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return new Response("Unauthorized", { status: 401 });

    const ct = req.headers.get("content-type") ?? "";

    // ---- Parse body (JSON + form) ----
    let priceId = "";
    let quantity = 1;
    let rawMeta: Record<string, unknown> | undefined;
    let successUrl: string | undefined;
    let cancelUrl: string | undefined;
    let listingId: string | undefined;
    let purpose: "listing_promo" | "listing_plan" | "base_membership" | undefined;
    let trialDaysFromClient: number | undefined;

    if (ct.includes("application/json")) {
      const body = await req.json();
      priceId = String(body.priceId ?? "");
      quantity =
        Number.isFinite(body.quantity) && body.quantity > 0
          ? Math.floor(body.quantity)
          : 1;
      rawMeta = body.metadata;
      successUrl = body.successUrl;
      cancelUrl = body.cancelUrl;
      listingId = body.listingId;
      purpose = body.purpose;
      const td = Number(body.trialDays);
      trialDaysFromClient = Number.isFinite(td) && td > 0 ? Math.floor(td) : undefined;
    } else {
      const form = await req.formData();
      priceId = String(form.get("priceId") ?? "");
      const q = Number(form.get("quantity"));
      quantity = Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
      listingId = form.get("listingId")?.toString();
      const p = form.get("purpose")?.toString();
      if (p === "listing_promo" || p === "listing_plan" || p === "base_membership")
        purpose = p;
      const td = Number(form.get("trialDays"));
      trialDaysFromClient = Number.isFinite(td) && td > 0 ? Math.floor(td) : undefined
    }


    if (!priceId) return new Response("Missing priceId", { status: 400 });

    // If tied to a listing, verify ownership (kept for future listing promos)
    if (listingId) {
      const { data: listing, error: listErr } = await supabase
        .from("business_listings")
        .select("id, owner_id")
        .eq("id", listingId)
        .maybeSingle();
      if (listErr) return new Response("DB error", { status: 500 });
      if (!listing || listing.owner_id !== user.id)
        return new Response("Forbidden", { status: 403 });
    }

    // Coerce metadata to strings
    const safeMeta: Record<string, string> = Object.fromEntries(
      Object.entries(rawMeta ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)])
    );

    // Decide purpose: default promo when listingId present, else base
    const finalPurpose = purpose ?? (listingId ? "listing_promo" : "base_membership");

    // Fetch and validate price (metadata-driven; no env whitelist)
    const fetchedPrice = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    if (!fetchedPrice.active) {
      return new Response("Inactive price", { status: 400 });
    }
    if (fetchedPrice.type !== "recurring") {
      return new Response("Price must be recurring for subscriptions", { status: 400 });
    }

    const priceUserType = String(fetchedPrice.metadata?.user_type || "").toLowerCase(); // 'business' | 'investor' | ''
    const pricePurpose = String(fetchedPrice.metadata?.purpose || "").toLowerCase();     // e.g., 'listing_promo' | ''

    // ---- Purpose/eligibility checks:
    if (finalPurpose === "base_membership") {
      // Must be one of our two base roles; do not allow listing promo prices here
      const isBaseUserType = priceUserType === "business" || priceUserType === "investor";
      if (!isBaseUserType) {
        return new Response("Invalid price for purpose", { status: 400 });
      }
      if (pricePurpose === "listing_promo") {
        return new Response("Invalid price for purpose", { status: 400 });
      }
    }

    if (finalPurpose === "listing_promo") {
      // Require listing-specific promo price AND a listingId
      if (pricePurpose !== "listing_promo" || !listingId) {
        return new Response("Invalid price for purpose", { status: 400 });
      }
    }

    // Determine role from price metadata (authoritative)
    const resolvedRole: "business" | "investor" | null =
      priceUserType === "business" || priceUserType === "investor"
        ? priceUserType
        : null;

    // Optional trial handling (prefer configuring on the Price in Stripe)
    let trialDays: number | undefined;
    const mdTrial = fetchedPrice.metadata?.trial_days;
    if (mdTrial && /^\d+$/.test(String(mdTrial))) {
      trialDays = parseInt(String(mdTrial), 10);
    }
    
    // Allow client to override (only for base memberships)
    if (finalPurpose === "base_membership" && typeof trialDaysFromClient === "number"){
      trialDays = trialDaysFromClient;
    }

    // Sanitize bounds (allow 1-60 days; tweak to policy)
    if (typeof trialDays === "number"){
      trialDays = 30;
    }

    // Ensure Stripe customer (robust mapping; reuses if exists)
    const customerId = await ensureCustomer(user);

    //PREVENT DUPLICATE BASE SUBSCRIPTIONS
    if (finalPurpose === "base_membership") {
      const existing = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.items"],
        limit: 20,
      });

      const hasActiveBase = existing.data.some(
        (s) =>
          s.status === "active" ||
          s.status === "trialing" ||
          (s.status === "past_due" && !s.cancel_at_period_end)
      );

      if (hasActiveBase) {
        const origin =
          req.headers.get("origin") ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          "http://localhost:3000";

        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/dashboard`,
        });

        return Response.json({ url: portal.url });
      }
    }
    if (finalPurpose === "listing_plan"){

      if (priceUserType !== "business"){
        return new Response("Invalid price for listing_plan (requires business user_type", { status: 400 });
      }
      if (pricePurpose === "listing_promo"){
        return new Response("Invalid price for listing_plan (got listing_promo)", { status: 400 });
      }
    }

    // Build origin for redirects
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const idempotencyKey = `chk_${user.id}_${priceId}_${quantity}_${listingId ?? "nolisting"}_${finalPurpose}`;

    // Build subscription metadata so both session + subscription carry it
    const commonMeta: Record<string, string> = {
      supabase_user_id: user.id,
      purpose: finalPurpose,
      ...(listingId ? { listing_id: listingId } : {}),
      ...(resolvedRole ? { user_type_intended: resolvedRole } : {}), // harmless hint; webhook uses price again
      ...(typeof trialDays === "number" ? { trial_days_applied: String(trialDays) } : {}),
      ...safeMeta,
    };

    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity }],
        success_url: successUrl ?? `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl ?? `${origin}/dashboard`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: commonMeta,
          ...(typeof trialDays === "number" && trialDays > 0
            ? { trial_period_days: trialDays }
            : {}),
        },
        metadata: commonMeta,
      },
      { idempotencyKey }
    );

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response("Checkout error", { status: 500 });
  }
}
