// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextRequest } from "next/server";
import ValuationEmail from "../../../../../emails/ValuationEmail";
import SubscriptionConfirmationEmail from "../../../../../emails/SubscriptionConfirmationEmail";
import BoostedListingEmail from "../../../../../emails/BoostedListingEmail";
import { PaymentRecoveredEmail } from "../../../../../emails/PaymentRecoveredEmail";
import { SubscriptionCanceledForNonpaymentEmail } from "../../../../../emails/SubscriptionCanceledForNonpaymentEmail";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { getBizEquityUrl, getCalendlyUrl } from "@/lib/envUrls";
import {
  extractPeriodISO,
  getAdmin,
  upsertSubscription,
  ensureListingForSubscription,
} from "@/lib/billing/subscriptionSync";

import { syncMailerLiteGroups } from "@/lib/mailerlite/mailerlite";

import {
  getUserIdForStripeCustomer,
  getCancellationReasonForSub,
  getContactEmailForUser,
} from "@/lib/billing/churn";
import { PaymentFailedEmail } from "../../../../../emails/PaymentFailedEmail";

import { siteUrl } from "@/lib/siteUrl";

const fromEmail = getEmailFrom();

async function getCustomerDisplayName({
  supabase,
  userId,
  stripeCustomer,
  fallbackEmail,
}: {
  supabase: any;
  userId?: string | null;
  stripeCustomer?: { name?: string | null } | null;
  fallbackEmail?: string | null;
}) {
  // 1) profiles table
  if (userId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("first_name, display_name")
      .eq("id", userId)
      .maybeSingle();

    const fromProfile = (prof?.first_name || prof?.display_name || "").trim();
    if (fromProfile) return fromProfile;
  }

  // 2) Stripe customer name
  const fromStripe = (stripeCustomer?.name ?? "").trim();
  if (fromStripe) return fromStripe;

  // 3) email prefix
  const email = (fallbackEmail ?? "").trim();
  const prefix = email.split("@")[0] ?? "";
  if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);

  return ""; // caller can decide "Hi," vs "Hi {name},"
}

