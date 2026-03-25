import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";

type PauseRequestBody = {
  subscriptionId?: string;
  reason?: string;
  feedback?: string;
};

type SubscriptionRecord = {
  id: string;
  user_id: string;
  status: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  purpose_sub?: string | null;
  listing_id?: string | null;
  pause_status?: string | null;
  pause_scope?: string | null;
  pause_count?: number | null;
  last_pause_started_at?: string | null;
  last_pause_resumed_at?: string | null;
};

type PromotionRecord = {
  stripe_subscription_id: string | null;
  listing_id: string;
  status: string | null;
  cancel_at_period_end: boolean | null;
};

function isPauseEligibleStatus(status: string | null) {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "unpaid"
  );
}

export async function POST(req: Request) {
  try {
    const supabase = await createClientRSC();
    const admin = await getSupabaseAdmin();
    const stripe = getStripe();

    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as PauseRequestBody;
    const subscriptionId = body?.subscriptionId?.trim();
    const reason = body?.reason?.trim();
    const feedback = body?.feedback?.trim() || null;

    if (!subscriptionId || !reason) {
      return Response.json(
        { error: "subscriptionId and reason are required." },
        { status: 400 },
      );
    }

    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        status,
        cancel_at_period_end,
        current_period_end,
        purpose_sub,
        listing_id,
        pause_status,
        pause_scope,
        pause_count,
        last_pause_started_at,
        last_pause_resumed_at
      `)
      .eq("id", subscriptionId)
      .single<SubscriptionRecord>();

    if (subError || !subscription) {
      return Response.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    if (subscription.user_id !== user.id) {
      return Response.json(
        { error: "You do not have access to this subscription." },
        { status: 403 },
      );
    }

    if (subscription.purpose_sub === "listing_promo") {
      return Response.json(
        {
          error:
            "Boosted listings can’t be paused directly. Pause the main listing subscription instead.",
        },
        { status: 400 },
      );
    }

    if (!isPauseEligibleStatus(subscription.status)) {
      return Response.json(
        {
          error:
            "Only active, trialing, or billing-grace subscriptions can be paused.",
        },
        { status: 400 },
      );
    }

    if (
      subscription.pause_status === "scheduled" ||
      subscription.pause_status === "active"
    ) {
      return Response.json(
        { error: "This subscription is already paused or scheduled to pause." },
        { status: 400 },
      );
    }

    // Keep cancel flow and pause flow separate
    if (subscription.cancel_at_period_end === true) {
      return Response.json(
        {
          error:
            "This subscription is already scheduled to end. Continue it first before scheduling a pause.",
        },
        { status: 400 },
      );
    }

    // Simple v1 anti-abuse rule: one completed pause per subscription
    if ((subscription.pause_count ?? 0) >= 1) {
      return Response.json(
        {
          error:
            "This subscription has already used its available pause. Please contact support if you need help.",
        },
        { status: 400 },
      );
    }

    if (!subscription.current_period_end) {
      return Response.json(
        {
          error:
            "This subscription is missing a current period end date and cannot be paused safely.",
        },
        { status: 400 },
      );
    }

    const pauseStartsAt = subscription.current_period_end;

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const { error: mainUpdateError } = await admin
      .from("subscriptions")
      .update({
        // Pause lifecycle
        pause_status: "scheduled",
        pause_scope: "subscription",
        pause_starts_at: pauseStartsAt,
        pause_ends_at: null,
        pause_reason: reason,
        pause_feedback: feedback,
        pause_email_sent_at: null,
        resume_email_sent_at: null,

        // App/access lifecycle
        cancel_at_period_end: true,

        // Prevent pause from looking like churn
        cancellation_type: null,
        cancellation_reason: null,
        cancellation_feedback: null,
        cancellation_feedback_submitted: false,
        cancellation_requested_at: null,
        winback_email_sent_at: null,
      })
      .eq("id", subscriptionId);

    if (mainUpdateError) {
      throw new Error(
        `Error updating main subscription row for ${subscriptionId}: ${mainUpdateError.message}`,
      );
    }

    // If this is a listing-tied subscription, schedule any dependent boosts too
    const boostResults: Array<{
      stripeSubscriptionId: string;
      updatedInStripe: boolean;
    }> = [];

    if (subscription.listing_id) {
      const { data: promotions, error: promotionsError } = await admin
        .from("listing_promotions")
        .select(`
          stripe_subscription_id,
          listing_id,
          status,
          cancel_at_period_end
        `)
        .eq("listing_id", subscription.listing_id)
        .returns<PromotionRecord[]>();

      if (promotionsError) {
        throw new Error(
          `Error loading dependent boosts for listing ${subscription.listing_id}: ${promotionsError.message}`,
        );
      }

      const eligibleBoosts = (promotions ?? []).filter(
        (promo) =>
          !!promo.stripe_subscription_id &&
          promo.status !== "canceled" &&
          promo.cancel_at_period_end !== true,
      );

      for (const promo of eligibleBoosts) {
        const boostSubscriptionId = promo.stripe_subscription_id!;
        await stripe.subscriptions.update(boostSubscriptionId, {
          cancel_at_period_end: true,
        });

        boostResults.push({
          stripeSubscriptionId: boostSubscriptionId,
          updatedInStripe: true,
        });
      }

      if (eligibleBoosts.length > 0) {
        const boostIds = eligibleBoosts
          .map((promo) => promo.stripe_subscription_id)
          .filter((id): id is string => Boolean(id));

        if (boostIds.length > 0) {
          const { error: boostUpdateError } = await admin
            .from("subscriptions")
            .update({
              pause_status: "scheduled",
              pause_scope: "subscription",
              pause_starts_at: pauseStartsAt,
              pause_ends_at: null,
              pause_reason: "parent_listing_paused",
              pause_feedback: null,
              pause_email_sent_at: null,
              resume_email_sent_at: null,

              cancel_at_period_end: true,

              cancellation_type: null,
              cancellation_reason: null,
              cancellation_feedback: null,
              cancellation_feedback_submitted: false,
              cancellation_requested_at: null,
              winback_email_sent_at: null,
            })
            .in("id", boostIds);

          if (boostUpdateError) {
            throw new Error(
              `Error updating dependent boost subscription rows: ${boostUpdateError.message}`,
            );
          }

          const { error: promoUpdateError } = await admin
            .from("listing_promotions")
            .update({
              cancel_at_period_end: true,
            })
            .eq("listing_id", subscription.listing_id);

          if (promoUpdateError) {
            throw new Error(
              `Error updating listing_promotions for listing ${subscription.listing_id}: ${promoUpdateError.message}`,
            );
          }
        }
      }
    }

    return Response.json({
      ok: true,
      pauseStartsAt,
      dependentBoostsScheduled: boostResults.length,
    });
  } catch (error) {
    console.error("Error pausing subscription:", error);

    return Response.json(
      { error: "Failed to pause subscription." },
      { status: 500 },
    );
  }
}