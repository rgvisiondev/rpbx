// lib/billing/subscriptionSync.ts
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/types/database.types";
import { getStripe } from "@/lib/stripe";

type BusinessListingInsert = TablesInsert<"business_listings">;


export function getAdmin(): SupabaseClient<Database> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Missing Supabase admin env vars");
  }
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(obj: unknown, key: string): number | null {
  if (!isObject(obj)) return null;
  const v = obj[key];
  return typeof v === "number" ? v : null;
}

const toISO = (unix: number | null | undefined) =>
  typeof unix === "number" ? new Date(unix * 1000).toISOString() : null;

export function extractPeriodISO(
  sub: Stripe.Subscription,
  item?: Stripe.SubscriptionItem,
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

function isDeletedCustomer(
  c: Stripe.Customer | Stripe.DeletedCustomer,
): c is Stripe.DeletedCustomer {
  return (c as Stripe.DeletedCustomer).deleted === true;
}

// Canonical mirror into `subscriptions`
export async function upsertSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
) {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!stripeCustomerId) return;

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  // 1) Map Stripe customer -> Supabase user via customers table
  const { data: mapRow } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  let userId = mapRow?.id ?? null;

  // 2) Fallback: Stripe customer metadata (old flows)
  if (!userId) {
    const cust =
      typeof sub.customer === "string"
        ? await stripe.customers.retrieve(sub.customer)
        : sub.customer;

    if (!cust || isDeletedCustomer(cust)) return;

    const metaUserId = cust.metadata?.supabase_user_id as string | undefined;
    if (metaUserId) {
      userId = metaUserId;
      await admin.from("customers").upsert({
        id: metaUserId,
        stripe_customer_id: stripeCustomerId,
      });
    }
  }

  if (!userId) return;

  // 3) Must have profile
  const { data: profileRow } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profileRow) return;

  const item = sub.items?.data?.[0];
  const price = item?.price ?? undefined;
  const { startISO: currentPeriodStart, endISO: currentPeriodEnd } =
    extractPeriodISO(sub, item);

  const product =
    typeof price?.product === "string"
      ? null
      : (price?.product as Stripe.Product | null);

  const row: TablesInsert<"subscriptions"> = {
    id: sub.id,
    user_id: userId,
    status: sub.status as Database["public"]["Enums"]["subscription_status"],
    price_id: price?.id ?? null,
    quantity: item?.quantity ?? null,
    metadata: (sub.metadata ?? {}) as TablesInsert<"subscriptions">["metadata"],
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
      typeof price?.product === "string"
        ? price?.product
        : (product?.id ?? null),
    product_name: product?.name ?? null,
    price_currency: price?.currency ?? null,
    price_unit_amount: price?.unit_amount ?? null,
    price_interval: price?.recurring?.interval ?? null,
    price_interval_count: price?.recurring?.interval_count ?? null,
    price_nickname: price?.nickname ?? null,
    price_lookup_key: price?.lookup_key ?? null,
    price_metadata: (price?.metadata ??
      {}) as TablesInsert<"subscriptions">["price_metadata"],
    product_metadata: (product?.metadata ??
      {}) as TablesInsert<"subscriptions">["product_metadata"],

  };

  const { error } = await admin.from("subscriptions").upsert(row);
  if (error) {
    console.error("subscriptions upsert error:", error);
  }
}

// Canonical entitlement
export async function ensureListingForSubscription(
  admin: SupabaseClient<Database>,
  stripe: Stripe,
  sub: Stripe.Subscription,
  userId: string
): Promise<string | null> {
  try {
    const existing = (sub.metadata?.["listing_id"] ?? "") as string;
    if (existing) {
      console.log("ensureListingForSubscription: already has listing_id in Stripe metadata", {
        subId: sub.id,
        listingId: existing,
      });
      return existing;
    }

    // 1) Existing listing for this subscription?
    const { data: existingRow, error: findErr } = await admin
      .from("business_listings")
      .select("id")
      .eq("stripe_subscription_id", sub.id)
      .maybeSingle();

    if (findErr) {
      console.error("ensureListingForSubscription: lookup failed", {
        subId: sub.id,
        userId,
        findErr,
      });
    }

    let listingId = existingRow?.id ?? null;

    // 2) Create if missing (race-safe)
    if (!listingId) {
      const listingInsert: BusinessListingInsert = {
            owner_id: userId,
            title: "Untitled Listing",
            industry: "Agriculture, Forestry, Fishing & Hunting",
            status: "draft",
            is_active: false,
            stripe_subscription_id: sub.id,
          };
        const { data: draft, error: upErr } = await admin
          .from("business_listings")
          .upsert(listingInsert, { onConflict: "stripe_subscription_id" })
          .select("id")
          .maybeSingle();

      if (upErr) {
        console.error("ensureListingForSubscription: business_listings upsert failed", {
          subId: sub.id,
          userId,
          upErr,
        });
        return null;
      }

      if (!draft?.id) {
        console.error("ensureListingForSubscription: upsert succeeded but returned no id", {
          subId: sub.id,
          userId,
          draft,
        });

        // Try a follow-up fetch (in case insert worked but select was blocked)
        const { data: retryRow, error: retryErr } = await admin
          .from("business_listings")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        if (retryErr) {
          console.error("ensureListingForSubscription: retry select failed", {
            subId: sub.id,
            userId,
            retryErr,
          });
          return null;
        }

        if (!retryRow?.id) {
          console.error("ensureListingForSubscription: retry select still found nothing", {
            subId: sub.id,
            userId,
          });
          return null;
        }

        listingId = retryRow.id;
      } else {
        listingId = draft.id;
      }
    }

    // 3) Stamp Stripe metadata
    await stripe.subscriptions.update(sub.id, {
      metadata: { ...(sub.metadata ?? {}), listing_id: listingId },
    });

    // 4) Refresh mirror so `subscriptions.listing_id` appears ASAP
    const refreshed = await stripe.subscriptions.retrieve(sub.id, {
      expand: ["items.data.price.product", "customer"],
    });
    await upsertSubscription(admin, refreshed);

    console.log("ensureListingForSubscription: success", {
      subId: sub.id,
      userId,
      listingId,
    });

    return listingId;
  } catch (e) {
    console.error("ensureListingForSubscription: unexpected error", {
      subId: sub.id,
      userId,
      e,
    });
    return null;
  }
}
