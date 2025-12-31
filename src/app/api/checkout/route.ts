// app/api/checkout/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Supports base plans (business monthly/yearly/trial, investor monthly/yearly),
 * listing promos, and listing plans.
 *
 * Enforces via Stripe Price metadata:
 *  - Base membership prices must have metadata.user_type = 'business' | 'investor'
 *  - Listing promo prices must have metadata.purpose = 'listing_promo' and a listingId
 *  - Optional trial days via price.metadata.trial_days (numeric)
 *  - Duplicate base subscription prevention -> Billing Portal
 */
export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const admin = getSupabaseAdmin();
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const supabase = await createClientRSC();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

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
      listingId = body.listId ?? body.listingId; // tolerate either
      purpose = body.purpose;
      const td = Number(body.trialDays);
      trialDaysFromClient =
        Number.isFinite(td) && td > 0 ? Math.floor(td) : undefined;

        console.log("Parsed JSON body", {
          priceId,
          purpose,
          listingId,
          trialDaysRaw: body.trialDays,
          trialDaysFromClient,
        });
    } else {
      const form = await req.formData();
      priceId = String(form.get("priceId") ?? "");
      const q = Number(form.get("quantity"));
      quantity = Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
      listingId = form.get("listingId")?.toString();
      const p = form.get("purpose")?.toString();
      if (p === "listing_promo" || p === "listing_plan" || p === "base_membership") {
        purpose = p;
      }
      const td = Number(form.get("trialDays"));
      trialDaysFromClient =
        Number.isFinite(td) && td > 0 ? Math.floor(td) : undefined;

        console.log("Parsed FORM body", {
          priceId,
          purpose,
          listingId,
          trialDaysRaw: form.get("trialDays"),
          trialDaysFromClient
        })
    }

    if (!priceId) {
      return new Response("Missing priceId", { status: 400 });
    }

    // If tied to a listing, verify ownership (for promos / future listing flows)
    if (listingId) {
      const { data: listing, error: listErr } = await supabase
        .from("business_listings")
        .select("id, owner_id")
        .eq("id", listingId)
        .maybeSingle();

      if (listErr) {
        console.error("DB error verifying listing ownership", listErr);
        return new Response("DB error", { status: 500 });
      }
      if (!listing || listing.owner_id !== user.id) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Coerce metadata to strings
    const safeMeta: Record<string, string> = Object.fromEntries(
      Object.entries(rawMeta ?? {}).map(([k, v]) => [k, v == null ? "" : String(v)])
    );

    // Decide purpose: default promo when listingId present, else base_membership
    const finalPurpose =
      purpose ?? (listingId ? "listing_promo" : "base_membership");

    // Fetch and validate price (metadata-driven; no env whitelist)
    const fetchedPrice = await stripe.prices.retrieve(priceId, { expand: ["product"] });

    if (!fetchedPrice.active) {
      return new Response("Inactive price", { status: 400 });
    }
    if (fetchedPrice.type !== "recurring") {
      return new Response("Price must be recurring for subscriptions", {
        status: 400,
      });
    }

    const priceUserType = String(fetchedPrice.metadata?.user_type || "").toLowerCase(); // 'business' | 'investor' | ''
    const pricePurpose = String(fetchedPrice.metadata?.purpose || "").toLowerCase(); // 'listing_promo' | 'listing_plan' | ''

    // Ensure Stripe customer once (used for all branches)
    const customerId = await ensureCustomer(stripe, admin, user);

    // -------------------------
    // SPECIAL CASE: listing_plan
    // -------------------------
    if (finalPurpose === "listing_plan") {
      const meta: Record<string, string> = {
        supabase_user_id: user.id,
        purpose: "listing_plan",
        ...safeMeta,
      };

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity }],
        success_url:
          successUrl ??
          `${ORIGIN}/onboarding/business/claim?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl ?? `${ORIGIN}/dashboard/listings`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: meta,
        },
        metadata: meta,
      });

      if (!session.url) {
        console.error("Stripe session created without URL (listing_plan)", {
          sessionId: session.id,
        });
        return NextResponse.json(
          { error: "No session URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: session.url });
    }

    // ---- Purpose/eligibility checks ----

    // Base memberships: business/investor roles only, not listing promo prices
    if (finalPurpose === "base_membership") {
      const isBaseUserType =
        priceUserType === "business" || priceUserType === "investor";
      if (!isBaseUserType) {
        return new Response("Invalid price for purpose", { status: 400 });
      }
      if (pricePurpose === "listing_promo") {
        return new Response("Invalid price for purpose", { status: 400 });
      }
    }

    // Listing promos: require listing-specific promo price and a listingId
    if (finalPurpose === "listing_promo") {
      if (pricePurpose !== "listing_promo" || !listingId) {
        return new Response("Invalid price for purpose", { status: 400 });
      }
    }

    // Determine role from price metadata (authoritative)
    const resolvedRole: "business" | "investor" | null =
      priceUserType === "business" || priceUserType === "investor"
        ? priceUserType
        : null;

    // ---- Trial handling ----
    let trialDays: number | undefined;
    const mdTrial = fetchedPrice.metadata?.trial_days;
    if (mdTrial && /^\d+$/.test(String(mdTrial))) {
      trialDays = parseInt(String(mdTrial), 10);
    }

    // Allow client to override (only for base memberships)
    if (finalPurpose === "base_membership" && typeof trialDaysFromClient === "number") {
      trialDays = trialDaysFromClient;
    }

    // Sanitize bounds (1–60 days) if set
    if (typeof trialDays === "number") {
      trialDays = Math.max(1, Math.min(trialDays, 60));
    }

    console.log("Trial resolution", {
      mdTrial,
      trialDaysFromClient,
      finalPurpose,
      resolvedTrialDays: trialDays,
    });

    // ---- Prevent duplicate base subscriptions ----
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
        const portal = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${ORIGIN}/dashboard`,
        });

        return NextResponse.json({ url: portal.url });
      }
    }

    const commonMeta: Record<string, string> = {
      supabase_user_id: user.id,
      purpose: finalPurpose,
      ...(listingId ? { listing_id: listingId } : {}),
      ...(resolvedRole ? { user_type_intended: resolvedRole } : {}),
      ...(typeof trialDays === "number"
        ? { trial_days_applied: String(trialDays) }
        : {}),
      ...safeMeta,
    };

    // ---- Create Checkout Session for base_membership / listing_promo ----
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity }],
      success_url:
        successUrl ??
        `${ORIGIN}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${ORIGIN}/dashboard`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: commonMeta,
        ...(typeof trialDays === "number" && trialDays > 0
          ? { trial_period_days: trialDays }
          : {}),
      },
      metadata: commonMeta,
    });

    if (!session.url) {
      console.error("Stripe session created without URL", { sessionId: session.id });
      return NextResponse.json(
        { error: "No session URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const error =
      err instanceof Error
        ? err
        : new Error("Unknown error in checkout route");

    const stripeError =
      typeof err === "object" && err !== null ? (err as Record<string, unknown>) : {};

    console.error("Checkout error", {
      message: error.message,
      type: stripeError["type"],
      stack: error.stack,
      raw: err,
    });

    return NextResponse.json(
      { error: "Checkout error", message: error.message ?? null },
      { status: 500 }
    );
  }
}
