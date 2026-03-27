import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { FinalBillingWarningEmail } from "../../../../../emails/FinalBillingWarningEmail";
import { PaymentReminderEmail } from "../../../../../emails/PaymentReminderEmail";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/siteUrl";
import { getStripe } from "@/lib/stripe";

function isAuthorizedCronRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  return (
    !!process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await getSupabaseAdmin();

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      user_id,
      first_payment_failed_at,
      dunning_stage,
      billing_issue_open,
      cancel_at_period_end,
      cancellation_type
    `,
    )
    .eq("billing_issue_open", true);

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return new Response("Error fetching subscriptions", { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response("No subscriptions to process", { status: 200 });
  }

  for (const sub of subscriptions) {
    try {
      console.log("Processing sub:", sub.id);

      if (sub.cancellation_type === "voluntary" && sub.cancel_at_period_end) continue;
      if (!sub.billing_issue_open) continue;
      if (!sub.first_payment_failed_at) continue;

      const failedAt = new Date(sub.first_payment_failed_at).getTime();
      if (Number.isNaN(failedAt)) continue;

      const daysSinceFailure = (Date.now() - failedAt) / (1000 * 60 * 60 * 24);
      const stage = sub.dunning_stage ?? "none";

      const { email, name } = await getUserEmailContext(supabase, sub.user_id);
      const billingUrl = await createBillingPortalUrlFromSubscriptionId(sub.id);

      if (daysSinceFailure >= 11 && stage === "reminder_sent") {
        await sendDunningEmail(
          email,
          "Final reminder: update your payment method to avoid cancellation",
          <FinalBillingWarningEmail
            updateBillingUrl={billingUrl}
            name={name}
          />,
          `dunning:${sub.id}:final_warning_sent`,
        );

        await updateDunningStage(supabase, sub.id, "final_warning_sent");
      } else if (daysSinceFailure >= 5 && stage === "none") {
        await sendDunningEmail(
          email,
          "Reminder: update your payment method to keep your membership active",
          <PaymentReminderEmail
            updateBillingUrl={billingUrl}
            name={name}
          />,
          `dunning:${sub.id}:reminder_sent`,
        );

        await updateDunningStage(supabase, sub.id, "reminder_sent");
      }
    } catch (err) {
      console.error(`Failed processing subscription ${sub.id}:`, err);
      continue;
    }
  }

  return new Response("Dunning job complete.", { status: 200 });
}

async function updateDunningStage(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  subId: string,
  stage: string,
) {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      dunning_stage: stage,
      last_dunning_email_sent_at: new Date().toISOString(),
    })
    .eq("id", subId);

  if (error) {
    console.error(`Failed to update dunning stage for ${subId}:`, error);
    throw new Error(`Failed to update dunning stage for ${subId}`);
  }
}

async function getUserEmailContext(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  userId: string,
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error(`Could not resolve profile for user ${userId}:`, profileError);
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  const user = data.user;

  if (error || !user?.email) {
    console.error(`Could not resolve email for user ${userId}:`, error);
    throw new Error(`Could not resolve email for user ${userId}`);
  }

  const name =
    profile?.first_name?.trim() ||
    profile?.full_name?.trim() ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    undefined;

  return {
    email: user.email,
    name,
  };
}

async function sendDunningEmail(
  email: string,
  subject: string,
  emailTemplate: ReactNode,
  idempotencyKey: string,
) {
  const resend = getResendClient();
  const fromEmail = getEmailFrom();

  const { error: sendError } = await resend.emails.send(
    {
      from: fromEmail,
      to: email,
      subject,
      react: emailTemplate,
    },
    {
      idempotencyKey,
    },
  );

  if (sendError) {
    console.error(`Failed sending dunning email to ${email}:`, sendError);
    throw new Error(`Failed sending dunning email to ${email}`);
  }
}

async function createBillingPortalUrlFromSubscriptionId(
  subscriptionId: string,
) {
  const stripe = getStripe();

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl()}/dashboard`,
  });

  return session.url;
}