// -----------------------------
// MailerLite helper (ONLY for sub-created/updated sync email extraction)
// -----------------------------
async function getEmailForSubscription(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<string | null> {
  // Prefer expanded customer email if present and not deleted
  if (
    typeof sub.customer === "object" &&
    sub.customer &&
    !("deleted" in sub.customer)
  ) {
    return sub.customer.email ?? null;
  }

  const customerId =
    typeof sub.customer === "string"
      ? sub.customer
      : (sub.customer?.id ?? null);

  if (!customerId) return null;

  try {
    const cust = await stripe.customers.retrieve(customerId);
    if ("deleted" in cust) return null;
    return cust.email ?? null;
  } catch (e) {
    console.error("[MailerLite] Failed to retrieve customer for email", e);
    return null;
  }
}

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
        const sub = (await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        })) as Stripe.Subscription;

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
                const dashboardUrl = `${siteUrl()}/dashboard`;
                const idemKey = `sub-confirm:${sess.id}`;
                await resend.emails.send(
                  {
                    from: fromEmail,
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
                  // ✅ MailerLite sync (place #1) — wrapped so it never breaks webhook
                  try {
                    await syncMailerLiteGroups(
                      toEmail,
                      membership,
                      undefined,
                      "subscription",
                    );
                  } catch (e) {
                    console.error("[MailerLite] Sync failed (checkout)", e);
                  }
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

        const sub = (await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        })) as Stripe.Subscription;

        await ensureListingForSubscription(admin, stripe, sub, uid);

        return new Response("ok", { status: 200 });
      }

      // Boosted Listing
      if (purpose === "listing_promo" && sess.subscription && listingId) {
        const subId =
          typeof sess.subscription === "string"
            ? (sess.subscription as string)
            : (sess.subscription as Stripe.Subscription).id;
        const sub = (await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price", "customer"],
        })) as Stripe.Subscription;

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
              from: fromEmail,
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
              from: fromEmail,
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
            from: fromEmail,
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
      const sub = (await stripe.subscriptions.retrieve(subObj.id, {
        expand: ["items.data.price.product", "customer"],
      })) as Stripe.Subscription;

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

      // ✅ MailerLite sync (place #2) — wrapped so it never breaks webhook
      if (role) {
        try {
          const email = await getEmailForSubscription(stripe, sub);
          if (email) {
            await syncMailerLiteGroups(email, role, undefined, "subscription");
          }
        } catch (e) {
          console.error(
            "[MailerLite] Sync failed (subscription created/updated)",
            e,
          );
        }
      }

      return new Response("ok", { status: 200 });
    }

    // Handle deleted subscription events without retrieving from Stripe
    if (type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      // Check if cancellation was due to billing issues
      const { data: subRow } = await admin
        .from("subscriptions")
        .select("billing_issue_open, dunning_canceled_email_sent_at")
        .eq("id", sub.id)
        .maybeSingle();

      if (
        subRow?.billing_issue_open &&
        !subRow.dunning_canceled_email_sent_at
      ) {
        const toEmail = await getEmailForSubscription(stripe, sub);

        if (toEmail) {
          const idemKey = `canceled-dunning:${sub.id}`;

          const customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

          const stripeCustomer = customerId
            ? await stripe.customers.retrieve(customerId)
            : null;

          let uid: string | null =
            (sub.metadata?.supabase_user_id as string | undefined) ?? null;

          if (!uid && customerId) {
            uid = await getUserIdForStripeCustomer(admin, stripe, customerId);
          }

          const name = await getCustomerDisplayName({
            supabase: admin,
            userId: uid,
            stripeCustomer:
              stripeCustomer &&
              typeof stripeCustomer === "object" &&
              !("deleted" in stripeCustomer)
                ? { name: stripeCustomer.name ?? null }
                : null,
            fallbackEmail: toEmail,
          });

          await resend.emails.send(
            {
              from: fromEmail,
              to: toEmail,
              subject: "Your membership has been canceled",
              react: SubscriptionCanceledForNonpaymentEmail({
                name,
                pricingUrl: `${siteUrl()}/pricing`,
                billingUrl: `${siteUrl()}/dashboard/billing`,
              }),
            },
            { idempotencyKey: idemKey },
          );
        }
        await admin
          .from("subscriptions")
          .update({
            billing_issue_open: false,
            dunning_canceled_email_sent_at: new Date().toISOString(),
          })
          .eq("id", sub.id);
      }

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
        const sub = (await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "customer"],
        })) as Stripe.Subscription;
        await upsertSubscription(admin, sub);
        if (type === "invoice.payment_succeeded" || type === "invoice.paid") {
          const { data: subRow } = await admin
            .from("subscriptions")
            .select("billing_issue_open, payment_recovered_email_sent_at")
            .eq("id", sub.id)
            .maybeSingle();

          if (subRow?.billing_issue_open) {
            const toEmail =
              (inv.customer_email as string | null) ||
              (await getEmailForSubscription(stripe, sub)) ||
              null;

            if (toEmail && !subRow.payment_recovered_email_sent_at) {
              const idemKey = `recovered:${inv.id}`;

              const customerId =
                typeof inv.customer === "string"
                  ? inv.customer
                  : inv.customer?.id;

              const stripeCustomer = customerId
                ? await stripe.customers.retrieve(customerId)
                : null;

              let uid: string | null =
                (sub.metadata?.supabase_user_id as string | undefined) ?? null;

              if (!uid && customerId) {
                uid = await getUserIdForStripeCustomer(
                  admin,
                  stripe,
                  customerId,
                );
              }

              const name = await getCustomerDisplayName({
                supabase: admin,
                userId: uid,
                stripeCustomer:
                  stripeCustomer &&
                  typeof stripeCustomer === "object" &&
                  !("deleted" in stripeCustomer)
                    ? { name: stripeCustomer.name ?? null }
                    : null,
                fallbackEmail: toEmail,
              });

              await resend.emails.send(
                {
                  from: fromEmail,
                  to: toEmail,
                  subject: "Your payment was successful",
                  react: PaymentRecoveredEmail({
                    name,
                    dashboardUrl: `${siteUrl()}/dashboard`,
                    billingUrl: `${siteUrl()}/dashboard/billing`,
                  }),
                },
                { idempotencyKey: idemKey },
              );
            }

            await admin
              .from("subscriptions")
              .update({
                billing_issue_open: false,
                payment_recovered_email_sent_at:
                  subRow?.payment_recovered_email_sent_at ??
                  new Date().toISOString(),
              })
              .eq("id", sub.id);
          }
        }

        // failed payment email
        if (type === "invoice.payment_failed") {
          const { data: existingSub } = await admin
            .from("subscriptions")
            .select("billing_issue_open, first_payment_failed_at")
            .eq("id", sub.id)
            .maybeSingle();

          await admin
            .from("subscriptions")
            .update({
              billing_issue_open: true,
              first_payment_failed_at:
                existingSub?.first_payment_failed_at ??
                new Date().toISOString(),
            })
            .eq("id", sub.id);

          const toEmail =
            (inv.customer_email as string | null) ||
            (await getEmailForSubscription(stripe, sub)) ||
            null;

          // Fetch Stripe customer (for name fallback)
          const customerId =
            typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

          const stripeCustomer = customerId
            ? await stripe.customers.retrieve(customerId)
            : null;

          // Resolve supabase user id (best effort)
          let uid: string | null =
            (sub.metadata?.supabase_user_id as string | undefined) ?? null;

          if (!uid && customerId) {
            uid = await getUserIdForStripeCustomer(admin, stripe, customerId);
          }

          const name = await getCustomerDisplayName({
            supabase: admin,
            userId: uid,
            stripeCustomer:
              stripeCustomer &&
              typeof stripeCustomer === "object" &&
              !("deleted" in stripeCustomer)
                ? { name: stripeCustomer.name ?? null }
                : null,
            fallbackEmail: toEmail,
          });

          if (toEmail) {
            const idemKey = `dunning-1:${inv.id}`;
            const updateBillingUrl = `${siteUrl()}/dashboard/billing`;

            await resend.emails.send(
              {
                from: fromEmail,
                to: toEmail,
                subject: "Action required: update your payment method",
                react: PaymentFailedEmail({
                  name,
                  updateBillingUrl,
                }),
              },
              { idempotencyKey: idemKey },
            );
          }
        }
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
