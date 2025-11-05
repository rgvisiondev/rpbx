// app/api/stripe/webhook/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Stripe from "stripe";
import { NextRequest } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/database.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // (optionally pin apiVersion)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const BIZ_EQUITY_BASE = process.env.BIZEQUITY_URL!;

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

// Normalize Stripe event types so we handle both new underscore and classic dot styles.
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

// -----------------------------
// Helpers to avoid `any` usage
// -----------------------------

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

/** Probe different shapes for period fields without relying on TS types exposing them */
function extractPeriodISO(
  sub: Stripe.Subscription,
  item?: Stripe.SubscriptionItem
): { startISO: string; endISO: string } {
  // Try subscription item first
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

  // Then try subscription object (for accounts/types that expose these)
  const subUnknown = sub as unknown;
  const s2 = getNumber(subUnknown, "current_period_start");
  const e2 = getNumber(subUnknown, "current_period_end");
  if (s2 !== null || e2 !== null) {
    return {
      startISO: toISO(s2) ?? new Date().toISOString(),
      endISO: toISO(e2) ?? new Date().toISOString(),
    };
  }

  // Fallback (unknown billing period shape)
  const now = new Date().toISOString();
  return { startISO: now, endISO: now };
}

/** Derive subscription id from an invoice even if local TS types don’t expose it */
function extractSubscriptionIdFromInvoice(inv: Stripe.Invoice): string | null {
  const obj = inv as unknown as Record<string, unknown>;

  // 1) Common: inv.subscription (may be string or object with id)
  if ("subscription" in obj) {
    const raw = obj["subscription"];
    if (typeof raw === "string") return raw;
    if (isObject(raw)) {
      const id = getString(raw, "id");
      if (id) return id;
    }
  }

  // 2) Nested experimental/alt shapes: parent.subscription_details.subscription
  const parent = isObject(obj["parent"]) ? (obj["parent"] as Record<string, unknown>) : null;
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

// -----------------------------------
// Upsert subscription (no `any` used)
// -----------------------------------
async function upsertSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription
) {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!stripeCustomerId) return;

  // Map stripe customer -> supabase user
  const { data: mapRow } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  let userId = mapRow?.id ?? null;

  // Fallback to Stripe customer metadata if mapping not present yet
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

  // Main item + price snapshot
  const item = sub.items?.data?.[0];
  const price = item?.price ?? undefined;

  // Periods from item or subscription, probed safely
  const { startISO: currentPeriodStart, endISO: currentPeriodEnd } = extractPeriodISO(sub, item);

  // Avoid extra API call if product is id; snapshot if expanded
  const product =
    typeof price?.product === "string" ? null : (price?.product as Stripe.Product | null);

  // Stripe metadata are Record<string, string>
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

    // Snapshots (optional, but handy)
    product_id: typeof price?.product === "string" ? price?.product : product?.id ?? null,
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

