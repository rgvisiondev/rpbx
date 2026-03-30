import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";

type ContinueSubscriptionRecord = {
  id: string;
  user_id: string;
  cancel_at_period_end: boolean | null;
  pause_status: string | null;
  purpose_sub: string | null;
  listing_id: string | null;
  cancellation_type: string | null;
};

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

    const body = await req.json();
    const subscriptionId = body?.subscriptionId as string | undefined;

    if (!subscriptionId) {
      return Response.json(
        { error: "subscriptionId is required." },
        { status: 400 },
      );
    }

    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        cancel_at_period_end,
        pause_status,
        purpose_sub,
        listing_id,
        cancellation_type
      `)
      .eq("id", subscriptionId)
      .single<ContinueSubscriptionRecord>();

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

    // Continue should remain cancellation-only.
    if (
      subscription.pause_status === "scheduled" ||
      subscription.pause_status === "active"
    ) {
      return Response.json(
        { error: "Use resume for paused subscriptions." },
        { status: 400 },
      );
    }

    if (subscription.cancel_at_period_end !== true) {
      return Response.json(
        { error: "This subscription is not scheduled to cancel." },
        { status: 400 },
      );
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        cancellation_reason: null,
        cancellation_feedback: null,
        cancellation_feedback_submitted: false,
        cancellation_requested_at: null,
        cancellation_type: null,
        winback_email_sent_at: null,
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw new Error(
        `Error continuing subscription ${subscriptionId}: ${updateError.message}`,
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error continuing subscription:", error);

    return Response.json(
      { error: "Failed to continue subscription." },
      { status: 500 },
    );
  }
}