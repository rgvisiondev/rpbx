// lib/dashboard/getInvestorDashboardData.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import {
  getInvestorDashboardMatches,
  type InvestorDashboardBusinessMatch,
} from "@/lib/matching/dashboard/getInvestorDashboardMatches";

import { getRecentActivity } from "@/lib/analytics/getRecentActivity";
import { getUpcomingEvents } from "@/lib/sanity/getUpcomingEvents";

import type { Activity } from "@/lib/analytics/getRecentActivity";
import type { EventItem } from "@/lib/sanity/getUpcomingEvents";

export type InvestorDashboardData = {
  kind: "investor";
  matches: InvestorDashboardBusinessMatch[];
  activities: Activity[];
  events: EventItem[];
};

export async function getInvestorDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<InvestorDashboardData> {
  const [matches, activities, events] = await Promise.all([
    getInvestorDashboardMatches(supabase, userId, {
      limit: 4,
      includeWeak: false,
    }),
    getRecentActivity(supabase, userId),
    getUpcomingEvents(),
  ]);

  return {
    kind: "investor",
    matches,
    activities,
    events,
  };
}