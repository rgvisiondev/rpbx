// lib/entitlements.ts
import { createClientRSC } from "@/../utils/supabase/server";

/** returns { entitled, role, unverified } */
export async function getEntitlement() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { entitled: false, unverified: false, role: null as null | "business" | "investor" };

  // Optional: require email verification before anything else
  const unverified = !user.email_confirmed_at;

  // Active/trialing sub is “in”
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status,cancel_at_period_end,current_period_end")
    .eq("user_id", user.id)
    .in("status", ["active","trialing"])
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const entitled = !!sub;

  // Role from profiles (set by your webhook)
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.user_type === "business" || profile?.user_type === "investor")
    ? profile.user_type
    : null;

  return { entitled, unverified, role };
}
