// lib/dashboard/getBusinessDashboardData.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import {
  getBusinessOwnerDashboardMatches,
  type BusinessOwnerDashboardInvestorMatch,
} from "@/lib/matching/dashboard/getBusinessOwnerDashboardMatches";

import { getRecentActivity } from "@/lib/analytics/getRecentActivity";
import { getUpcomingEvents } from "@/lib/sanity/getUpcomingEvents";

import type { Activity } from "@/lib/analytics/getRecentActivity";
import type { EventItem } from "@/lib/sanity/getUpcomingEvents";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];

export type BusinessDashboardData = {
  kind: "business";
  matches: BusinessOwnerDashboardInvestorMatch[];
  activities: Activity[];
  events: EventItem[];
};

export async function getBusinessDashboardData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BusinessDashboardData> {
  const { data: listingsRaw, error: listingsErr } = await supabase
    .from("business_listings")
    .select(
      "id, owner_id, title, industry, ebitda_range, cash_flow_range, annual_revenue_range, created_at, status, is_active",
    )
    .eq("owner_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(25);

  if (listingsErr) throw listingsErr;

  const listings = (listingsRaw ?? []) as Listing[];

  const [matches, activities, events] = await Promise.all([
    getBusinessOwnerDashboardMatches(supabase, userId, {
      limit: 4,
      includeWeak: false,
    }),
    getRecentActivity(supabase, userId, listings),
    getUpcomingEvents(),
  ]);

  return {
    kind: "business",
    matches,
    activities,
    events,
  };
}