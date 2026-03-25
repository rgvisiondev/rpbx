import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { siteUrl } from "@/lib/siteUrl";
import { ManualCancellationConfirmationEmail } from "../../../../../emails/ManualCancellationConfirmationEmail";

export const runtime = "nodejs";

type CancelRequestBody = {
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
  pause_status: string | null;
  purpose_sub: string | null;
  listing_id: string | null;
};

type ProfileRecord = {
  first_name: string | null;
  display_name: string | null;
  user_type: "business" | "investor" | null;
};

function getNameFromEmail(email: string | null | undefined) {
  const prefix = (email ?? "").split("@")[0]?.trim();
  if (!prefix) return "";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export async function POST(req: Request) {
  try {
    const supabase = await createClientRSC();
    const admin = await getSupabaseAdmin();
    const stripe = getStripe();
    const resend = getResendClient();
    const fromEmail = getEmailFrom();

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

    const body = (await req.json()) as CancelRequestBody;
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
        pause_status,
        purpose_sub,
        listing_id
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

    if (subscription.pause_status === "scheduled") {
      return Response.json(
        {
          error:
            "This subscription is scheduled to pause. Resume it first if you want to cancel instead.",
        },
        { status: 400 },
      );
    }

    if (subscription.pause_status === "active") {
      return Response.json(
        {
          error:
            "This subscription is currently paused. Resume it before canceling.",
        },
        { status: 400 },
      );
    }

    if (subscription.cancel_at_period_end === true) {
      return Response.json(
        { error: "This subscription is already scheduled to cancel." },
        { status: 400 },
      );
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        cancellation_reason: reason,
        cancellation_feedback: feedback,
        cancellation_feedback_submitted: !!feedback,
        cancellation_requested_at: new Date().toISOString(),
        cancellation_type: "voluntary",
        winback_email_sent_at: null,
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw new Error(
        `Error canceling subscription ${subscriptionId}: ${updateError.message}`,
      );
    }

    // Resolve email + recipient context for confirmation email
    const [{ data: profile }, { data: customerMap }] = await Promise.all([
      admin
        .from("profiles")
        .select("first_name, display_name, user_type")
        .eq("id", user.id)
        .maybeSingle<ProfileRecord>(),
      admin
        .from("customers")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

    let toEmail: string | null = user.email ?? null;

    if (!toEmail && customerMap?.stripe_customer_id) {
      try {
        const customer = await stripe.customers.retrieve(
          customerMap.stripe_customer_id,
        );
        if (!("deleted" in customer)) {
          toEmail = customer.email ?? null;
        }
      } catch (error) {
        console.error("Error retrieving Stripe customer email:", error);
      }
    }

    if (toEmail) {
      const displayName =
        profile?.first_name?.trim() ||
        profile?.display_name?.trim() ||
        getNameFromEmail(toEmail);

      try {
        await resend.emails.send({
          from: fromEmail,
          to: toEmail,
          subject: "Your cancellation is scheduled",
          react: ManualCancellationConfirmationEmail({
            name: displayName,
            userType: profile?.user_type ?? null,
            reason,
            accessEndsOn: subscription.current_period_end ?? undefined,
            dashboardUrl: `${siteUrl()}/dashboard/billing`,
            pricingUrl: `${siteUrl()}/pricing`,
          }),
        });
      } catch (error) {
        console.error(
          "Failed sending ManualCancellationConfirmationEmail:",
          error,
        );
        // Do not fail the cancellation if the email send fails.
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error canceling subscription:", error);

    return Response.json(
      { error: "Failed to cancel subscription." },
      { status: 500 },
    );
  }
}