// lib/listings/onboarding.ts
export type ListingOnboardingState =
  | "published"
  | "continue_onboarding"
  | "needs_billing"
  | "draft_locked";

type SubscriptionLite = {
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

type ListingLite = {
  status: string | null;
  stripe_subscription_id: string | null;
};

export function getListingOnboardingState(
  listing: ListingLite,
  subscription: SubscriptionLite | null
): ListingOnboardingState {
  if (listing.status === "published") return "published";

  if (listing.status !== "draft") return "draft_locked";

  if (!listing.stripe_subscription_id || !subscription) {
    return "needs_billing";
  }

  const now = Date.now();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;

  if (subscription.status === "active" || subscription.status === "trialing") {
    if (subscription.cancel_at_period_end && periodEnd !== null) {
      return periodEnd > now ? "continue_onboarding" : "needs_billing";
    }
    return "continue_onboarding";
  }

  return "needs_billing";
}