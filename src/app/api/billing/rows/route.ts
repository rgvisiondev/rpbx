// app/api/billing/rows/route.ts
import { NextResponse } from "next/server";
import { createClientRSC } from "@/../utils/supabase/server";

interface SubscriptionMetadata {
  listing_id?: string;
}

interface SubscriptionRow {
  id: string; // Stripe subscription id
  product_name: string | null;
  status: string | null;
  current_period_end: string | null;
  user_id: string;
  metadata: SubscriptionMetadata | null;
  cancel_at: string | null;
  cancel_at_period_end: boolean | null;

  // Canonical billing fields
  purpose_sub?: string | null;
  listing_id?: string | null;

  // Pause fields
  pause_status?: string | null;
  pause_starts_at?: string | null;
  pause_ends_at?: string | null;
  paused_until?: string | null;
  pause_count?: number | null;
  last_pause_started_at?: string | null;
}

interface PromotionRow {
  listing_id: string;
  status: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string;
  cancel_at_period_end: boolean | null;
}

interface ListingRow {
  id: string;
  title: string | null;
  owner_id: string;
}

interface BillingRow {
  type: "platform" | "boost";
  label: string;
  status: string | null;
  renews: string | null;
  listingId?: string;
  listingTitle?: string | null;
  stripeSubscriptionId?: string | null;
  cancelAt?: string | null;
  cancelAtPeriodEnd?: boolean | null;

