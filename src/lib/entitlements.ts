// lib/entitlements.ts
import { createClientRSC } from "@/../utils/supabase/server";
import type { Enums } from "@/types/database.types"; // adjust import path to your generated types

export type SubStatus = Enums<"subscription_status">;
export type EntitlementStatus = SubStatus | "none";

const ACCESS_OK = new Set<EntitlementStatus>(["active", "trialing"]);
const ACCESS_GRACE = new Set<EntitlementStatus>(["past_due", "unpaid"]);

const BLOCKED = new Set<EntitlementStatus>([
  "none",
  "canceled",
  "incomplete_expired",
  "paused",
]);

export async function getEntitlement() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      entitled: false,
      status: "none" as EntitlementStatus,
      blocked: true,
      needsBillingFix: false,
      unverified: false,
      role: null as null | "business" | "investor",
    };
  }

  const unverified = !user.email_confirmed_at;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,current_period_start,cancel_at_period_end")
    .eq("user_id", user.id)
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const status = (sub?.status as EntitlementStatus) ?? "none";

  const entitled = ACCESS_OK.has(status) || ACCESS_GRACE.has(status);
  const blocked = BLOCKED.has(status) || status === "incomplete";
  const needsBillingFix = ACCESS_GRACE.has(status);

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.user_type === "business" || profile?.user_type === "investor"
      ? profile.user_type
      : null;

  return { entitled, status, blocked, needsBillingFix, unverified, role };
}