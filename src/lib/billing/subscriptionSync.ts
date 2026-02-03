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

/**
 * Strictly resolve the Supabase user id for a Stripe subscription.
 * Priority:
 *  1) sub.metadata.supabase_user_id (most reliable)
 *  2) customers table mapping (must be unique!)
 *  3) stripe customer metadata supabase_user_id (legacy fallback)
 */
async function resolveUserIdForSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
): Promise<{ userId: string | null; stripeCustomerId: string | null }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  const stripeCustomerId =
    typeof sub.customer === "string"
      ? sub.customer
      : (sub.customer?.id ?? null);

  // 1) Prefer sub.metadata.supabase_user_id
  const metaUidRaw = sub.metadata?.supabase_user_id;
  const metaUid =
    typeof metaUidRaw === "string" && metaUidRaw.length > 0 ? metaUidRaw : null;
  if (metaUid) {
    // best effort: keep customers table synced
    if (stripeCustomerId) {
      await admin
        .from("customers")
        .upsert({ id: metaUid, stripe_customer_id: stripeCustomerId });
    }
    return { userId: metaUid, stripeCustomerId };
  }

  if (!stripeCustomerId) return { userId: null, stripeCustomerId: null };

  // 2) customers table mapping — but guard against ambiguity
  const { data: mapRows, error: mapErr } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .limit(2);

  if (mapErr) {
    console.error(
      "resolveUserIdForSubscription: customers lookup error",
      mapErr,
    );
  } else if (Array.isArray(mapRows)) {
    if (mapRows.length === 1) {
      return { userId: mapRows[0]!.id as string, stripeCustomerId };
    }
    if (mapRows.length > 1) {
      // This should NEVER happen. It means stripe_customer_id is not unique in your DB.
      console.error("FATAL: multiple users mapped to same stripe_customer_id", {
        stripeCustomerId,
        mapRows,
      });
      // Fail safe: do not upsert subscriptions with a nondeterministic user_id.
      return { userId: null, stripeCustomerId };
    }
  }

  // 3) Legacy fallback: Stripe customer metadata
  try {
    const cust = await stripe.customers.retrieve(stripeCustomerId);
    if (!cust || isDeletedCustomer(cust))
      return { userId: null, stripeCustomerId };

    const custMetaUid = cust.metadata?.supabase_user_id;
    const uid =
      typeof custMetaUid === "string" && custMetaUid.length > 0
        ? custMetaUid
        : null;

    if (uid) {
      await admin
        .from("customers")
        .upsert({ id: uid, stripe_customer_id: stripeCustomerId });
    }
    return { userId: uid, stripeCustomerId };
  } catch (e) {
    console.error(
      "resolveUserIdForSubscription: stripe customer retrieve failed",
      e,
    );
    return { userId: null, stripeCustomerId };
  }
}

/* ================================
   Base membership → profiles.user_type
   Safeguards:
   - ONLY updates profiles.user_type
   - ONLY for base memberships (purpose empty)
   - ONLY when active/trialing
   - NEVER sets "member" (no-op if can't resolve business/investor)
================================== */

type BaseRole = "business" | "investor" | null;

function jsonGetString(obj: unknown, key: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  const v = (obj as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

function resolveBaseRoleFromSub(args: {
  priceLookupKey: string | null;
  priceMetadata: unknown;
  subMetadata: unknown;
}): BaseRole {
  const byMeta = (jsonGetString(args.priceMetadata, "user_type") ?? "").toLowerCase();
  if (byMeta === "business") return "business";
  if (byMeta === "investor") return "investor";

  const intended = (jsonGetString(args.subMetadata, "user_type_intended") ?? "").toLowerCase();
  if (intended === "business") return "business";
  if (intended === "investor") return "investor";

  const lk = (args.priceLookupKey ?? "").toLowerCase();
  if (lk.startsWith("business_")) return "business";
  if (lk.startsWith("investor_")) return "investor";

  return null;
}

function isActiveish(status: Stripe.Subscription["status"] | null | undefined) {
  return status === "active" || status === "trialing";
}

async function syncProfileUserTypeFromSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
  userId: string,
) {
  // Base memberships should NOT have a "purpose". Add-ons should.
  const purpose = String(sub.metadata?.purpose ?? "").trim();
  if (purpose) return;

  if (!isActiveish(sub.status)) return;

  const item = sub.items?.data?.[0];
  const price = item?.price;

  const role = resolveBaseRoleFromSub({
    priceLookupKey: price?.lookup_key ?? null,
    priceMetadata: price?.metadata ?? null,
    subMetadata: sub.metadata ?? null,
  });

  // hard safety: never set "member" on webhook sync
  if (!role) return;

  const { error } = await admin
    .from("profiles")
    .update({ user_type: role })
    .eq("id", userId);

  if (error) {
    console.error("syncProfileUserTypeFromSubscription: profiles update error", {
      userId,
      subId: sub.id,
      error,
    });
  }
}

// Canonical mirror into `subscriptions`
export async function upsertSubscription(
  admin: SupabaseClient<Database>,
  sub: Stripe.Subscription,
) {
  const { userId, stripeCustomerId } = await resolveUserIdForSubscription(
    admin,
    sub,
  );
  if (!userId) return;

  // Optional: log if Stripe customer missing (shouldn't happen)
  if (!stripeCustomerId) {
    console.warn("upsertSubscription: missing stripeCustomerId", {
      subId: sub.id,
      userId,
    });
  }

  // Must have profile row (don’t create or update here)
  const { data: profileRow, error: profErr } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profErr) {
    console.error("upsertSubscription: profiles lookup error", profErr);
    return;
  }
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
    console.error("subscriptions upsert error:", error, {
      subId: sub.id,
      userId,
    });
    return;
  }

  // ✅ Only place we update profile role off Stripe subs
  // (guarded to ONLY base membership)
  await syncProfileUserTypeFromSubscription(admin, sub, userId);
}

// Canonical entitlement (business listing per qualifying subscription)
export async function ensureListingForSubscription(
  admin: SupabaseClient<Database>,
  stripe: Stripe,
  sub: Stripe.Subscription,
  userId: string,
): Promise<string | null> {
  try {
    // HARD SAFETY: never touch profiles here (this function should ONLY deal with listings/subscriptions)

    // If subscription already has listing_id, trust it
    const existing = (sub.metadata?.["listing_id"] ?? "") as string;
    if (existing) {
      return existing;
    }

    // Optional extra safety: only allow listing creation for intended-purpose subs
    // If you want, uncomment this to block accidental calls:
    // const purpose = String(sub.metadata?.purpose ?? "");
    // if (purpose && purpose !== "listing_plan") return null;

    // 1) Find listing bound to this subscription
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

    // 2) Create draft listing if missing
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
        console.error(
          "ensureListingForSubscription: business_listings upsert failed",
          {
            subId: sub.id,
            userId,
            upErr,
          },
        );
        return null;
      }

      listingId = draft?.id ?? null;

      // Fallback select if returning row was blocked
      if (!listingId) {
        const { data: retryRow, error: retryErr } = await admin
          .from("business_listings")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();

        if (retryErr || !retryRow?.id) {
          console.error("ensureListingForSubscription: retry select failed", {
            subId: sub.id,
            userId,
            retryErr,
          });
          return null;
        }
        listingId = retryRow.id;
      }
    }

    // 3) Stamp Stripe subscription metadata
    await stripe.subscriptions.update(sub.id, {
      metadata: { ...(sub.metadata ?? {}), listing_id: listingId },
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