  // Pause-aware fields
  pauseStatus?: string | null;
  pauseStartsAt?: string | null;
  pauseEndsAt?: string | null;
  pauseCount?: number | null;
  lastPauseStartedAt?: string | null;
  isPauseEligible?: boolean;
  parentListingSubscriptionId?: string | null;
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getListingIdForSubscription(sub: SubscriptionRow): string | null {
  if (sub.listing_id) return sub.listing_id;

  const meta = sub.metadata;
  if (meta && typeof meta === "object" && typeof meta.listing_id === "string") {
    return meta.listing_id;
  }

  return null;
}

function isBoostSubscription(sub: SubscriptionRow): boolean {
  return sub.purpose_sub === "listing_promo";
}

function isPauseEligible(sub: SubscriptionRow): boolean {
  if (isBoostSubscription(sub)) return false;

  return (
    sub.status === "active" ||
    sub.status === "trialing" ||
    sub.status === "past_due" ||
    sub.status === "unpaid"
  );
}

function getEffectivePauseEnd(sub: SubscriptionRow): string | null {
  return sub.pause_ends_at ?? sub.paused_until ?? null;
}

export async function GET() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ rows: [], userType: null });
  }

  const rows: BillingRow[] = [];

  const [{ data: profile }, { data: subs, error: subsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("user_type")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select(
          `
            id,
            product_name,
            status,
            current_period_end,
            user_id,
            metadata,
            cancel_at,
            cancel_at_period_end,
            purpose_sub,
            listing_id,
            pause_status,
            pause_starts_at,
            pause_ends_at,
            paused_until,
            pause_count,
            last_pause_started_at
          `,
        )
        .eq("user_id", user.id)
        .returns<SubscriptionRow[]>(),
    ]);

  if (subsError) {
    console.error("Error loading subscriptions:", subsError);
    return NextResponse.json(
      {
        rows: [],
        userType: profile?.user_type ?? null,
        error: "Failed to load subscriptions",
      },
      { status: 500 },
    );
  }

  const allSubs = subs ?? [];

  const listingSubs: SubscriptionRow[] = [];
  const platformSubs: SubscriptionRow[] = [];

  for (const sub of allSubs) {
    if (isBoostSubscription(sub)) {
      continue;
    }

    const listingId = getListingIdForSubscription(sub);
    if (listingId) {
      listingSubs.push(sub);
    } else {
      platformSubs.push(sub);
    }
  }

  const listingIdsFromSubs = Array.from(
    new Set(
      listingSubs
        .map((sub) => getListingIdForSubscription(sub))
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let listingTitleById = new Map<string, string>();
  if (listingIdsFromSubs.length > 0) {
    const { data: listingRecords, error: listingError } = await supabase
      .from("business_listings")
      .select("id, title, owner_id")
      .in("id", listingIdsFromSubs)
      .eq("owner_id", user.id)
      .returns<ListingRow[]>();

    if (listingError) {
      console.error("Error loading listing memberships:", listingError);
    } else {
      listingTitleById = new Map(
        (listingRecords ?? []).map((listing) => [
          listing.id,
          listing.title ?? listing.id,
        ]),
      );
    }
  }

  const listingSubscriptionIdByListingId = new Map<string, string>();

  // 1) Plain platform subscriptions
  for (const sub of platformSubs) {
    rows.push({
      type: "platform",
      label: sub.product_name ?? "Membership",
      status: sub.status,
      renews: formatDate(sub.current_period_end),
      stripeSubscriptionId: sub.id,
      cancelAt: sub.cancel_at,
      cancelAtPeriodEnd: sub.cancel_at_period_end,

      pauseStatus: sub.pause_status ?? null,
      pauseStartsAt: sub.pause_starts_at ?? null,
      pauseEndsAt: getEffectivePauseEnd(sub),
      pauseCount: sub.pause_count ?? 0,
      lastPauseStartedAt: sub.last_pause_started_at ?? null,
      isPauseEligible: isPauseEligible(sub),
      parentListingSubscriptionId: null,
    });
  }

  // 2) Listing membership subscriptions
  for (const sub of listingSubs) {
    const listingId = getListingIdForSubscription(sub);
    if (!listingId) continue;

    const listingTitle =
      listingTitleById.get(listingId) ?? `Listing ${listingId}`;

    listingSubscriptionIdByListingId.set(listingId, sub.id);

    rows.push({
      type: "platform",
      label: sub.product_name ?? "Listing Membership",
      status: sub.status,
      renews: formatDate(sub.current_period_end),
      listingId,
      listingTitle,
      stripeSubscriptionId: sub.id,
      cancelAt: sub.cancel_at,
      cancelAtPeriodEnd: sub.cancel_at_period_end,

      pauseStatus: sub.pause_status ?? null,
      pauseStartsAt: sub.pause_starts_at ?? null,
      pauseEndsAt: getEffectivePauseEnd(sub),
      pauseCount: sub.pause_count ?? 0,
      lastPauseStartedAt: sub.last_pause_started_at ?? null,
      isPauseEligible: isPauseEligible(sub),
      parentListingSubscriptionId: sub.id,
    });
  }

  // 3) Boosted listing subscriptions
  const { data: boosts, error: boostsError } = await supabase
    .from("listing_promotions")
    .select(
      "listing_id, status, current_period_end, stripe_subscription_id, cancel_at_period_end",
    )
    .returns<PromotionRow[]>();

  if (boostsError) {
    console.error("Error loading boosts:", boostsError);
  } else {
    const boostListingIds = Array.from(
      new Set((boosts ?? []).map((boost) => boost.listing_id)),
    );

    if (boostListingIds.length > 0) {
      const { data: listings, error: boostListingsError } = await supabase
        .from("business_listings")
        .select("id, title, owner_id")
        .in("id", boostListingIds)
        .eq("owner_id", user.id)
        .returns<ListingRow[]>();

      if (boostListingsError) {
        console.error("Error loading boost listing ownership:", boostListingsError);
      } else {
        const byId = new Map(
          (listings ?? []).map((listing) => [
            listing.id,
            listing.title ?? listing.id,
          ]),
        );

        for (const boost of boosts ?? []) {
          if (!byId.has(boost.listing_id)) continue;

          rows.push({
            type: "boost",
            label: byId.get(boost.listing_id) ?? boost.listing_id,
            status: boost.status,
            renews: formatDate(boost.current_period_end),
            listingId: boost.listing_id,
            listingTitle: byId.get(boost.listing_id) ?? boost.listing_id,
            stripeSubscriptionId: boost.stripe_subscription_id,
            cancelAtPeriodEnd: boost.cancel_at_period_end,

            pauseStatus: null,
            pauseStartsAt: null,
            pauseEndsAt: null,
            pauseCount: null,
            lastPauseStartedAt: null,
            isPauseEligible: false,
            parentListingSubscriptionId:
              listingSubscriptionIdByListingId.get(boost.listing_id) ?? null,
          });
        }
      }
    }
  }

  return NextResponse.json({
    rows,
    userType: profile?.user_type ?? null,
  });
}