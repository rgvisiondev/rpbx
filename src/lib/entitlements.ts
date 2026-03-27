// lib/entitlements.ts
import { createClientRSC } from "@/../utils/supabase/server";
import type { Enums, Tables } from "@/types/database.types";

export type SubStatus = Enums<"subscription_status">;
export type EntitlementStatus = SubStatus | "none";
export type UserRole = "business" | "investor" | null;

type SubscriptionRow = Pick<
  Tables<"subscriptions">,
  | "id"
  | "user_id"
  | "status"
  | "purpose_sub"
  | "listing_id"
  | "billing_issue_open"
  | "cancel_at_period_end"
  | "current_period_end"
  | "current_period_start"
  | "pause_status"
  | "pause_starts_at"
  | "pause_ends_at"
  | "paused_until"
>;

const ACCESS_OK = new Set<EntitlementStatus>(["active", "trialing"]);
const ACCESS_GRACE = new Set<EntitlementStatus>(["past_due", "unpaid"]);

const BLOCKED = new Set<EntitlementStatus>([
  "none",
  "canceled",
  "incomplete_expired",
  "paused",
]);

function toMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

function isPromoSubscription(sub: SubscriptionRow): boolean {
  return sub.purpose_sub === "listing_promo";
}

function isActivePause(sub: SubscriptionRow, nowMs: number): boolean {
  // Explicit active pause wins
  if (sub.pause_status === "active") return true;

  // Fallback support if you still temporarily use paused_until
  const pausedUntilMs = toMs(sub.paused_until);
  if (pausedUntilMs != null && pausedUntilMs > nowMs) return true;

  // Scheduled pause that has started but hasn't been cleaned up yet
  if (sub.pause_status === "scheduled") {
    const startMs = toMs(sub.pause_starts_at);
    const endMs = toMs(sub.pause_ends_at) ?? toMs(sub.paused_until);

    if (startMs != null && startMs <= nowMs) {
      if (endMs == null) return true;
      return nowMs < endMs;
    }
  }

  // Stripe-level paused status fallback
  return sub.status === "paused";
}

function isEffectivelyPaused(sub: SubscriptionRow, nowMs: number): boolean {
  return isActivePause(sub, nowMs);
}

function isQualifyingForAccountAccess(
  sub: SubscriptionRow,
  role: UserRole,
): boolean {
  // Boosts should never keep the whole account entitled
  if (isPromoSubscription(sub)) return false;

  // Investors only have one real membership path, so any non-promo base sub counts
  if (role === "investor") return true;

  // For business users, base listing subscriptions should count.
  // Today the safest rule is: non-promo subscriptions count.
  // This keeps compatibility with current data while excluding boosted listings.
  if (role === "business") return true;

  // Unknown role: be conservative but still compatible with existing behavior
  return true;
}

function statusRank(status: EntitlementStatus): number {
  switch (status) {
    case "active":
      return 70;
    case "trialing":
      return 60;
    case "past_due":
      return 50;
    case "unpaid":
      return 40;
    case "paused":
      return 30;
    case "incomplete":
      return 20;
    case "canceled":
      return 10;
    case "incomplete_expired":
      return 5;
    case "none":
    default:
      return 0;
  }
}

function chooseBestStatus(statuses: EntitlementStatus[]): EntitlementStatus {
  if (statuses.length === 0) return "none";

  return (
    [...statuses].sort((a, b) => statusRank(b) - statusRank(a))[0] ?? "none"
  );
}

function getEffectiveSubscriptionStatus(
  sub: SubscriptionRow,
  nowMs: number,
): EntitlementStatus {
  if (isEffectivelyPaused(sub, nowMs)) return "paused";
  return (sub.status as EntitlementStatus | null) ?? "none";
}

