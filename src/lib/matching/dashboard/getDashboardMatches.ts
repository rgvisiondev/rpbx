// lib/matching/dashboard/getDashboardMatches.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  getInvestorDashboardMatches,
  type InvestorDashboardBusinessMatch,
} from "@/lib/matching/dashboard/getInvestorDashboardMatches";
import {
  getBusinessOwnerDashboardMatches,
  type BusinessOwnerDashboardInvestorMatch,
} from "@/lib/matching/dashboard/getBusinessOwnerDashboardMatches";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type DashboardMatchesUserType = "investor" | "business_owner";

export type DashboardMatchesInputUserType = string | null | undefined;

export type GetDashboardMatchesOptions = {
  userType?: DashboardMatchesInputUserType;
  limit?: number;
  includeWeak?: boolean;
  listingId?: string | null;
};

export type InvestorDashboardMatchesResult = {
  userType: "investor";
  matches: InvestorDashboardBusinessMatch[];
};

export type BusinessOwnerDashboardMatchesResult = {
  userType: "business_owner";
  matches: BusinessOwnerDashboardInvestorMatch[];
};

export type DashboardMatchesResult =
  | InvestorDashboardMatchesResult
  | BusinessOwnerDashboardMatchesResult;

type UserProfileTypeRow = Pick<ProfileRow, "id" | "user_type">;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeDashboardUserType(
  userType: DashboardMatchesInputUserType,
): DashboardMatchesUserType | null {
  const normalized = typeof userType === "string"
    ? userType.trim().toLowerCase()
    : null;

  if (normalized === "investor") {
    return "investor";
  }

  if (
    normalized === "business_owner" ||
    normalized === "business" ||
    normalized === "owner"
  ) {
    return "business_owner";
  }

  return null;
}

async function getUserTypeFromProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<DashboardMatchesUserType | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_type")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as UserProfileTypeRow | null;

  return normalizeDashboardUserType(profile?.user_type);
}

export async function getDashboardMatches(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: GetDashboardMatchesOptions = {},
): Promise<DashboardMatchesResult> {
  if (!isNonEmptyString(userId)) {
    return {
      userType: "business_owner",
      matches: [],
    };
  }

  const normalizedUserType =
    normalizeDashboardUserType(options.userType) ??
    (await getUserTypeFromProfile(supabase, userId));

  if (normalizedUserType === "investor") {
    return {
      userType: "investor",
      matches: await getInvestorDashboardMatches(supabase, userId, {
        limit: options.limit,
        includeWeak: options.includeWeak,
      }),
    };
  }

  return {
    userType: "business_owner",
    matches: await getBusinessOwnerDashboardMatches(supabase, userId, {
      limit: options.limit,
      includeWeak: options.includeWeak,
      listingId: options.listingId,
    }),
  };
}