import { PauseScheduledEmail } from "../../../../../emails/PauseScheduledEmail";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { siteUrl } from "@/lib/siteUrl";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";

const PAUSE_COOLDOWN_DAYS = 365;

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
  product_name?: string | null;
  pause_status?: string | null;
  pause_scope?: string | null;
  pause_count?: number | null;
  last_pause_started_at?: string | null;
  last_pause_resumed_at?: string | null;
  pause_scheduled_email_sent_at?: string | null;
  pause_activated_email_sent_at?: string | null;
  pause_resumed_email_sent_at?: string | null;
};

type PromotionRecord = {
  stripe_subscription_id: string | null;
  listing_id: string;
  status: string | null;
  cancel_at_period_end: boolean | null;
};

type ProfileRecord = {
  first_name?: string | null;
  display_name?: string | null;
  user_type?: string | null;
};

type ListingRecord = {
  title?: string | null;
};

function isPauseEligibleStatus(status: string | null) {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "unpaid"
  );
}

function formatDateLabel(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getBestName(profile?: ProfileRecord | null, email?: string | null) {
  const firstName = profile?.first_name?.trim();
  if (firstName) return firstName;

  const displayName = profile?.display_name?.trim();
  if (displayName) return displayName;

  const emailPrefix = email?.split("@")[0]?.trim();
  return emailPrefix || undefined;
}

function isWithinRollingWindow(
  iso: string | null | undefined,
  days: number,
): boolean {
  if (!iso) return false;

  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return false;

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  return value >= cutoff;
}

function sameLogicalPauseContext(
  candidate: Pick<
    SubscriptionRecord,
    "listing_id" | "purpose_sub" | "product_name"
  >,
  target: Pick<SubscriptionRecord, "listing_id" | "purpose_sub" | "product_name">,
) {
  if (target.listing_id) {
    return candidate.listing_id === target.listing_id;
  }

  if (target.purpose_sub) {
    return (
      candidate.purpose_sub === target.purpose_sub &&
      candidate.product_name === target.product_name
    );
  }

  return candidate.product_name === target.product_name;
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
      .select(
        `
        id,
        user_id,
        status,
        cancel_at_period_end,
        current_period_end,
        purpose_sub,
        listing_id,
        product_name,
        pause_status,
        pause_scope,
        pause_count,
        last_pause_started_at,
        last_pause_resumed_at,
        pause_scheduled_email_sent_at,
        pause_activated_email_sent_at,
        pause_resumed_email_sent_at
      `,
      )
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

    if (subscription.cancel_at_period_end === true) {
      return Response.json(
        {
          error:
            "This subscription is already scheduled to end. Continue it first before scheduling a pause.",
        },
        { status: 400 },
      );
    }

    const { data: userContextRows, error: contextRowsError } = await admin
      .from("subscriptions")
      .select(
        `
        id,
        user_id,
        listing_id,
        purpose_sub,
        product_name,
        last_pause_started_at
      `,
      )
      .eq("user_id", user.id)
      .neq("purpose_sub", "listing_promo");

    if (contextRowsError) {
      throw new Error(
        `Failed loading subscription history for pause cooldown: ${contextRowsError.message}`,
      );
    }

    const matchingRows = (userContextRows ?? []).filter((row) =>
      sameLogicalPauseContext(
        row as SubscriptionRecord,
        subscription as SubscriptionRecord,
      ),
    );

    const latestPauseStartedAt = matchingRows
      .map((row) => row.last_pause_started_at)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => +new Date(b) - +new Date(a))[0];

    if (isWithinRollingWindow(latestPauseStartedAt, PAUSE_COOLDOWN_DAYS)) {
      return Response.json(
        {
          error:
            "This membership already used a pause within the last 12 months. Please wait until that cooldown window has passed before pausing again.",
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
        pause_status: "scheduled",
        pause_scope: "subscription",
        pause_starts_at: pauseStartsAt,
        pause_ends_at: null,
        pause_reason: reason,
        pause_feedback: feedback,
        pause_scheduled_email_sent_at: null,
        pause_activated_email_sent_at: null,
        pause_resumed_email_sent_at: null,

        cancel_at_period_end: true,

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

    const boostResults: Array<{
      stripeSubscriptionId: string;
      updatedInStripe: boolean;
    }> = [];

    if (subscription.listing_id) {
      const { data: promotions, error: promotionsError } = await admin
        .from("listing_promotions")
        .select(
          `
          stripe_subscription_id,
          listing_id,
          status,
          cancel_at_period_end
        `,
        )
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
              pause_scheduled_email_sent_at: null,
              pause_activated_email_sent_at: null,
              pause_resumed_email_sent_at: null,

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

    if (!subscription.pause_scheduled_email_sent_at) {
      try {
        const resend = getResendClient();

        if (resend) {
          const [{ data: profile }, { data: listing }] = await Promise.all([
            admin
              .from("profiles")
              .select("first_name, display_name, user_type")
              .eq("id", user.id)
              .maybeSingle<ProfileRecord>(),
            subscription.listing_id
              ? admin
                  .from("business_listings")
                  .select("title")
                  .eq("id", subscription.listing_id)
                  .maybeSingle<ListingRecord>()
              : Promise.resolve({ data: null, error: null }),
          ]);

          const name = getBestName(profile ?? null, user.email ?? null);
          const billingUrl = `${siteUrl()}/dashboard/billing`;
          const effectiveDateLabel = formatDateLabel(pauseStartsAt);
          const hasDependentBoost = boostResults.length > 0;

          await resend.emails.send({
            from: getEmailFrom(),
            to: user.email!,
            subject: "Your membership pause is scheduled",
            react: PauseScheduledEmail({
              billingUrl,
              name,
              userType: profile?.user_type ?? null,
              listingTitle: listing?.title ?? null,
              effectiveDateLabel,
              hasDependentBoost,
            }),
            headers: {
              "X-Entity-Ref-ID": `pause-scheduled-${subscriptionId}`,
            },
          });

          await admin
            .from("subscriptions")
            .update({
              pause_scheduled_email_sent_at: new Date().toISOString(),
            })
            .eq("id", subscriptionId);
        }
      } catch (emailError) {
        console.error(
          `Pause scheduled email failed for subscription ${subscriptionId}:`,
          emailError,
        );
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