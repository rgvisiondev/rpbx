// app/api/subscribe/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { createClientRSC } from "@/../utils/supabase/server";
import { ensureCustomer } from "@/lib/ensure-customer";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { getStripe } from "@/lib/stripe";
import { syncMailerLiteGroups } from "@/lib/mailerlite/mailerlite";

function getAllowedTrialDaysFromLookup(
  lookup: string,
): number {
  if (lookup === "business_monthly") return 30;

  return 0;
}

function deriveUserTypeFromPrice(
  price: Stripe.Price,
): "investor" | "business" | "member" {
  const fromMeta = (price.metadata?.user_type ?? "").toLowerCase();
  if (fromMeta === "investor" || fromMeta === "business") return fromMeta;

  const lk = (price.lookup_key ?? "").toLowerCase();
  if (lk.startsWith("investor_")) return "investor";
  if (lk.startsWith("business_")) return "business";

  return "member";
}

export async function POST(req: Request) {
  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  // Declare lookup at top level so catch block can access it
  let lookup = "";

  try {
    const stripe = getStripe();
    if (!stripe) {
      throw new Error("Stripe is not configured.");
    }
    const form = await req.formData();
    lookup = String(form.get("lookup") ?? "");
    const priceIdFromForm = String(form.get("priceId") ?? "");
    const firstName = String(form.get("first_name") ?? "");
    const lastName = String(form.get("last_name") ?? "");
    const username = String(form.get("username") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const turnstileToken = form.get("turnstile_token");
    const source = String(form.get("source") ?? "");
    const isActivateSignup = source === "activate";

    if ((!lookup && !priceIdFromForm) || !email || !password) {
      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=missing_fields`,
        303,
      );
    }

    if (!turnstileToken || typeof turnstileToken !== "string") {
      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=verification_failed`,
        303,
      );
    }

    const ok = await verifyTurnstileToken(turnstileToken);
    if (!ok) {
      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=verification_failed`,
        303,
      );
    }

    // 1) Create Supabase user
    const supabase = await createClientRSC();
    const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, username },
        emailRedirectTo: `${origin}/verified`,
      },
    });

    if (signUpErr) {
      console.error("Sign up error:", signUpErr);

      // Check for username already taken (unique constraint violation)
      if (
        String(signUpErr.message).toLowerCase().includes("unique") ||
        String(signUpErr.message).toLowerCase().includes("username") ||
        String(signUpErr.message).toLowerCase().includes("duplicate")
      ) {
        return Response.redirect(
          `${origin}/subscribe/${lookup}?error=username_taken`,
          303,
        );
      }

      // Check for "user already exists" error
      if (
        String(signUpErr.message)
          .toLowerCase()
          .includes("already registered") ||
        String(signUpErr.message)
          .toLowerCase()
          .includes("user already registered")
      ) {
        return Response.redirect(
          `${origin}/subscribe/${lookup}?error=account_exists`,
          303,
        );
      }

      // Check for rate limiting
      if (
        String(signUpErr.message).toLowerCase().includes("rate") ||
        String(signUpErr.message).toLowerCase().includes("too many")
      ) {
        return Response.redirect(
          `${origin}/subscribe/${lookup}?error=rate_limit`,
          303,
        );
      }

      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=unknown`,
        303,
      );
    }

    const userId = signUpRes.user?.id;
    if (!userId) {
      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=unknown`,
        303,
      );
    }

    // ✅ MailerLite pre-checkout sync (non-subscriber) — NEVER break subscribe flow
    try {
      const fullName =
        [firstName, lastName].filter(Boolean).join(" ").trim() || undefined;

      // role = null means "non-subscriber" path in your MailerLite grouping logic
      await syncMailerLiteGroups(email, null, fullName, "incomplete");
    } catch (e) {
      console.error(
        "[MailerLite] Pre-checkout sync failed (/api/subscribe)",
        e,
      );
    }

    // 2) Resolve the Price
    let price: Stripe.Price | null = null;
    if (lookup) {
      const { data } = await stripe.prices.list({
        active: true,
        type: "recurring",
        lookup_keys: [lookup],
        limit: 1,
        expand: ["data.product"],
      });
      price = data[0] ?? null;
    } else if (priceIdFromForm) {
      price = await stripe.prices.retrieve(priceIdFromForm, {
        expand: ["product"],
      });
    }

    if (!price || !price.active || !(price.product as Stripe.Product)?.active) {
      return Response.redirect(
        `${origin}/subscribe/${lookup}?error=invalid_plan`,
        303,
      );
    }

    const allowedTrialDays = getAllowedTrialDaysFromLookup(lookup);

    const intendedUserType = deriveUserTypeFromPrice(price);

    // 3) Ensure Stripe Customer
    const customerId = await ensureCustomer({
      id: userId,
      email: signUpRes.user?.email ?? email,
    });

    const successUrl = isActivateSignup
      ? `${origin}/activate/success?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = isActivateSignup
      ? `${origin}/activate/success?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`;

    // 4) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: userId,
      metadata: {
        user_type_intended: intendedUserType,
      },

      subscription_data: {
        trial_period_days: allowedTrialDays > 0 ? allowedTrialDays : undefined,
        metadata: {
          supabase_user_id: userId,
          plan_lookup: lookup || "",
          price_id: price.id,
          user_type_intended: intendedUserType, // keep
        },
      },

      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return Response.redirect(session.url!, 303);
  } catch (e) {
    console.error("Subscribe flow error:", e);

    // lookup is available from outer scope
    return Response.redirect(
      `${origin}/subscribe/${lookup || "business_monthly"}?error=unknown`,
      303,
    );
  }
}
