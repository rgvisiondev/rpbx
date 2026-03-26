import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";
import { siteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

type ResumeRequestBody = {
  subscriptionId?: string;
};

type SubscriptionRecord = {
  id: string;
  user_id: string;
  status: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
  pause_status: string | null;
  pause_starts_at: string | null;
  pause_ends_at: string | null;
  pause_reason: string | null;
  pause_feedback: string | null;
  pause_scope: string | null;
  purpose_sub: string | null;
  listing_id: string | null;
  price_id: string | null;
  quantity: number | null;
  metadata: Record<string, unknown> | null;
};

type CustomerRecord = {
  stripe_customer_id: string | null;
};

type PromotionRecord = {
  stripe_subscription_id: string | null;
  listing_id: string;
  status: string | null;
};

function buildCheckoutMetadata(sub: SubscriptionRecord, userId: string) {
  const metadata: Record<string, string> = {
    supabase_user_id: userId,
    resume_from_pause: "true",
    resumed_from_subscription_id: sub.id,
  };

  if (sub.listing_id) {
    metadata.listing_id = sub.listing_id;
  }

  if (sub.purpose_sub) {
    metadata.purpose_sub = sub.purpose_sub;
  }

  if (sub.purpose_sub === "listing_promo") {
    metadata.purpose = "listing_promo";
  } else if (sub.listing_id) {
    metadata.purpose = "listing_plan";
  }

  return metadata;
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

    const body = (await req.json()) as ResumeRequestBody;
    const subscriptionId = body?.subscriptionId?.trim();

    if (!subscriptionId) {
      return Response.json(
        { error: "subscriptionId is required." },
        { status: 400 },
      );
    }

    const subResult = await admin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        status,
        cancel_at_period_end,
        current_period_end,
        pause_status,
        pause_starts_at,
        pause_ends_at,
        pause_reason,
        pause_feedback,
        pause_scope,
        purpose_sub,
        listing_id,
        price_id,
        quantity,
        metadata
      `)
      .eq("id", subscriptionId)
      .single();

    const subscription = (subResult.data as SubscriptionRecord | null) ?? null;
    const subError = subResult.error;

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
            "Boosted listings can’t be resumed directly. Resume the main listing subscription first.",
        },
        { status: 400 },
      );
    }

    if (
      subscription.pause_status !== "scheduled" &&
      subscription.pause_status !== "active"
    ) {
      return Response.json(
        { error: "This subscription is not paused." },
        { status: 400 },
      );
    }

    let hadDependentBoost = false;

    if (subscription.listing_id) {
      const boostResult = await admin
        .from("listing_promotions")
        .select("stripe_subscription_id, listing_id, status")
        .eq("listing_id", subscription.listing_id);

      const boosts = (boostResult.data as PromotionRecord[] | null) ?? [];
      hadDependentBoost = Array.isArray(boosts) && boosts.length > 0;
    }

    // CASE 1: scheduled pause has not taken effect yet
    if (subscription.pause_status === "scheduled") {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      const resumedAt = new Date().toISOString();

      const { error: mainUpdateError } = await admin
        .from("subscriptions")
        .update({
          cancel_at_period_end: false,
          pause_status: null,
          pause_starts_at: null,
          pause_ends_at: null,
          pause_reason: null,
          pause_feedback: null,
          pause_scheduled_email_sent_at: null,
          pause_activated_email_sent_at: null,
          pause_resumed_email_sent_at: null,
          paused_until: null,
          last_pause_resumed_at: resumedAt,
        })
        .eq("id", subscription.id);

      if (mainUpdateError) {
        throw new Error(
          `Error clearing scheduled pause for ${subscription.id}: ${mainUpdateError.message}`,
        );
      }

      if (subscription.listing_id) {
        const boostSubResult = await admin
          .from("subscriptions")
          .select("id")
          .eq("listing_id", subscription.listing_id)
          .eq("purpose_sub", "listing_promo");

        const boostIds = (boostSubResult.data ?? []).map(
          (row: { id: string }) => row.id,
        );

        for (const boostId of boostIds) {
          try {
            await stripe.subscriptions.update(boostId, {
              cancel_at_period_end: false,
            });
          } catch (e) {
            console.error(
              `Failed clearing cancel_at_period_end for dependent boost ${boostId}`,
              e,
            );
          }
        }

        if (boostIds.length > 0) {
          await admin
            .from("subscriptions")
            .update({
              cancel_at_period_end: false,
              pause_status: null,
              pause_starts_at: null,
              pause_ends_at: null,
              pause_reason: null,
              pause_feedback: null,
              pause_scheduled_email_sent_at: null,
              pause_activated_email_sent_at: null,
              pause_resumed_email_sent_at: null,
              paused_until: null,
            })
            .in("id", boostIds);

          await admin
            .from("listing_promotions")
            .update({
              cancel_at_period_end: false,
            })
            .eq("listing_id", subscription.listing_id);
        }
      }

      return Response.json({
        ok: true,
        mode: "scheduled_pause_cleared",
        hadDependentBoost,
      });
    }

    // CASE 2: active pause already took effect
    if (!subscription.price_id) {
      return Response.json(
        {
          error:
            "This paused subscription cannot be resumed automatically because its original price is missing.",
        },
        { status: 400 },
      );
    }

    const customerMapResult = await admin
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customerMap = (customerMapResult.data as CustomerRecord | null) ?? null;
    const customerMapError = customerMapResult.error;

    if (customerMapError) {
      throw new Error(
        `Error loading Stripe customer mapping: ${customerMapError.message}`,
      );
    }

    const metadata = buildCheckoutMetadata(subscription, user.id);
    const baseUrl = typeof siteUrl === "function" ? siteUrl() : siteUrl;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerMap?.stripe_customer_id ?? undefined,
      client_reference_id: user.id,
      success_url: `${baseUrl}/dashboard/billing?resume=success`,
      cancel_url: `${baseUrl}/dashboard/billing?resume=canceled`,
      line_items: [
        {
          price: subscription.price_id,
          quantity: subscription.quantity ?? 1,
        },
      ],
      metadata,
      subscription_data: {
        metadata,
      },
      allow_promotion_codes: true,
    });

    return Response.json({
      ok: true,
      mode: "new_checkout_required",
      url: session.url,
      hadDependentBoost,
    });
  } catch (error) {
    console.error("Error resuming paused subscription:", error);

    return Response.json(
      { error: "Failed to resume paused subscription." },
      { status: 500 },
    );
  }
}