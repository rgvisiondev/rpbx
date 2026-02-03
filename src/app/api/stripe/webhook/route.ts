// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextRequest } from "next/server";
import ValuationEmail from "@/emails/ValuationEmail";
import SubscriptionConfirmationEmail from "@/emails/SubscriptionConfirmationEmail";
import BoostedListingEmail from "@/emails/BoostedListingEmail";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { getResendClient } from "@/lib/resend";
import { getBaseUrl, getBizEquityUrl, getCalendlyUrl } from "@/lib/envUrls";
import {
  extractPeriodISO,
  getAdmin,
  upsertSubscription,
  ensureListingForSubscription,
} from "@/lib/billing/subscriptionSync";

const subscribeNewsletter = async (email: string, membership: BaseRole) => {
  if (!email) return;
  const groups = ["172616011480041008", "172615978122740973"]; // Default newsletter group

  if (membership === "investor") {
    groups.push("172616029418030559"); // Investor group
  } else if (membership === "business") {
    groups.push("172616046280181040"); // Business group
  }

  const baseUrl = getBaseUrl();

  const res = await fetch(`${baseUrl}/api/ml-subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ email, groups }),
  });

  if (!res.ok) {
    console.error("Newsletter subscribe failed", await res.text());
  }
};

// Normalize Stripe event types
function norm(evtType: string) {
  if (evtType === "invoice_payment.paid") return "invoice.payment_succeeded";
  if (evtType === "invoice_payment.failed") return "invoice.payment_failed";
  return evtType;
}

type BaseRole = "business" | "investor" | null;

function resolveBaseRole(
  price: Stripe.Price | undefined,
  subMeta: Record<string, unknown> | null | undefined,
): BaseRole {
  if (!price) return null;
  const byMeta = String(price.metadata?.user_type ?? "").toLowerCase();
  if (byMeta === "business") return "business";
  if (byMeta === "investor") return "investor";
  const hinted = String(subMeta?.["user_type_intended"] ?? "").toLowerCase();
  if (hinted === "business") return "business";
  if (hinted === "investor") return "investor";
  const lk = String(price.lookup_key ?? "").toLowerCase();
  if (lk.startsWith("business_")) return "business";
  if (lk.startsWith("investor_")) return "investor";
  return null;
}

// Helper functions

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(obj: unknown, key: string): string | null {
  if (!isObject(obj)) return null;
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function extractSubscriptionIdFromInvoice(inv: Stripe.Invoice): string | null {
  const obj = inv as unknown as Record<string, unknown>;
  if ("subscription" in obj) {
    const raw = obj["subscription"];
    if (typeof raw === "string") return raw;
    if (isObject(raw)) {
      const id = getString(raw, "id");
      if (id) return id;
    }
  }
  const parent = isObject(obj["parent"])
    ? (obj["parent"] as Record<string, unknown>)
    : null;
  if (parent) {
    const details = isObject(parent["subscription_details"])
      ? (parent["subscription_details"] as Record<string, unknown>)
      : null;
    if (details && "subscription" in details) {
      const raw = (details as Record<string, unknown>)["subscription"];
      if (typeof raw === "string") return raw;
      if (isObject(raw)) {
        const id = getString(raw, "id");
        if (id) return id;
      }
    }
  }
  return null;
}

// Type for listing_evaluations insert
type ListingEvaluationInsert = {
  listing_id: string;
  status: string;
  stripe_payment_intent_id?: string;
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const endpointSecret = getWebhookSecret();
  if (!endpointSecret) {
    throw new Error("Stripe endpointSecret not configured");
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = stripe.webhooks.constructEvent(raw, sig, endpointSecret);
  } catch (e) {
    console.error("Signature verification failed:", e);
    return new Response("Bad signature", { status: 400 });
  }

  const type = norm(event.type);
  console.log("Stripe event (norm):", type);

  try {
    const admin = getAdmin();
    const resend = getResendClient();

    if (type === "checkout.session.completed") {
      const sess = event.data.object as Stripe.Checkout.Session;

      const userId = (sess.metadata?.["supabase_user_id"] ?? null) as
        | string
        | null;
      const customerId =
        typeof sess.customer === "string"
          ? (sess.customer as string)
          : ((sess.customer as Stripe.Customer | null)?.id ?? null);

      if (userId && customerId) {
        const { error } = await admin
          .from("customers")
          .upsert({ id: userId, stripe_customer_id: customerId });
        if (error) console.error("customers upsert error:", error);
      }

      if (sess.mode === "subscription" && sess.subscription) {
        const subId =
          typeof sess.subscription === "string"
            ? (sess.subscription as string)
            : (sess.subscription as Stripe.Subscription).id;
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        });
        await upsertSubscription(admin, sub);

        // Send subscription confirmation email for initial subscriptions
        try {
          const uid = (sess.metadata?.["supabase_user_id"] ?? null) as
            | string
            | null;
          if (uid) {
            // Check if user already had other subscriptions (excluding this one)
            const { data: otherSubs } = await admin
              .from("subscriptions")
              .select("id")
              .eq("user_id", uid)
              .neq("id", sub.id)
              .limit(1);

            const hadPrevious =
              Array.isArray(otherSubs) && otherSubs.length > 0;
            if (!hadPrevious) {
              let toEmail: string | null =
                (sess.customer_details?.email as string | null) ||
                (sess.customer_email as string | null) ||
                null;

              if (!toEmail) {
                const { data: invRow } = await admin
                  .from("investor_profiles")
                  .select("contact_email")
                  .eq("user_id", uid)
                  .maybeSingle();
                toEmail = invRow?.contact_email ?? null;
              }

              if (!toEmail) {
                const { data: listingRow } = await admin
                  .from("business_listings")
                  .select("contact_email")
                  .eq("owner_id", uid)
                  .limit(1)
                  .maybeSingle();
                toEmail = listingRow?.contact_email ?? null;
              }

              if (toEmail) {
                const dashboardUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`;
                const idemKey = `sub-confirm:${sess.id}`;
                await resend.emails.send(
                  {
                    from: "RioPlex <notifications@rioplexbizx.com>",
                    to: toEmail,
                    subject: "Your RPBX subscription is active",
                    react: SubscriptionConfirmationEmail({ dashboardUrl }),
                  },
                  { idempotencyKey: idemKey },
                );
                // for new subscribers, also subscribe to newsletter
                const membership = resolveBaseRole(
                  sub.items?.data?.[0]?.price,
                  sub.metadata,
                );

                if (membership) {
                  await subscribeNewsletter(toEmail, membership);
                }
              } else {
                console.warn(
                  "No email found for subscription confirmation; skipped email send.",
                );
              }
            }
          }
        } catch (e) {
          console.error("Error sending subscription confirmation email:", e);
        }
      }

      const meta = sess.metadata || {};
      const purpose = String(meta["purpose"] ?? "");
      const listingId = String(meta["listing_id"] ?? "");

      if (purpose === "listing_plan" && sess.subscription) {
        const subId =
          typeof sess.subscription === "string"
            ? sess.subscription
            : (sess.subscription as Stripe.Subscription).id;

        const uid = (sess.metadata?.["supabase_user_id"] ?? null) as
          | string
          | null;
        if (!uid) {
          console.error("Missing supabase_user_id on listing_plan session");
          return new Response("ok", { status: 200 });
        }

        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        });

        await ensureListingForSubscription(admin, stripe, sub, uid);

        return new Response("ok", { status: 200 });
      }

      // Boosted Listing
      if (purpose === "listing_promo" && sess.subscription && listingId) {
        const subId =
          typeof sess.subscription === "string"
            ? (sess.subscription as string)
            : (sess.subscription as Stripe.Subscription).id;
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price", "customer"],
        });

        const mainItem = sub.items?.data?.[0];
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub, mainItem);

        const { error: promoErr } = await admin
          .from("listing_promotions")
          .upsert(
            {
              listing_id: listingId,
              stripe_subscription_id: sub.id,
              status: sub.status,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: sub.cancel_at_period_end ?? false,
            },
            { onConflict: "stripe_subscription_id" },
          );
        if (promoErr)
          console.error("listing_promotions upsert error:", promoErr);

        let toEmail: string | null =
          (sess.customer_details?.email as string | null) ||
          (sess.customer_email as string | null) ||
          null;

        if (!toEmail) {
          const { data: listingRow } = await admin
            .from("business_listings")
            .select("contact_email")
            .eq("id", listingId)
            .maybeSingle();
          toEmail = listingRow?.contact_email ?? null;
        }

        if (toEmail) {
          const idemKey = `promo-email:${sess.id}`;
          await resend.emails.send(
            {
              from: "RioPlex <notifications@rioplexbizx.com>",
              to: toEmail,
              subject: "Your Boosted Listing is now active",
              react: BoostedListingEmail(),
            },
            { idempotencyKey: idemKey },
          );
        } else {
          console.warn(
            "No email found for boosted listing purchase; skipped email send.",
          );
        }
      }

      // Business Evaluation
      if (purpose === "evaluation" && listingId) {
        const piId =
          typeof sess.payment_intent === "string"
            ? (sess.payment_intent as string)
            : ((sess.payment_intent as Stripe.PaymentIntent | null)?.id ??
              null);

        const evaluationData: ListingEvaluationInsert = {
          listing_id: listingId,
          status: "purchased",
          ...(piId && { stripe_payment_intent_id: piId }),
        };

        // Use a generic query builder approach
        const { error: evalErr } = await admin
          .from("listing_evaluations" as never)
          .upsert(
            evaluationData as never,
            { onConflict: "listing_id" } as never,
          );

        if (evalErr)
          console.error("listing_evaluations upsert error:", evalErr);

        let toEmail: string | null =
          (sess.customer_details?.email as string | null) ||
          (sess.customer_email as string | null) ||
          null;

        if (!toEmail) {
          const { data: listingRow } = await admin
            .from("business_listings")
            .select("contact_email")
            .eq("id", listingId)
            .maybeSingle();
          toEmail = listingRow?.contact_email ?? null;
        }

        if (toEmail) {
          const evaluationLink = getBizEquityUrl();
          const calendlyLink = getCalendlyUrl();
          const idemKey = `eval-email:${piId ?? sess.id}`;
          await resend.emails.send(
            {
              from: "RioPlex <notifications@rioplexbizx.com>",
              to: toEmail,
              subject: "Your RPBX Valuation is ready to begin",
              react: ValuationEmail({
                link: evaluationLink,
                calendlyLink,
              }),
            },
            { idempotencyKey: idemKey },
          );
        } else {
          console.warn(
            "No email found for valuation purchase; skipped email send.",
          );
        }
      }

      if (purpose === "evaluation_public") {
        const piId =
          typeof sess.payment_intent === "string"
            ? (sess.payment_intent as string)
            : ((sess.payment_intent as Stripe.PaymentIntent | null)?.id ??
              null);

        const toEmail: string | null =
          (sess.customer_details?.email as string | null) ||
          (sess.customer_email as string | null) ||
          null;

        if (!toEmail) {
          console.warn(
            "No email found for public valuation; skipped email send",
          );
          return new Response("ok", { status: 200 });
        }

        const evaluationLink = getBizEquityUrl();
        const calendlyLink = getCalendlyUrl();

        const idemKey = `public-eval-email:${piId ?? sess.id}`;
        await resend.emails.send(
          {
            from: "RioPlex <notifications@rioplexbizx.com>",
            to: toEmail,
            subject: "Your RPBX Valuation is ready to begin",
            react: ValuationEmail({
              link: evaluationLink,
              calendlyLink,
            }),
          },
          { idempotencyKey: idemKey },
        );

        try {
          await admin.from("public_valuations").insert({
            stripe_payment_intent_id: piId,
            stripe_session_id: sess.id,
            email: toEmail,
          });
        } catch (e) {
          console.error("Failed to insert public_valuation row", e);
        }
      }

      return new Response("ok", { status: 200 });
    }

    // Handle created / updated subscription events with expanded data
    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated"
    ) {
      const subObj = event.data.object as Stripe.Subscription;
      const sub = await stripe.subscriptions.retrieve(subObj.id, {
        expand: ["items.data.price.product", "customer"],
      });

      await upsertSubscription(admin, sub);

      // ✅ Declare ONCE
      const mainItem = sub.items?.data?.[0];
      const price = mainItem?.price;

      // -----------------------------
      // 1) AWARD LISTING (entitlement)
      // -----------------------------
      const role = resolveBaseRole(price, sub.metadata);
      const grantsListing =
        String(price?.metadata?.grants_listing ?? "").toLowerCase() === "true";

      const isActive = sub.status === "active" || sub.status === "trialing";

      // --- Resolve uid robustly ---
      const stripeCustomerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

      let uid: string | null =
        (sub.metadata?.supabase_user_id as string | undefined) ?? null;

      // If not present on sub.metadata, try customers mapping
      if (!uid && stripeCustomerId) {
        const { data: mapRow, error: mapErr } = await admin
          .from("customers")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .maybeSingle();

        if (mapErr)
          console.error("[award listing] customers map lookup error", mapErr);
        uid = mapRow?.id ?? null;
      }

      // If still missing, last resort: retrieve customer and check metadata
      if (!uid && stripeCustomerId) {
        try {
          const cust = await stripe.customers.retrieve(stripeCustomerId);
          const metaUid =
            "deleted" in cust
              ? null
              : ((cust.metadata?.supabase_user_id as string | undefined) ??
                null);
          uid = metaUid ?? null;
        } catch (e) {
          console.error(
            "[award listing] failed to retrieve customer for uid",
            e,
          );
        }
      }

      // If we found uid + customerId, ensure customers table is synced (prevents future misses)
      if (uid && stripeCustomerId) {
        const { error: upErr } = await admin
          .from("customers")
          .upsert({ id: uid, stripe_customer_id: stripeCustomerId });
        if (upErr)
          console.error("[award listing] customers upsert error", upErr);
      }

      console.log("[award listing] resolved uid:", {
        uid,
        stripeCustomerId,
        role,
        grantsListing,
        status: sub.status,
        subId: sub.id,
      });

      if (role === "business" && grantsListing && isActive) {
        if (!uid) {
          console.error(
            "[award listing] cannot award listing: uid unresolved",
            {
              subId: sub.id,
              stripeCustomerId,
              subMeta: sub.metadata,
            },
          );
        } else {
          const listingId = await ensureListingForSubscription(
            admin,
            stripe,
            sub,
            uid,
          );
          console.log("[award listing] ensureListingForSubscription result:", {
            subId: sub.id,
            uid,
            listingId,
          });
        }
      }

      if ((sub.metadata?.purpose ?? "") === "listing_promo") {
        const mainItem = sub.items?.data?.[0];
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub, mainItem);
        const { error: promoUpdErr } = await admin
          .from("listing_promotions")
          .update({
            status: sub.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id);
        if (promoUpdErr)
          console.error("listing_promotions update error:", promoUpdErr);
      }

      return new Response("ok", { status: 200 });
    }

    // Handle deleted subscription events without retrieving from Stripe
    if (type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      // This will mark status = 'canceled', set ended_at, cancel_at, etc.
      await upsertSubscription(admin, sub);

      // If this was a promo sub, keep listing_promotions in sync too
      if ((sub.metadata?.purpose ?? "") === "listing_promo") {
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub);
        const { error: promoUpdErr } = await admin
          .from("listing_promotions")
          .update({
            status: sub.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id);
        if (promoUpdErr)
          console.error("listing_promotions update error:", promoUpdErr);
      }

      return new Response("ok", { status: 200 });
    }

    if (
      type === "invoice.payment_succeeded" ||
      type === "invoice.payment_failed" ||
      type === "invoice.paid"
    ) {
      const inv = event.data.object as Stripe.Invoice;
      const subId = extractSubscriptionIdFromInvoice(inv);
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        });
        await upsertSubscription(admin, sub);
      } else {
        console.warn("Invoice had no resolvable subscription id");
      }
      return new Response("ok", { status: 200 });
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("Unhandled webhook error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
