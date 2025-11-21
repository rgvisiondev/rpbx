// lib/dashboard/getBusinessDashboardData.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import { matchInvestorsToListings } from "@/lib/matching/matchInvestors";
import { getRecentActivity } from "@/lib/analytics/getRecentActivity";
import { getUpcomingEvents } from "@/lib/sanity/getUpcomingEvents";

// ✅ Make sure these are exported from their modules.
import type { Activity } from "@/lib/analytics/getRecentActivity";
import type { EventItem } from "@/lib/sanity/getUpcomingEvents";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];

export type InvestorMatch = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_path?: string | null;
  primary_industry?: string | null;
  _source?: "matched" | "newest";
};

export type BusinessDashboardData = {
  kind: "business";
  matches: InvestorMatch[];   // what <MatchedInvestors> expects
  activities: Activity[];     // what <RecentActivityList> expects
  events: EventItem[];        // what <UpcomingEventsList> expects
};

export async function getBusinessDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BusinessDashboardData> {
  const { data: listingsRaw, error: listingsErr } = await supabase
    .from("business_listings")
    .select(
      "id, owner_id, title, industry, ebitda_range, annual_revenue_range, created_at, status, is_active"
    )
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(25);

  if (listingsErr) throw listingsErr;

  const listings = (listingsRaw ?? []) as Listing[];

  const [matches, activities, events] = await Promise.all([
    matchInvestorsToListings(supabase, listings),
    getRecentActivity(supabase, userId, listings),
    getUpcomingEvents(),
  ]);

  return { kind: "business" as const, matches, activities, events };
}