export async function getEntitlement() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      entitled: false,
      status: "none" as EntitlementStatus,
      blocked: true,
      needsBillingFix: false,
      unverified: false,
      role: null as UserRole,

      // new fields
      hasAnyActiveAccess: false,
      hasOnlyPausedSubscriptions: false,
      hasBillingIssues: false,
      activeSubscriptionCount: 0,
      graceSubscriptionCount: 0,
      pausedSubscriptionCount: 0,
      qualifyingSubscriptionCount: 0,
      qualifyingSubscriptionIds: [] as string[],
    };
  }

  const unverified = !user.email_confirmed_at;

  const [{ data: profile }, { data: subs }] = await Promise.all([
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
        user_id,
        status,
        purpose_sub,
        listing_id,
        billing_issue_open,
        cancel_at_period_end,
        current_period_end,
        current_period_start,
        pause_status,
        pause_starts_at,
        pause_ends_at,
        paused_until
      `,
      )
      .eq("user_id", user.id),
  ]);

  const role: UserRole =
    profile?.user_type === "business" || profile?.user_type === "investor"
      ? profile.user_type
      : null;

  const nowMs = Date.now();
  const allSubs: SubscriptionRow[] = Array.isArray(subs)
    ? subs.map((sub) => ({
        id: sub.id,
        user_id: sub.user_id,
        status: sub.status,
        purpose_sub: sub.purpose_sub,
        listing_id: sub.listing_id,
        billing_issue_open: sub.billing_issue_open,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: sub.current_period_end,
        current_period_start: sub.current_period_start,
        pause_status: sub.pause_status,
        pause_starts_at: sub.pause_starts_at,
        pause_ends_at: sub.pause_ends_at,
        paused_until: sub.paused_until,
      }))
    : [];

  const qualifyingSubs = allSubs.filter((sub) =>
    isQualifyingForAccountAccess(sub, role),
  );

  const qualifyingSubscriptionIds = qualifyingSubs.map((s) => s.id);

  const effectiveStatuses = qualifyingSubs.map((sub) =>
    getEffectiveSubscriptionStatus(sub, nowMs),
  );

  const activeSubs = qualifyingSubs.filter((sub) => {
    const status = getEffectiveSubscriptionStatus(sub, nowMs);
    return ACCESS_OK.has(status);
  });

  const graceSubs = qualifyingSubs.filter((sub) => {
    const status = getEffectiveSubscriptionStatus(sub, nowMs);
    return ACCESS_GRACE.has(status);
  });

  const pausedSubs = qualifyingSubs.filter((sub) =>
    isEffectivelyPaused(sub, nowMs),
  );

  const incompleteSubs = qualifyingSubs.filter((sub) => {
    const status = getEffectiveSubscriptionStatus(sub, nowMs);
    return status === "incomplete";
  });

  const canceledLikeSubs = qualifyingSubs.filter((sub) => {
    const status = getEffectiveSubscriptionStatus(sub, nowMs);
    return status === "canceled" || status === "incomplete_expired";
  });

  const hasAnyActiveAccess = activeSubs.length > 0;
  const hasBillingIssues = graceSubs.length > 0;
  const hasOnlyPausedSubscriptions =
    qualifyingSubs.length > 0 &&
    activeSubs.length === 0 &&
    graceSubs.length === 0 &&
    pausedSubs.length > 0 &&
    incompleteSubs.length === 0 &&
    canceledLikeSubs.length + pausedSubs.length === qualifyingSubs.length;

  // Preserve legacy-style output semantics:
  // - active/trialing => entitled
  // - past_due/unpaid => entitled + needsBillingFix
  // - paused/canceled/incomplete/etc => blocked
  let status: EntitlementStatus = "none";

  if (hasAnyActiveAccess) {
    status = chooseBestStatus(
      activeSubs.map((sub) => getEffectiveSubscriptionStatus(sub, nowMs)),
    );
  } else if (hasBillingIssues) {
    status = chooseBestStatus(
      graceSubs.map((sub) => getEffectiveSubscriptionStatus(sub, nowMs)),
    );
  } else if (pausedSubs.length > 0) {
    status = "paused";
  } else if (incompleteSubs.length > 0) {
    status = "incomplete";
  } else if (canceledLikeSubs.length > 0) {
    status = chooseBestStatus(
      canceledLikeSubs.map((sub) => getEffectiveSubscriptionStatus(sub, nowMs)),
    );
  } else if (effectiveStatuses.length > 0) {
    status = chooseBestStatus(effectiveStatuses);
  } else {
    status = "none";
  }

  const entitled = hasAnyActiveAccess || hasBillingIssues;
  const blocked = BLOCKED.has(status) || status === "incomplete";
  const needsBillingFix = hasBillingIssues;

  return {
    // existing contract
    entitled,
    status,
    blocked,
    needsBillingFix,
    unverified,
    role,

    // new fields for Phase 5 and safer UI branching
    hasAnyActiveAccess,
    hasOnlyPausedSubscriptions,
    hasBillingIssues,
    activeSubscriptionCount: activeSubs.length,
    graceSubscriptionCount: graceSubs.length,
    pausedSubscriptionCount: pausedSubs.length,
    qualifyingSubscriptionCount: qualifyingSubs.length,
    qualifyingSubscriptionIds,
  };
}
