import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getEmailFrom, getResendClient } from "@/lib/resend";
import { siteUrl } from "@/lib/siteUrl";
import { WinBackEmail } from "../../../../../emails/WinBackEmail";
import type { ReactNode } from "react";

function isAuthorizedCronRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  return (
    !!process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`
  );
}

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await getSupabaseAdmin();

  // Pick ONE timing field after confirming your sync behavior:
  // ended_at or canceled_at
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      user_id,
      status,
      canceled_at,
      ended_at,
      cancellation_type,
      cancellation_reason,
      winback_email_sent_at
    `)
    .eq("status", "canceled")
    .eq("cancellation_type", "voluntary")
    .is("winback_email_sent_at", null);

  if (error) {
    console.error("Error fetching win-back subscriptions:", error);
    return new Response("Error fetching subscriptions", { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response("No subscriptions eligible for win-back", { status: 200 });
  }

  for (const sub of subscriptions) {
    try {
      if (sub.cancellation_reason === "sold_business") continue;

      const endTimestamp = sub.ended_at ?? sub.canceled_at;
      if (!endTimestamp) continue;

      const endedAt = new Date(endTimestamp).getTime();
      if (Number.isNaN(endedAt)) continue;

      const daysSinceEnd = (Date.now() - endedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceEnd < 3) continue;

      const { email, name, userType } = await getUserContext(supabase, sub.user_id);

      await sendWinBackEmail(
        email,
        "You’re always welcome back to RPBX",
        <WinBackEmail
          pricingUrl={`${siteUrl()}/pricing`}
          name={name}
          userType={userType}
          reason={sub.cancellation_reason}
        />,
        `winback:${sub.id}`
      );

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          winback_email_sent_at: new Date().toISOString(),
        })
        .eq("id", sub.id);

      if (updateError) {
        throw new Error(
          `Failed to mark win-back email sent for ${sub.id}: ${updateError.message}`
        );
      }
    } catch (err) {
      console.error(`Failed processing win-back for ${sub.id}:`, err);
      continue;
    }
  }

  return new Response("Win-back job complete.", { status: 200 });
}

async function getUserContext(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  userId: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, display_name, user_type")
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
    profile?.display_name?.trim() ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    undefined;

  return {
    email: user.email,
    name,
    userType: profile?.user_type ?? null,
  };
}

async function sendWinBackEmail(
  email: string,
  subject: string,
  emailTemplate: ReactNode,
  idempotencyKey: string
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
    }
  );

  if (sendError) {
    console.error(`Failed sending win-back email to ${email}:`, sendError);
    throw new Error(`Failed sending win-back email to ${email}`);
  }
}