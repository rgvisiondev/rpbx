// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/database.types";
import { Resend } from "resend";
import ValuationEmail from "@/emails/ValuationEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const BIZ_EQUITY_BASE = process.env.BIZEQUITY_URL!;
const resend = new Resend(process.env.RESEND_API_KEY!);

function getAdmin(): SupabaseClient<Database> {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function buildBizEquityLink(listingId: string) {
  const url = new URL(BIZ_EQUITY_BASE);
  url.searchParams.set("listing_id", listingId);
  return url.toString();
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
  subMeta: Record<string, unknown> | null | undefined
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
const toISO = (unix: number | null | undefined) =>
  typeof unix === "number" ? new Date(unix * 1000).toISOString() : null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(obj: unknown, key: string): string | null {
  if (!isObject(obj)) return null;
  const v = obj[key];
  return typeof v === "string" ? v : null;
}

function getNumber(obj: unknown, key: string): number | null {
  if (!isObject(obj)) return null;
  const v = obj[key];
  return typeof v === "number" ? v : null;
}

function extractPeriodISO(
  sub: Stripe.Subscription,
  item?: Stripe.SubscriptionItem
): { startISO: string; endISO: string } {
  if (item && isObject(item)) {
    const s = getNumber(item, "current_period_start");
    const e = getNumber(item, "current_period_end");
    if (s !== null || e !== null) {
      return {
        startISO: toISO(s) ?? new Date().toISOString(),
        endISO: toISO(e) ?? new Date().toISOString(),
      };
    }
  }
  const subUnknown = sub as unknown;
  const s2 = getNumber(subUnknown, "current_period_start");
  const e2 = getNumber(subUnknown, "current_period_end");
  if (s2 !== null || e2 !== null) {
    return {
      startISO: toISO(s2) ?? new Date().toISOString(),
      endISO: toISO(e2) ?? new Date().toISOString(),
    };
  }
  const now = new Date().toISOString();
  return { startISO: now, endISO: now };
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

async function upsertSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription
) {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!stripeCustomerId) return;

  const { data: mapRow } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  let userId = mapRow?.id ?? null;

  if (!userId) {
    const cust =
      typeof sub.customer === "string"
        ? await stripe.customers.retrieve(sub.customer)
        : (sub.customer as Stripe.Customer);
    const metaUserId = (cust as Stripe.Customer).metadata?.supabase_user_id;
    if (metaUserId) {
      await admin
        .from("customers")
        .upsert({ id: metaUserId, stripe_customer_id: stripeCustomerId });
      userId = metaUserId;
    }
  }

  if (!userId) {
    console.warn("No user mapping for stripe_customer_id:", stripeCustomerId);
    return;
  }

  const item = sub.items?.data?.[0];
  const price = item?.price ?? undefined;
  const { startISO: currentPeriodStart, endISO: currentPeriodEnd } =
    extractPeriodISO(sub, item);

  const product =
    typeof price?.product === "string"
      ? null
      : (price?.product as Stripe.Product | null);

  const subMetadata: Record<string, string> = sub.metadata ?? {};
  const priceMetadata: Record<string, string> = price?.metadata ?? {};
  const productMetadata: Record<string, string> = product?.metadata ?? {};

  const row: TablesInsert<"subscriptions"> = {
    id: sub.id,
    user_id: userId,
    status: sub.status as Database["public"]["Enums"]["subscription_status"],
    price_id: price?.id ?? null,
    quantity: item?.quantity ?? null,
    metadata: subMetadata as unknown as TablesInsert<"subscriptions">["metadata"],
    cancel_at: toISO(sub.cancel_at ?? null),
    cancel_at_period_end: sub.cancel_at_period_end ?? null,
    canceled_at: toISO(sub.canceled_at ?? null),
    created: toISO(sub.created) ?? new Date().toISOString(),
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    ended_at: toISO(sub.ended_at ?? null),
    trial_start: toISO(sub.trial_start ?? null),
    trial_end: toISO(sub.trial_end ?? null),
    product_id:
      typeof price?.product === "string" ? price?.product : product?.id ?? null,
    product_name: product?.name ?? null,
    price_currency: price?.currency ?? null,
    price_unit_amount: price?.unit_amount ?? null,
    price_interval: price?.recurring?.interval ?? null,
    price_interval_count: price?.recurring?.interval_count ?? null,
    price_nickname: price?.nickname ?? null,
    price_lookup_key: price?.lookup_key ?? null,
    price_metadata: priceMetadata as unknown as TablesInsert<"subscriptions">["price_metadata"],
    product_metadata: productMetadata as unknown as TablesInsert<"subscriptions">["product_metadata"],
  };

  const { error } = await admin.from("subscriptions").upsert(row);
  if (error) console.error("subscriptions upsert error:", error);
  else console.log(`upserted subscription ${sub.id} for user ${userId}`);
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

    if (type === "checkout.session.completed") {
      const sess = event.data.object as Stripe.Checkout.Session;

      const userId = (sess.metadata?.["supabase_user_id"] ?? null) as string | null;
      const customerId =
        typeof sess.customer === "string"
          ? (sess.customer as string)
          : (sess.customer as Stripe.Customer | null)?.id ?? null;

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
      }

      const meta = sess.metadata || {};
      const purpose = String(meta["purpose"] ?? "");
      const listingId = String(meta["listing_id"] ?? "");

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

        const { error: promoErr } = await admin.from("listing_promotions").upsert(
          {
            listing_id: listingId,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          },
          { onConflict: "stripe_subscription_id" }
        );
        if (promoErr) console.error("listing_promotions upsert error:", promoErr);
      }

      // Business Evaluation
      if (purpose === "evaluation" && listingId) {
        const piId =
          typeof sess.payment_intent === "string"
            ? (sess.payment_intent as string)
            : (sess.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

        const evaluationData: ListingEvaluationInsert = {
          listing_id: listingId,
          status: "purchased",
          ...(piId && { stripe_payment_intent_id: piId }),
        };

        // Use a generic query builder approach
        const { error: evalErr } = await admin
          .from("listing_evaluations" as never)
          .upsert(evaluationData as never, { onConflict: "listing_id" } as never);

        if (evalErr) console.error("listing_evaluations upsert error:", evalErr);

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
          const evaluationLink = buildBizEquityLink(listingId);
          const idemKey = `eval-email:${piId ?? sess.id}`;
          await resend.emails.send(
            {
              from: "RioPlex <valuations@rioplexbizx.com>",
              to: toEmail,
              subject: "Your Business Valuation Link",
              react: ValuationEmail({ link: evaluationLink }),
            },
            { idempotencyKey: idemKey }
          );
        } else {
          console.warn("No email found for valuation purchase; skipped email send.");
        }
      }

      return new Response("ok", { status: 200 });
    }

    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const subObj = event.data.object as Stripe.Subscription;
      const sub = await stripe.subscriptions.retrieve(subObj.id, {
        expand: ["items.data.price.product", "customer"],
      });

      await upsertSubscription(admin, sub);

      const price = sub.items?.data?.[0]?.price;
      const role = resolveBaseRole(price, sub.metadata);
      if (role) {
        const nextType =
          sub.status === "active" || sub.status === "trialing" ? role : "member";
        const stripeCustomerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (stripeCustomerId) {
          const { data: mapRow } = await admin
            .from("customers")
            .select("id")
            .eq("stripe_customer_id", stripeCustomerId)
            .maybeSingle();
          const uid = mapRow?.id;
          if (uid) {
            const { error: updErr } = await admin
              .from("profiles")
              .update({ user_type: nextType })
              .eq("id", uid);
            if (updErr) console.error("profiles update error:", updErr);
            else console.log(`profiles.user_type=${nextType} for user ${uid}`);
          }
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
        if (promoUpdErr) console.error("listing_promotions update error:", promoUpdErr);
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