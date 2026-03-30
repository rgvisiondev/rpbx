import { NextResponse } from "next/server";
import { createClientRSC } from "@/../utils/supabase/server";

interface SubscriptionMetadata {
  listing_id?: string;
  resumed_from_subscription_id?: string;
  resume_from_pause?: string;
  auto_resume_from_pause?: string;
  plan_lookup?: string;
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

  // Boost restore fields
  paused_boost_restore_pending?: boolean | null;
  paused_boost_subscription_id?: string | null;
  paused_boost_restore_dismissed_at?: string | null;
  paused_boost_restore_completed_at?: string | null;
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

  // Boost restore prompt fields
  pausedBoostRestorePending?: boolean | null;
  pausedBoostSubscriptionId?: string | null;
  pausedBoostRestoreDismissedAt?: string | null;
  pausedBoostRestoreCompletedAt?: string | null;
}

type MainLifecycleState =
  | "active"
  | "trialing"
  | "past_due"
  | "unpaid"
  | "canceling"
  | "pause_scheduled"
  | "paused"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unknown";

function getResumedFromSubscriptionId(sub: SubscriptionRow): string | null {
  const meta = sub.metadata;
  if (
    meta &&
    typeof meta === "object" &&
    typeof meta.resumed_from_subscription_id === "string"
  ) {
    return meta.resumed_from_subscription_id;
  }

  return null;
}

