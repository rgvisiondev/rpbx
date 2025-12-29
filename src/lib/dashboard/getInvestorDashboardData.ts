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
  const matches = await matchListingsToInvestor(supabase, userId);

  const [activities, events] = await Promise.all([
    getRecentActivity(supabase, userId),
    getUpcomingEvents(),
  ]);

  return { kind: "investor" as const, matches, activities, events };
}
