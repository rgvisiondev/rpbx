import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClientRSC } from "../../../../../utils/supabase/server";
import { getStripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";
import { pickEvaluationPriceId } from "@/lib/evaluations/pricing";
import {
  VALUATION_MODE,
  BIZEQUITY_VALUATION_LINK,
  VALUATION_CALENDLY_LINK,
} from "@/lib/valuation-config";
import { getResendClient, getEmailFrom } from "@/lib/resend";
import ValuationEmail from "../../../../../emails/ValuationEmail";

const PRICE_LISTING_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY!;
const PRICE_LISTING_YEARLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY!;
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type ListingEvalRow = {
  id: number;
  listing_id: string;
  status: string;
  access_type: "paid" | "free" | null;
};

export async function setListingHidden(listingId: string, hidden: boolean) {
  "use server";

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const { data: listing, error: findErr } = await supabase
    .from("business_listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (findErr || !listing) throw new Error("Listing not found");
  if (listing.owner_id !== user.id) throw new Error("Forbidden");

  const { error: updErr } = await supabase
    .from("business_listings")
    .update({ is_hidden: hidden })
    .eq("id", listingId);

  if (updErr) throw updErr;

  revalidatePath("/dashboard/listings");
}

export async function startListingPriceCheckout(priceId: string) {
  "use server";

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const h = await headers();
  const ck = h.get("cookie") ?? "";

  const res = await fetch(`${ORIGIN}/api/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: ck.toString(),
    },
    body: JSON.stringify({
      priceId,
      purpose: "listing_plan",
      successUrl: `${ORIGIN}/onboarding/business/claim?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${ORIGIN}/dashboard/listings`,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }
    console.error("listing_plan checkout failed", res.status, body);
    redirect("/dashboard/listings?err=listing_plan_checkout");
  }

  const { url } = await res.json();
  if (!url) {
    console.error("No session URL returned from /api/checkout (listing_plan)");
    redirect("/dashboard/listings?err=no_session_url");
  }

  redirect(url);
}

export async function startEvaluation(listingId: string) {
  "use server";

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/listings");
  }

  const { data: listing, error: listErr } = await supabase
    .from("business_listings")
    .select("id, owner_id, status, is_active, contact_email")
    .eq("id", listingId)
    .maybeSingle();

  if (listErr) {
    console.error("Failed to load listing for valuation:", listErr);
    redirect("/dashboard/listings?err=eval_db");
  }

  if (!listing || listing.owner_id !== user.id) {
    redirect("/dashboard/listings?err=eval_forbidden");
  }

  if (!listing.is_active || listing.status !== "published") {
    redirect("/dashboard/listings?err=eval_ineligible");
  }

  // FREE FLOW
  if (VALUATION_MODE === "free") {
    if (!BIZEQUITY_VALUATION_LINK || !VALUATION_CALENDLY_LINK) {
      console.error("Missing valuation env vars for free mode");
      redirect("/dashboard/listings?err=eval_config");
    }

    const { data: existingEval, error: evalFetchErr } = await supabase
      .from("listing_evaluations")
      .select("id, listing_id, status, access_type")
      .eq("listing_id", listingId)
      .maybeSingle()
      .returns<ListingEvalRow | null>();

    if (evalFetchErr) {
      console.error("Failed to load existing evaluation row:", evalFetchErr);
      redirect("/dashboard/listings?err=eval_db");
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
        console.error("Failed to insert free evaluation row:", insertErr);
        redirect("/dashboard/listings?err=eval_insert");
      }
    } else {
  const { error: updateErr } = await supabase
    .from("listing_evaluations")
    .update({
      status: "completed",
      access_type: "free",
    })
    .eq("listing_id", listingId);

      if (updateErr) {
        console.error("Failed to update free evaluation row:", updateErr);
        redirect("/dashboard/listings?err=eval_update");
      }
    }

    const recipientEmail = user.email ?? listing.contact_email ?? null;

    if (!recipientEmail) {
      console.error("No recipient email found for free valuation");
      redirect("/dashboard/listings?err=eval_email_missing");
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
      redirect("/dashboard/listings?err=eval_email_send");
    }

    redirect(BIZEQUITY_VALUATION_LINK);
  }

  // PAID FLOW
  const priceId = await pickEvaluationPriceId(supabase, user.id);
  const customerId = await ensureCustomer(user);

  const stripe = getStripe();
  if (!stripe) {
    console.error("Stripe is not configured");
    redirect("/dashboard/listings?err=stripe_not_configured");
  }

  const successUrl = `${ORIGIN}/api/evaluations/redirect?listing_id=${encodeURIComponent(
    listingId
  )}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${ORIGIN}/dashboard/listings?eval=canceled`;

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

  if (!session.url) {
    console.error("No Stripe session URL returned for evaluation");
    redirect("/dashboard/listings?err=no_eval_url");
  }

  redirect(session.url);
}

export async function startBoost(listingId: string) {
  "use server";

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.user_type !== "business") {
    redirect("/dashboard");
  }

  const { data: listing, error: listErr } = await supabase
    .from("business_listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listErr) redirect("/dashboard/listings?err=promo_db");
  if (!listing || listing.owner_id !== user.id) {
    redirect("/dashboard/listings?err=forbidden");
  }

  const promoPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROMO;
  if (!promoPriceId) redirect("/dashboard/listings?err=missing_price");

  const customerId = await ensureCustomer(user);

  const stripe = getStripe();
  if (!stripe) {
    redirect("/dashboard/listings?err=stripe_not_configured");
  }

  const price = await stripe.prices.retrieve(promoPriceId);
  if (price.type !== "recurring") {
    redirect("/dashboard/listings?err=not_recurring");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: promoPriceId, quantity: 1 }],
    success_url: `${ORIGIN}/dashboard/listings?promoted=${listingId}`,
    cancel_url: `${ORIGIN}/dashboard/listings`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        purpose: "listing_promo",
        listing_id: listingId,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      purpose: "listing_promo",
      listing_id: listingId,
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    console.error("Stripe returned no session.url", { sessionId: session.id });
    redirect("/dashboard/listings?err=no_session_url");
  }

  redirect(session.url);
}

export async function openPortal(_formData: FormData) {
  "use server";
  void _formData;

  const { openBillingPortal } = await import("@/app/server/billing");
  const url = await openBillingPortal(`${ORIGIN}/dashboard/listings`);
  redirect(url);
}

export async function startMonthlyListingCheckout() {
  "use server";
  return startListingPriceCheckout(PRICE_LISTING_MONTHLY);
}

export async function startYearlyListingCheckout() {
  "use server";
  return startListingPriceCheckout(PRICE_LISTING_YEARLY);
}