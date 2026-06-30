// app/api/checkout/evaluation/route.ts
export const runtime = "nodejs";

import { ensureCustomer } from "@/lib/ensure-customer";
import { pickEvaluationPriceId } from "@/lib/evaluations/pricing";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getStripe } from "@/lib/stripe";
import {
  VALUATION_MODE,
  BIZEQUITY_VALUATION_LINK,
  VALUATION_CALENDLY_LINK,
} from "@/lib/valuation-config";
import { isValuationFeatureDisabled } from "@/lib/valuation/valuationAvailability";
import ValuationEmail from "../../../../../emails/ValuationEmail";
import { getResendClient, getEmailFrom } from "@/lib/resend";

type ListingRow = {
  id: string;
  owner_id: string;
  status: "draft" | "published" | "archived" | string;
  is_active: boolean;
  contact_email?: string | null;
};

type EvalRow = {
  id: number;
  listing_id: string;
  status: string;
  access_type: "paid" | "free" | null;
};

type EvalRequestBody = { listingId?: string };

export async function POST(req: Request) {
  if (isValuationFeatureDisabled()) {
    return Response.json(
      { error: "Business valuations are not currently available." },
      { status: 503 }
    );
  }

  try {
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const supabase = (await createClientRSC()) as SupabaseClient<Database>;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return new Response("Unauthorized", { status: 401 });

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

    const { data: listing, error: listErr } = await supabase
      .from("business_listings")
      .select("id, owner_id, status, is_active, contact_email")
      .eq("id", listingId)
      .maybeSingle()
      .returns<ListingRow | null>();

    if (listErr) {
      console.error("Error loading listing:", listErr);
      return new Response("DB error", { status: 500 });
    }

    if (!listing || listing.owner_id !== user.id) {
      return new Response("Forbidden", { status: 403 });
    }

    if (!listing.is_active || listing.status !== "published") {
      return new Response("Listing is not eligible for evaluation", {
        status: 400,
      });
    }

    // -------------------------
    // FREE VALUATION BRANCH
    // -------------------------
    if (VALUATION_MODE === "free") {
      if (!BIZEQUITY_VALUATION_LINK) {
        return Response.json(
          { error: "BizEquity valuation link is not configured" },
          { status: 500 }
        );
      }

      if (!VALUATION_CALENDLY_LINK) {
        return Response.json(
          { error: "Calendly link is not configured" },
          { status: 500 }
        );
      }

      const { data: existingEval, error: evalFetchErr } = await supabase
        .from("listing_evaluations")
        .select("id, listing_id, status, access_type")
        .eq("listing_id", listingId)
        .maybeSingle()
        .returns<EvalRow | null>();

      if (evalFetchErr) {
        console.error("Error loading existing listing evaluation:", evalFetchErr);
        return new Response("DB error", { status: 500 });
      }

      if (!existingEval) {
        const { error: insertErr } = await supabase
          .from("listing_evaluations")
          .insert({
            listing_id: listingId,
            status: "completed",
            stripe_payment_intent_id: null,
            access_type: "free",
          });

        if (insertErr) {
          console.error("Error inserting free listing evaluation:", insertErr);
          return new Response("DB error", { status: 500 });
        }
      } else if (existingEval.status !== "completed") {
        const { error: updateErr } = await supabase
          .from("listing_evaluations")
          .update({
            status: "completed",
            access_type: "free",
          })
          .eq("listing_id", listingId);

        if (updateErr) {
          console.error("Error updating free listing evaluation:", updateErr);
          return new Response("DB error", { status: 500 });
        }
      }

      const recipientEmail = user.email ?? listing.contact_email ?? null;

      if (!recipientEmail) {
        return new Response("Missing email for valuation delivery", {
          status: 400,
        });
      }

      const resend = getResendClient();
      const emailResult = await resend.emails.send({
        from: getEmailFrom(),
        to: recipientEmail,
        subject: "Your free RioPlex business valuation link",
        react: ValuationEmail({
          link: BIZEQUITY_VALUATION_LINK,
          calendlyLink: VALUATION_CALENDLY_LINK,
          mode: "free",
        }),
      });

      if ("error" in emailResult && emailResult.error) {
        console.error("Failed to send free valuation email:", emailResult.error);
        return Response.json(
          { error: "Failed to send valuation email" },
          { status: 500 }
        );
      }

      return Response.json({ url: BIZEQUITY_VALUATION_LINK });
    }

    // -------------------------
    // PAID VALUATION BRANCH
    // -------------------------

    const priceId = await pickEvaluationPriceId(supabase, user.id);
    const customerId = await ensureCustomer(user);

    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const successUrl = `${origin}/api/evaluations/redirect?listing_id=${encodeURIComponent(
      listingId
    )}`;
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

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}