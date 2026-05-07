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
import { PauseActivatedEmail } from "../../../../../emails/PauseActivatedEmail";
import { ResumeConfirmationEmail } from "../../../../../emails/ResumeConfirmationEmail";
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
import { getUserIdForStripeCustomer } from "@/lib/billing/churn";
import { PaymentFailedEmail } from "../../../../../emails/PaymentFailedEmail";
import { siteUrl } from "@/lib/siteUrl";

const fromEmail = getEmailFrom();
const PAUSE_DURATION_DAYS = 30;

type AdminClient = ReturnType<typeof getAdmin>;

type ProfileLookup = {
  first_name?: string | null;
  display_name?: string | null;
  user_type?: string | null;
};

type ListingLookup = {
  title?: string | null;
};

type PauseLifecycleRow = {
  billing_issue_open?: boolean | null;
  dunning_canceled_email_sent_at?: string | null;
  cancellation_type?: string | null;
  cancellation_reason?: string | null;
  pause_status?: string | null;
  pause_starts_at?: string | null;
  pause_ends_at?: string | null;
  pause_reason?: string | null;
  listing_id?: string | null;
  purpose_sub?: string | null;
  cancellation_feedback?: string | null;
  cancellation_feedback_submitted?: boolean | null;
  cancellation_requested_at?: string | null;
  winback_email_sent_at?: string | null;
  dunning_stage?: string | null;
  last_dunning_email_sent_at?: string | null;
  pause_count?: number | null;
  last_pause_started_at?: string | null;
  pause_activated_email_sent_at?: string | null;
};

function getBaseUrl() {
  return typeof siteUrl === "function" ? siteUrl() : siteUrl;
}

