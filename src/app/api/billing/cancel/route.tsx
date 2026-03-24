import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { siteUrl } from "@/lib/siteUrl";
import { ManualCancellationConfirmationEmail } from "../../../../../emails/ManualCancellationConfirmationEmail";

export const runtime = "nodejs";

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
    const reason = body?.reason as string | undefined;
    const feedback = body?.feedback as string | undefined;

    if (!subscriptionId || !reason) {
      return Response.json(
        { error: "subscriptionId and reason are required" },
        { status: 400 },
      );
    }

    // Verify the subscription belongs to the logged-in user
    const { data: subscription, error: subError } = await admin
      .from("subscriptions")
      .select("id, user_id, status, cancel_at_period_end, current_period_end")
      .eq("id", subscriptionId)
      .single();

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

    if (subscription.cancel_at_period_end === true) {
      return Response.json(
        { error: "This subscription is already set to cancel at period end." },
        { status: 400 },
      );
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        cancellation_reason: reason,
        cancellation_feedback: feedback?.trim() || null,
        cancellation_feedback_submitted: !!feedback?.trim(),
        cancellation_requested_at: new Date().toISOString(),
        cancellation_type: "voluntary",
        cancel_at_period_end: true,
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw new Error(
        `Error updating subscription row for ${subscriptionId}: ${updateError.message}`,
      );
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("first_name, display_name, user_type")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Failed to load profile for cancellation email:",
        profileError,
      );
    }

    const { data: authUserData, error: authUserError } =
      await admin.auth.admin.getUserById(user.id);

    if (authUserError) {
      console.error(
        "Failed to load auth user for cancellation email:",
        authUserError,
      );
    }

    const recipientEmail = authUserData.user?.email;
    const name =
      profile?.first_name?.trim() ||
      profile?.display_name?.trim() ||
      authUserData.user?.user_metadata?.display_name ||
      authUserData.user?.user_metadata?.full_name ||
      authUserData.user?.user_metadata?.name ||
      undefined;

    if (recipientEmail) {
      const resend = getResendClient();
      const fromEmail = getEmailFrom();

      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end).toLocaleDateString(
            "en-US",
            {
              month: "long",
              day: "numeric",
              year: "numeric",
            },
          )
        : undefined;

      const { error: emailError } = await resend.emails.send({
        from: fromEmail,
        to: recipientEmail,
        subject:
          reason === "sold_business"
            ? "Your RPBX cancellation is confirmed — congratulations on your next chapter"
            : "Your RPBX cancellation is confirmed",
        react: (
          <ManualCancellationConfirmationEmail
            dashboardUrl={`${siteUrl()}/dashboard`}
            pricingUrl={`${siteUrl()}/pricing`}
            accessEndsOn={currentPeriodEnd}
            name={name}
            userType={profile?.user_type ?? null}
            reason={reason}
          />
        ),
      });

      if (emailError) {
        console.error(
          `Failed to send manual cancellation confirmation email to ${recipientEmail}:`,
          emailError,
        );
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