function getPlanLookupForSubscription(sub: SubscriptionRow): string | null {
  const meta = sub.metadata;
  if (
    meta &&
    typeof meta === "object" &&
    typeof meta.plan_lookup === "string"
  ) {
    return meta.plan_lookup;
  }

  return null;
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

function deriveMainLifecycleState(sub: SubscriptionRow): MainLifecycleState {
  if (sub.pause_status === "scheduled") return "pause_scheduled";
  if (sub.pause_status === "active" || sub.status === "paused") return "paused";
  if (sub.status === "active" && sub.cancel_at_period_end) return "canceling";

  switch (sub.status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "canceled":
      return "canceled";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    default:
      return "unknown";
  }
}

function getVisibilityRank(sub: SubscriptionRow): number {
  const state = deriveMainLifecycleState(sub);

  switch (state) {
    case "active":
      return 100;
    case "trialing":
      return 95;
    case "past_due":
      return 90;
    case "unpaid":
      return 85;
    case "canceling":
      return 80;
    case "pause_scheduled":
      return 70;
    case "paused":
      return 60;
    case "canceled":
      return 40;
    case "incomplete":
      return 20;
    case "incomplete_expired":
      return 10;
    default:
      return 0;
  }
}

function getLogicalMainContextKey(sub: SubscriptionRow): string {
  const listingId = getListingIdForSubscription(sub);
  if (listingId) return `listing:${listingId}`;

  if (sub.purpose_sub) return `purpose:${sub.purpose_sub}`;

  const planLookup = getPlanLookupForSubscription(sub);
  if (planLookup) return `plan:${planLookup}`;

  if (sub.product_name) return `product:${sub.product_name}`;

  return `subscription:${sub.id}`;
}

function getTimestampValue(value?: string | null): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function chooseVisibleMainSubscriptions(subs: SubscriptionRow[]): SubscriptionRow[] {
  const resumedPredecessorIds = new Set<string>();

  for (const sub of subs) {
    const resumedFromId = getResumedFromSubscriptionId(sub);
    if (resumedFromId) {
      resumedPredecessorIds.add(resumedFromId);
    }
  }

  const filteredSubs = subs.filter((sub) => !resumedPredecessorIds.has(sub.id));

  const byContext = new Map<string, SubscriptionRow>();

  for (const sub of filteredSubs) {
    const key = getLogicalMainContextKey(sub);
    const existing = byContext.get(key);

    if (!existing) {
      byContext.set(key, sub);
      continue;
    }

    const nextRank = getVisibilityRank(sub);
    const existingRank = getVisibilityRank(existing);

    if (nextRank > existingRank) {
      byContext.set(key, sub);
      continue;
    }

    if (nextRank < existingRank) {
      continue;
    }

    const nextTime = Math.max(
      getTimestampValue(sub.current_period_end),
      getTimestampValue(sub.pause_starts_at),
      getTimestampValue(sub.last_pause_started_at),
    );

    const existingTime = Math.max(
      getTimestampValue(existing.current_period_end),
      getTimestampValue(existing.pause_starts_at),
      getTimestampValue(existing.last_pause_started_at),
    );

    if (nextTime >= existingTime) {
      byContext.set(key, sub);
    }
  }

  return Array.from(byContext.values());
}
function getBoostVisibilityRank(boost: PromotionRow): number {
  if (boost.status === "active" && boost.cancel_at_period_end) return 80;

  switch (boost.status) {
    case "active":
      return 100;
    case "trialing":
      return 95;
    case "past_due":
      return 90;
    case "unpaid":
      return 85;
    case "paused":
      return 60;
    case "canceled":
      return 40;
    case "incomplete":
      return 20;
    case "incomplete_expired":
      return 10;
    default:
      return 0;
  }
}

function chooseVisibleBoosts(boosts: PromotionRow[]): PromotionRow[] {
  const byListing = new Map<string, PromotionRow>();

  for (const boost of boosts) {
    const existing = byListing.get(boost.listing_id);

    if (!existing) {
      byListing.set(boost.listing_id, boost);
      continue;
    }

    const nextRank = getBoostVisibilityRank(boost);
    const existingRank = getBoostVisibilityRank(existing);

    if (nextRank > existingRank) {
      byListing.set(boost.listing_id, boost);
      continue;
    }

    if (nextRank < existingRank) {
      continue;
    }

    const nextTime = getTimestampValue(boost.current_period_end);
    const existingTime = getTimestampValue(existing.current_period_end);

    if (nextTime >= existingTime) {
      byListing.set(boost.listing_id, boost);
    }
  }

  return Array.from(byListing.values());
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
            last_pause_started_at,
            paused_boost_restore_pending,
            paused_boost_subscription_id,
            paused_boost_restore_dismissed_at,
            paused_boost_restore_completed_at
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

  const allMainSubs = allSubs.filter((sub) => !isBoostSubscription(sub));
  const visibleMainSubs = chooseVisibleMainSubscriptions(allMainSubs);

  const listingSubs: SubscriptionRow[] = [];
  const platformSubs: SubscriptionRow[] = [];

  for (const sub of visibleMainSubs) {
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

      pausedBoostRestorePending: sub.paused_boost_restore_pending ?? false,
      pausedBoostSubscriptionId: sub.paused_boost_subscription_id ?? null,
      pausedBoostRestoreDismissedAt:
        sub.paused_boost_restore_dismissed_at ?? null,
      pausedBoostRestoreCompletedAt:
        sub.paused_boost_restore_completed_at ?? null,
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

      pausedBoostRestorePending: sub.paused_boost_restore_pending ?? false,
      pausedBoostSubscriptionId: sub.paused_boost_subscription_id ?? null,
      pausedBoostRestoreDismissedAt:
        sub.paused_boost_restore_dismissed_at ?? null,
      pausedBoostRestoreCompletedAt:
        sub.paused_boost_restore_completed_at ?? null,
    });
  }

  // Build hidden boost ids from visible main subscriptions that still need restore UX
  const hiddenBoostSubscriptionIds = new Set<string>();
  for (const sub of visibleMainSubs) {
    if (
      sub.paused_boost_restore_pending &&
      sub.paused_boost_subscription_id &&
      !sub.paused_boost_restore_completed_at
    ) {
      hiddenBoostSubscriptionIds.add(sub.paused_boost_subscription_id);
    }
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
    const filteredBoosts = (boosts ?? []).filter(
      (boost) => !hiddenBoostSubscriptionIds.has(boost.stripe_subscription_id),
    );

    const visibleBoosts = chooseVisibleBoosts(filteredBoosts);

    const boostListingIds = Array.from(
      new Set(visibleBoosts.map((boost) => boost.listing_id)),
    );

    if (boostListingIds.length > 0) {
      const { data: listings, error: boostListingsError } = await supabase
        .from("business_listings")
        .select("id, title, owner_id")
        .in("id", boostListingIds)
        .eq("owner_id", user.id)
        .returns<ListingRow[]>();

      if (boostListingsError) {
        console.error(
          "Error loading boost listing ownership:",
          boostListingsError,
        );
      } else {
        const byId = new Map(
          (listings ?? []).map((listing) => [
            listing.id,
            listing.title ?? listing.id,
          ]),
        );

        for (const boost of visibleBoosts) {
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

            pausedBoostRestorePending: false,
            pausedBoostSubscriptionId: null,
            pausedBoostRestoreDismissedAt: null,
            pausedBoostRestoreCompletedAt: null,
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