// ------------------
// Webhook handler
// ------------------
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
    // A) After checkout: map customer -> user and write first sub row
    if (type === "checkout.session.completed") {
      const admin = getAdmin(); // moved inside the branch
      const sess = event.data.object as Stripe.Checkout.Session;

      // ---- existing: map customer<->user + upsert base subscription snapshot ----
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

      // ---- additions: handle listing promo subs and evaluation one-time payments ----
      const meta = sess.metadata || {};
      const purpose = String(meta["purpose"] ?? "");
      const listingId = String(meta["listing_id"] ?? "");

      // A) Boosted Listing: write/refresh listing_promotions row on successful checkout
      if (purpose === "listing_promo" && sess.subscription && listingId) {
        const subId =
          typeof sess.subscription === "string"
            ? (sess.subscription as string)
            : (sess.subscription as Stripe.Subscription).id;

        const sub = await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price", "customer"],
        });

        // IMPORTANT: do NOT access sub.current_period_* directly; use your helper
        const mainItem = sub.items?.data?.[0];
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub, mainItem);

        const { error: promoErr } = await admin.from("listing_promotions").upsert(
          {
            listing_id: listingId,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_end: currentPeriodEnd, // safe ISO
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          },
          { onConflict: "stripe_subscription_id" }
        );
        if (promoErr) console.error("listing_promotions upsert error:", promoErr);
      }

      // B) Business Evaluation: mark as 'purchased' and email BizEquity link
      if (purpose === "evaluation" && listingId) {
        const piId =
          typeof sess.payment_intent === "string"
            ? (sess.payment_intent as string)
            : (sess.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

        // Until you regenerate Supabase types to include `listing_evaluations`,
        // cast this call to avoid TS narrowing to existing tables:
        const adminAny = admin as unknown as {
          from: (table: string) => {
            upsert: (values: any, options?: any) => Promise<{ error: any }>;
            select?: (...args: any[]) => any;
            eq?: (...args: any[]) => any;
            maybeSingle?: () => any;
          };
        };

        const { error: evalErr } = await adminAny.from("listing_evaluations").upsert(
          {
            listing_id: listingId,
            status: "purchased",
            stripe_payment_intent_id: piId ?? undefined,
          },
          { onConflict: "listing_id" }
        );
        if (evalErr) console.error("listing_evaluations upsert error:", evalErr);

        // Resolve recipient
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

          // Lazy import Resend + email TSX so other events don't pay cost or crash on module load
          const { Resend } = await import("resend");
          const { default: ValuationEmail } = await import("@/emails/ValuationEmail");
          const resend = new Resend(process.env.RESEND_API_KEY!);

          try {
            await resend.emails.send(
              {
                from: "RioPlex <valuations@rioplexbizx.com>",
                to: toEmail,
                subject: "Your Business Valuation Link",
                react: ValuationEmail({ link: evaluationLink }),
              },
              { idempotencyKey: idemKey }
            );
          } catch (mailErr) {
            console.error("Resend send error:", mailErr);
            // Optionally: return new Response("Email error", { status: 500 }); // if you want Stripe to retry
          }
        } else {
          console.warn("No email found for valuation purchase; skipped email send.");
        }
      }

      return new Response("ok", { status: 200 });
    }

    // B) Keep subscription in sync
    if (
      type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted"
    ) {
      const admin = getAdmin(); // moved inside the branch
      const subObj = event.data.object as Stripe.Subscription;

      // Re-retrieve with expansions so our helpers work consistently
      const sub = await stripe.subscriptions.retrieve(subObj.id, {
        expand: ["items.data.price.product", "customer"],
      });

      // Keep your main subscriptions table in sync
      await upsertSubscription(admin, sub);

      // Optional: keep profiles.user_type aligned (unchanged)
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

      // NEW: keep listing_promotions fresh for boosted-listing subs
      // We only touch promos if this subscription was created via listing_promo
      if ((sub.metadata?.purpose ?? "") === "listing_promo") {
        const mainItem = sub.items?.data?.[0];
        const { endISO: currentPeriodEnd } = extractPeriodISO(sub, mainItem);

        const { error: promoUpdErr } = await admin
          .from("listing_promotions")
          .update({
            status: sub.status,
            current_period_end: currentPeriodEnd, // safe ISO via helper
            cancel_at_period_end: sub.cancel_at_period_end ?? false,
          })
          .eq("stripe_subscription_id", sub.id);

        if (promoUpdErr) console.error("listing_promotions update error:", promoUpdErr);
      }

      return new Response("ok", { status: 200 });
    }

    // C) Invoice events: refresh period/status after billing
    if (
      type === "invoice.payment_succeeded" ||
      type === "invoice.payment_failed" ||
      type === "invoice.paid" // legacy dot style
    ) {
      const admin = getAdmin(); // moved inside the branch
      const inv = event.data.object as Stripe.Invoice;

      // Derive subscription id from whatever your account exposes
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

    // Unknown but valid events: acknowledge
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("Unhandled webhook error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