function addDaysIso(startIso: string, days: number) {
  const date = new Date(startIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function getCustomerDisplayName({
  supabase,
  userId,
  stripeCustomer,
  fallbackEmail,
}: {
  supabase: AdminClient;
  userId?: string | null;
  stripeCustomer?: { name?: string | null } | null;
  fallbackEmail?: string | null;
}) {
  if (userId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("first_name, display_name")
      .eq("id", userId)
      .maybeSingle();

    const fromProfile = (prof?.first_name || prof?.display_name || "").trim();
    if (fromProfile) return fromProfile;
  }

  const fromStripe = (stripeCustomer?.name ?? "").trim();
  if (fromStripe) return fromStripe;

  const email = (fallbackEmail ?? "").trim();
  const prefix = email.split("@")[0] ?? "";
  if (prefix) return prefix.charAt(0).toUpperCase() + prefix.slice(1);

  return "";
}

async function getProfileForUser(admin: AdminClient, userId?: string | null) {
  if (!userId) return null;

  const { data } = await admin
    .from("profiles")
    .select("first_name, display_name, user_type")
    .eq("id", userId)
    .maybeSingle();

  return (data as ProfileLookup | null) ?? null;
}

async function getListingTitle(admin: AdminClient, listingId?: string | null) {
  if (!listingId) return null;

  const { data } = await admin
    .from("business_listings")
    .select("title")
    .eq("id", listingId)
    .maybeSingle();

  return (data as ListingLookup | null)?.title ?? null;
}

function getBestNameFromProfile(
  profile?: ProfileLookup | null,
  email?: string | null,
) {
  const firstName = profile?.first_name?.trim();
  if (firstName) return firstName;

  const displayName = profile?.display_name?.trim();
  if (displayName) return displayName;

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix
    ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    : "";
}

async function getEmailForSubscription(
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<string | null> {
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

async function getPausedBoostSubscriptionIdForListing(
  admin: AdminClient,
  listingId?: string | null,
) {
  if (!listingId) return null;

  const { data } = await admin
    .from("subscriptions")
    .select("id, pause_status, status, created")
    .eq("listing_id", listingId)
    .eq("purpose_sub", "listing_promo")
    .order("created", { ascending: false });

  const rows = Array.isArray(data) ? data : [];

  const preferred =
    rows.find((row) => row.pause_status === "active") ??
    rows.find((row) => row.pause_status === "scheduled") ??
    rows.find((row) => row.status === "canceled") ??
    rows[0];

  return preferred?.id ?? null;
}

async function finalizeResumeFromPause({
  admin,
  stripe,
  resend,
  sub,
  userId,
  resumedFromSubscriptionId,
  eventRef,
  listingIdHint,
  baseUrl,
}: {
  admin: AdminClient;
  stripe: Stripe;
  resend: ReturnType<typeof getResendClient>;
  sub: Stripe.Subscription;
  userId?: string | null;
  resumedFromSubscriptionId?: string | null;
  eventRef: string;
  listingIdHint?: string | null;
  baseUrl: string;
}) {
  if (!resumedFromSubscriptionId) return;

  const { data: existingNewRow } = await admin
    .from("subscriptions")
    .select(
      `
      id,
      pause_resumed_email_sent_at,
      last_pause_resumed_at
    `,
    )
    .eq("id", sub.id)
    .maybeSingle();

  const { data: oldPausedRow } = await admin
    .from("subscriptions")
    .select(
      `
      id,
      listing_id,
      pause_count,
      last_pause_started_at,
      last_pause_resumed_at
    `,
    )
    .eq("id", resumedFromSubscriptionId)
    .maybeSingle();

  if (!oldPausedRow) return;

  const listingId = oldPausedRow.listing_id ?? listingIdHint ?? null;
  const pausedBoostSubscriptionId =
    await getPausedBoostSubscriptionIdForListing(admin, listingId);
  const hadDependentBoost = !!pausedBoostSubscriptionId;
  const resumedAt =
    existingNewRow?.last_pause_resumed_at ?? new Date().toISOString();

  if (!existingNewRow?.last_pause_resumed_at) {
    await admin
      .from("subscriptions")
      .update({
        pause_count: oldPausedRow.pause_count ?? 0,
        last_pause_started_at: oldPausedRow.last_pause_started_at ?? null,
        last_pause_resumed_at: resumedAt,

        pause_status: null,
        pause_starts_at: null,
        pause_ends_at: null,
        pause_reason: null,
        pause_feedback: null,

        paused_boost_restore_pending: hadDependentBoost,
        paused_boost_subscription_id: pausedBoostSubscriptionId,
        paused_boost_restore_dismissed_at: null,
        paused_boost_restore_completed_at: null,
      })
      .eq("id", sub.id);
  }

  if (!oldPausedRow.last_pause_resumed_at) {
    await admin
      .from("subscriptions")
      .update({
        pause_status: null,
        paused_until: null,
        last_pause_resumed_at: resumedAt,
      })
      .eq("id", resumedFromSubscriptionId);
  }

  if (!resend || existingNewRow?.pause_resumed_email_sent_at) return;

  const toEmail = (await getEmailForSubscription(stripe, sub)) || null;
  if (!toEmail) return;

  const profile = await getProfileForUser(admin, userId);
  const listingTitle = await getListingTitle(admin, listingId);

  const mainItem = sub.items?.data?.[0];
  const price = mainItem?.price;
  const userType =
    profile?.user_type ?? resolveBaseRole(price, sub.metadata) ?? null;

  const name =
    getBestNameFromProfile(profile, toEmail) ||
    (await getCustomerDisplayName({
      supabase: admin,
      userId,
      stripeCustomer:
        typeof sub.customer === "object" &&
        sub.customer &&
        !("deleted" in sub.customer)
          ? { name: sub.customer.name ?? null }
          : null,
      fallbackEmail: toEmail,
    }));

  await resend.emails.send(
    {
      from: fromEmail,
      to: toEmail,
      subject: "Welcome back — your membership is active again",
      react: ResumeConfirmationEmail({
        name,
        userType,
        listingTitle,
        hasDependentBoost: hadDependentBoost,
        billingUrl: `${baseUrl}/dashboard/billing`,
        dashboardUrl: `${baseUrl}/dashboard`,
      }),
    },
    { idempotencyKey: `pause-resume-confirm:${eventRef}` },
  );

  await admin
    .from("subscriptions")
    .update({
      pause_resumed_email_sent_at: new Date().toISOString(),
    })
    .eq("id", sub.id);
}

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
      const raw = details["subscription"];
      if (typeof raw === "string") return raw;
      if (isObject(raw)) {
        const id = getString(raw, "id");
        if (id) return id;
      }
    }
  }

  return null;
}

type ListingEvaluationInsert = {
  listing_id: string;
  status: string;
  stripe_payment_intent_id?: string;
  access_type: string;
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
    const baseUrl = getBaseUrl();

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

        const isResumeFromPause =
          String(sess.metadata?.["resume_from_pause"] ?? "").toLowerCase() ===
          "true";

        const isAutoResumeFromPause =
          String(
            sess.metadata?.["auto_resume_from_pause"] ?? "",
          ).toLowerCase() === "true";

        const resumedFromSubscriptionId =
          (sess.metadata?.["resumed_from_subscription_id"] as
            | string
            | undefined) ?? null;

        if (isResumeFromPause || isAutoResumeFromPause) {
          try {
            await finalizeResumeFromPause({
              admin,
              stripe,
              resend,
              sub,
              userId,
              resumedFromSubscriptionId,
              eventRef: sess.id,
              listingIdHint:
                String(sess.metadata?.["listing_id"] ?? "") || null,
              baseUrl,
            });
          } catch (e) {
            console.error("Error handling resume-from-pause flow:", e);
          }
        }

        try {
          const uid = (sess.metadata?.["supabase_user_id"] ?? null) as
            | string
            | null;

          if (uid) {
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
                const dashboardUrl = `${baseUrl}/dashboard`;
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

                const membership = resolveBaseRole(
                  sub.items?.data?.[0]?.price,
                  sub.metadata,
                );

                if (membership) {
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

        if (promoErr) {
          console.error("listing_promotions upsert error:", promoErr);
        }

        const isRestoreFromPausedBoost =
          String(meta["restore_from_paused_boost"] ?? "").toLowerCase() ===
          "true";
        const parentSubscriptionId = String(
          meta["parent_subscription_id"] ?? "",
        );

        if (isRestoreFromPausedBoost && parentSubscriptionId) {
          await admin
            .from("subscriptions")
            .update({
              paused_boost_restore_pending: false,
              paused_boost_restore_dismissed_at: null,
              paused_boost_restore_completed_at: new Date().toISOString(),
            })
            .eq("id", parentSubscriptionId);
        }

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

      if (purpose === "evaluation" && listingId) {
        const piId =
          typeof sess.payment_intent === "string"
            ? (sess.payment_intent as string)
            : ((sess.payment_intent as Stripe.PaymentIntent | null)?.id ??
              null);

        const evaluationData: ListingEvaluationInsert = {
          listing_id: listingId,
          status: "completed",
          access_type: "paid",
          ...(piId && { stripe_payment_intent_id: piId }),
        };
        const { error: evalErr } = await admin
          .from("listing_evaluations" as never)
          .upsert(
            evaluationData as never,
            { onConflict: "listing_id" } as never,
          );

        if (evalErr) {
          console.error("listing_evaluations upsert error:", evalErr);
        }

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

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated"
    ) {
      const subObj = event.data.object as Stripe.Subscription;

      const sub = (await stripe.subscriptions.retrieve(subObj.id, {
        expand: ["items.data.price.product", "customer"],
      })) as Stripe.Subscription;

      await upsertSubscription(admin, sub);

      const isAutoResumeFromPause =
        String(sub.metadata?.["auto_resume_from_pause"] ?? "").toLowerCase() ===
        "true";

      const isResumeFromPause =
        String(sub.metadata?.["resume_from_pause"] ?? "").toLowerCase() ===
        "true";

      const resumedFromSubscriptionId =
        (sub.metadata?.["resumed_from_subscription_id"] as
          | string
          | undefined) ?? null;

      if (
        (type === "customer.subscription.created" ||
          type === "customer.subscription.updated") &&
        (isAutoResumeFromPause || isResumeFromPause) &&
        resumedFromSubscriptionId
      ) {
        try {
          let uid: string | null =
            (sub.metadata?.supabase_user_id as string | undefined) ?? null;

          const stripeCustomerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

          if (!uid && stripeCustomerId) {
            uid = await getUserIdForStripeCustomer(
              admin,
              stripe,
              stripeCustomerId,
            );
          }

          await finalizeResumeFromPause({
            admin,
            stripe,
            resend,
            sub,
            userId: uid,
            resumedFromSubscriptionId,
            eventRef: sub.id,
            listingIdHint:
              (sub.metadata?.["listing_id"] as string | undefined) ?? null,
            baseUrl,
          });
        } catch (e) {
          console.error("Error finalizing auto-resume lifecycle:", e);
        }
      }

      const mainItem = sub.items?.data?.[0];
      const price = mainItem?.price;

      const role = resolveBaseRole(price, sub.metadata);
      const grantsListing =
        String(price?.metadata?.grants_listing ?? "").toLowerCase() === "true";

      const isActive = sub.status === "active" || sub.status === "trialing";

      const stripeCustomerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

      let uid: string | null =
        (sub.metadata?.supabase_user_id as string | undefined) ?? null;

      if (!uid && stripeCustomerId) {
        const { data: mapRow, error: mapErr } = await admin
          .from("customers")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .maybeSingle();

        if (mapErr) {
          console.error("[award listing] customers map lookup error", mapErr);
        }

        uid = mapRow?.id ?? null;
      }

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

      if (uid && stripeCustomerId) {
        const { error: upErr } = await admin
          .from("customers")
          .upsert({ id: uid, stripe_customer_id: stripeCustomerId });

        if (upErr) {
          console.error("[award listing] customers upsert error", upErr);
        }
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
        const promoItem = sub.items?.data?.[0];
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub, promoItem);

        const { error: promoUpdErr } = await admin
          .from("listing_promotions")
          .update({
            status: sub.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id);

        if (promoUpdErr) {
          console.error("listing_promotions update error:", promoUpdErr);
        }
      }

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

    if (type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;

      const deletedLookup = await admin
        .from("subscriptions")
        .select(
          `
          billing_issue_open, 
          dunning_canceled_email_sent_at, 
          cancellation_type, 
          cancellation_reason,
          pause_status,
          pause_starts_at,
          pause_ends_at,
          pause_reason,
          listing_id,
          purpose_sub,
          cancellation_feedback,
          cancellation_feedback_submitted,
          cancellation_requested_at,
          winback_email_sent_at,
          dunning_stage,
          last_dunning_email_sent_at,
          pause_count,
          last_pause_started_at,
          pause_activated_email_sent_at
        `,
        )
        .eq("id", sub.id)
        .maybeSingle();

      const subRow = (deletedLookup.data as PauseLifecycleRow | null) ?? null;

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
                pricingUrl: `${baseUrl}/pricing`,
                billingUrl: `${baseUrl}/dashboard/billing`,
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
            cancellation_type: "dunning",
            cancellation_reason: "nonpayment",
          })
          .eq("id", sub.id);
      }

      await upsertSubscription(admin, sub);

      if (
        subRow?.pause_status === "scheduled" &&
        !subRow.billing_issue_open &&
        subRow.cancellation_type !== "dunning"
      ) {
        const nowIso = new Date().toISOString();
        const effectivePauseStart = subRow.pause_starts_at ?? nowIso;
        const effectivePauseEnd =
          subRow.pause_ends_at ??
          addDaysIso(effectivePauseStart, PAUSE_DURATION_DAYS);

        await admin
          .from("subscriptions")
          .update({
            pause_status: "active",
            pause_starts_at: effectivePauseStart,
            pause_ends_at: effectivePauseEnd,
            cancel_at_period_end: false,
            cancellation_type: null,
            cancellation_reason: null,
            cancellation_feedback: null,
            cancellation_feedback_submitted: false,
            cancellation_requested_at: null,
            winback_email_sent_at: null,
            pause_count: (subRow.pause_count ?? 0) + 1,
            last_pause_started_at: effectivePauseStart,
            billing_issue_open: false,
            dunning_stage: "none",
            last_dunning_email_sent_at: null,
            paused_until: effectivePauseEnd,
          })
          .eq("id", sub.id);

        if (subRow.listing_id) {
          await admin
            .from("subscriptions")
            .update({
              pause_status: "active",
              pause_starts_at: effectivePauseStart,
              pause_ends_at: effectivePauseEnd,
              cancellation_type: null,
              cancellation_reason: null,
              cancellation_feedback: null,
              cancellation_feedback_submitted: false,
              cancellation_requested_at: null,
              winback_email_sent_at: null,
              cancel_at_period_end: false,
              last_pause_started_at: effectivePauseStart,
              paused_until: effectivePauseEnd,
            })
            .eq("listing_id", subRow.listing_id)
            .eq("purpose_sub", "listing_promo");

          await admin
            .from("listing_promotions")
            .update({
              status: "canceled",
              cancel_at_period_end: false,
            })
            .eq("listing_id", subRow.listing_id);
        }

        const isBoostPause = subRow?.purpose_sub === "listing_promo";
        if (!isBoostPause && !subRow.pause_activated_email_sent_at && resend) {
          try {
            const toEmail = await getEmailForSubscription(stripe, sub);

            if (toEmail) {
              const customerId =
                typeof sub.customer === "string"
                  ? sub.customer
                  : sub.customer?.id;

              let uid: string | null =
                (sub.metadata?.supabase_user_id as string | undefined) ?? null;

              if (!uid && customerId) {
                uid = await getUserIdForStripeCustomer(
                  admin,
                  stripe,
                  customerId,
                );
              }

              const profile = await getProfileForUser(admin, uid);
              const listingTitle = await getListingTitle(
                admin,
                subRow.listing_id,
              );

              const mainItem = sub.items?.data?.[0];
              const price = mainItem?.price;
              const userType =
                profile?.user_type ??
                resolveBaseRole(price, sub.metadata) ??
                null;

              let hasDependentBoost = false;

              if (subRow.listing_id) {
                const { data: linkedPromo } = await admin
                  .from("subscriptions")
                  .select("id")
                  .eq("listing_id", subRow.listing_id)
                  .eq("purpose_sub", "listing_promo")
                  .limit(1);

                hasDependentBoost =
                  Array.isArray(linkedPromo) && linkedPromo.length > 0;
              }

              const name =
                getBestNameFromProfile(profile, toEmail) ||
                (await getCustomerDisplayName({
                  supabase: admin,
                  userId: uid,
                  stripeCustomer:
                    typeof sub.customer === "object" &&
                    sub.customer &&
                    !("deleted" in sub.customer)
                      ? { name: sub.customer.name ?? null }
                      : null,
                  fallbackEmail: toEmail,
                }));

              const idemKey = `pause-activated:${sub.id}`;

              await resend.emails.send(
                {
                  from: fromEmail,
                  to: toEmail,
                  subject: "Your membership is now paused",
                  react: PauseActivatedEmail({
                    name,
                    userType,
                    listingTitle,
                    hasDependentBoost,
                    billingUrl: `${baseUrl}/dashboard/billing`,
                  }),
                },
                { idempotencyKey: idemKey },
              );

              await admin
                .from("subscriptions")
                .update({
                  pause_activated_email_sent_at: new Date().toISOString(),
                })
                .eq("id", sub.id);
            }
          } catch (e) {
            console.error("Error sending pause activated email:", e);
          }
        }

        return new Response("ok", { status: 200 });
      }

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

        if (promoUpdErr) {
          console.error("listing_promotions update error:", promoUpdErr);
        }
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
                    dashboardUrl: `${baseUrl}/dashboard`,
                    billingUrl: `${baseUrl}/dashboard/billing`,
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
                  subRow.payment_recovered_email_sent_at ??
                  new Date().toISOString(),
                dunning_stage: "none",
                last_dunning_email_sent_at: null,
              })
              .eq("id", sub.id);
          }
        }

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

          const customerId =
            typeof inv.customer === "string" ? inv.customer : inv.customer?.id;

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

          if (toEmail) {
            const idemKey = `dunning-1:${inv.id}`;
            const updateBillingUrl = `${baseUrl}/dashboard/billing`;

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
