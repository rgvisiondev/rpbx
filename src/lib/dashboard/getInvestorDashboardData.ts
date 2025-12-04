// lib/dashboard/getInvestorDashboardData.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import {
  matchListingsToInvestor,
  type BusinessMatch,
} from "@/lib/matching/matchListings";
import { getRecentActivity } from "@/lib/analytics/getRecentActivity";
import { getUpcomingEvents } from "@/lib/sanity/getUpcomingEvents";

import type { Activity } from "@/lib/analytics/getRecentActivity";
import type { EventItem } from "@/lib/sanity/getUpcomingEvents";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorProfile = Database["public"]["Tables"]["investor_profiles"]["Row"];

export type InvestorDashboardData = {
  kind: "investor";
  matches: BusinessMatch[];
  activities: Activity[];
  events: EventItem[];
};

export async function getInvestorDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<InvestorDashboardData> {
  // 1) Investor profile
  const { data: invProfile, error: invErr } = await supabase
    .from("investor_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<InvestorProfile>();

  if (invErr) throw invErr;

  // 2) All published + active listings
  const { data: listingsRaw, error: listErr } = await supabase
    .from("business_listings")
    .select("*")
    .eq("is_active", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  if (listErr) throw listErr;

  const allListings = (listingsRaw ?? []) as Listing[];

  const matches = matchListingsToInvestor(allListings, invProfile ?? undefined);

  const [activities, events] = await Promise.all([
    getRecentActivity(supabase, userId),
    getUpcomingEvents(),
  ]);

  return { kind: "investor" as const, matches, activities, events };
}
 