// lib/matching/dashboard/getBusinessOwnerDashboardMatches.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  scoreInvestorForBusiness,
  type InvestorMatchScore,
} from "@/lib/matching/scoreInvestorForBusiness";

type ListingRow = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorPublicRow =
  Database["public"]["Views"]["v_investor_profiles_public"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type BusinessOwnerDashboardListing = {
  id: string;
  title: string | null;
  industry: string | null;
  city: string | null;
  county: string | null;
  stateCode: string | null;
};

export type BusinessOwnerDashboardMatchedListing = {
  listing: BusinessOwnerDashboardListing;
  score: number;
  tier: InvestorMatchScore["tier"];
  reasons: string[];
  reasonCodes: InvestorMatchScore["reasonCodes"];
  breakdown: InvestorMatchScore["breakdown"];
};

export type BusinessOwnerDashboardInvestor = {
  id: string;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  primaryIndustry: string | null;
  additionalIndustries: string[] | null;
  city: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  organizationEntity: string | null;
};

export type BusinessOwnerDashboardInvestorMatch = {
  kind: "investor_match";
  investor: BusinessOwnerDashboardInvestor;
  bestScore: number;
  bestTier: InvestorMatchScore["tier"];
  bestReasons: string[];
  matchedListings: BusinessOwnerDashboardMatchedListing[];
};

export type GetBusinessOwnerDashboardMatchesOptions = {
  limit?: number;
  includeWeak?: boolean;
  listingId?: string | null;
};

type OwnedListingRow = Pick<
  ListingRow,
  | "id"
  | "owner_id"
  | "title"
  | "industry"
  | "city"
  | "county"
  | "state_code"
  | "status"
  | "is_active"
  | "is_hidden"
  | "ebitda_range"
  | "cash_flow_range"
  | "annual_revenue_range"
  | "updated_at"
  | "created_at"
>;

type InvestorDashboardRow = Pick<
  InvestorPublicRow,
  | "id"
  | "user_id"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "city"
  | "bio"
  | "organization_entity"
  | "ownership_min"
  | "ownership_max"
  | "status"
  | "is_hidden"
  | "has_paid_access"
  | "avatar_path"
  | "updated_at"
  | "created_at"
>;

type PublicProfileName = Pick<
  ProfileRow,
  "id" | "first_name" | "last_name"
>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toDashboardListing(
  listing: OwnedListingRow,
): BusinessOwnerDashboardListing {
  return {
    id: listing.id,
    title: listing.title,
    industry: listing.industry,
    city: listing.city,
    county: listing.county,
    stateCode: listing.state_code,
  };
}

async function getPublicProfileNamesByUserId(
  supabase: SupabaseClient<Database>,
  userIds: string[],
): Promise<Map<string, PublicProfileName>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(isNonEmptyString)));

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("public_profiles")
    .select("id, first_name, last_name")
    .in("id", uniqueUserIds);

  if (error) {
    throw error;
  }

  const byUserId = new Map<string, PublicProfileName>();

  for (const profile of (data ?? []) as PublicProfileName[]) {
    if (!isNonEmptyString(profile.id)) continue;
    byUserId.set(profile.id, profile);
  }

  return byUserId;
}

async function getSignedInvestorAvatarUrls(
  supabase: SupabaseClient<Database>,
  avatarPaths: Array<string | null>,
): Promise<Map<string, string>> {
  const cleanPaths = Array.from(
    new Set(
      avatarPaths
        .filter(isNonEmptyString)
        .map((path) => path.replace(/^\/+/, "")),
    ),
  );

  const signedUrls = new Map<string, string>();

  await Promise.all(
    cleanPaths.map(async (path) => {
      const { data, error } = await supabase.storage
        .from("investors")
        .createSignedUrl(path, 600);

      if (error || !data?.signedUrl) {
        return;
      }

      signedUrls.set(path, data.signedUrl);
    }),
  );

  return signedUrls;
}

export async function getBusinessOwnerDashboardMatches(
  supabase: SupabaseClient<Database>,
  ownerUserId: string,
  options: GetBusinessOwnerDashboardMatchesOptions = {},
): Promise<BusinessOwnerDashboardInvestorMatch[]> {
  const { limit = 50, includeWeak = false, listingId = null } = options;

  if (!isNonEmptyString(ownerUserId)) {
    return [];
  }

  let listingsQuery = supabase
    .from("business_listings")
    .select(
      `
        id,
        owner_id,
        title,
        industry,
        city,
        county,
        state_code,
        status,
        is_active,
        is_hidden,
        ebitda_range,
        cash_flow_range,
        annual_revenue_range,
        updated_at,
        created_at
      `,
    )
    .eq("owner_id", ownerUserId)
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  if (isNonEmptyString(listingId)) {
    listingsQuery = listingsQuery.eq("id", listingId);
  }

  const { data: listingsRaw, error: listingsError } = await listingsQuery;

  if (listingsError) {
    throw listingsError;
  }

  const ownedListings = (listingsRaw ?? []) as OwnedListingRow[];

  if (ownedListings.length === 0) {
    return [];
  }

  const { data: investorsRaw, error: investorsError } = await supabase
    .from("v_investor_profiles_public")
    .select(
      `
        id,
        user_id,
        primary_industry,
        additional_industries,
        target_ebitda,
        target_cash_flow,
        city,
        bio,
        organization_entity,
        ownership_min,
        ownership_max,
        status,
        is_hidden,
        has_paid_access,
        avatar_path,
        updated_at,
        created_at
      `,
    )
    .eq("status", "published")
    .eq("is_hidden", false);

  if (investorsError) {
    throw investorsError;
  }

  const investors = (investorsRaw ?? []) as InvestorDashboardRow[];

  if (investors.length === 0) {
    return [];
  }

  const profileNamesByUserId = await getPublicProfileNamesByUserId(
    supabase,
    investors
      .map((investor) => investor.user_id)
      .filter(isNonEmptyString),
  );

  const avatarUrlsByPath = await getSignedInvestorAvatarUrls(
    supabase,
    investors.map((investor) => investor.avatar_path),
  );

  const grouped = new Map<string, BusinessOwnerDashboardInvestorMatch>();

  for (const listing of ownedListings) {
    if (!isNonEmptyString(listing.id)) {
      continue;
    }

    for (const investor of investors) {
      if (!isNonEmptyString(investor.id)) {
        continue;
      }

      const score = scoreInvestorForBusiness(listing, investor);

      const shouldInclude = includeWeak
        ? score.score > 0
        : score.isWorthSending;

      if (!shouldInclude) {
        continue;
      }

      const profileName = isNonEmptyString(investor.user_id)
        ? profileNamesByUserId.get(investor.user_id) ?? null
        : null;

      const cleanAvatarPath = isNonEmptyString(investor.avatar_path)
        ? investor.avatar_path.replace(/^\/+/, "")
        : null;

      const matchedListing: BusinessOwnerDashboardMatchedListing = {
        listing: toDashboardListing(listing),
        score: score.score,
        tier: score.tier,
        reasons: score.reasons,
        reasonCodes: score.reasonCodes,
        breakdown: score.breakdown,
      };

      const existing = grouped.get(investor.id);

      if (!existing) {
        grouped.set(investor.id, {
          kind: "investor_match",
          investor: {
            id: investor.id,
            userId: investor.user_id,
            firstName: profileName?.first_name ?? null,
            lastName: profileName?.last_name ?? null,
            primaryIndustry: investor.primary_industry,
            additionalIndustries: investor.additional_industries,
            city: investor.city,
            avatarPath: cleanAvatarPath,
            avatarUrl: cleanAvatarPath
              ? avatarUrlsByPath.get(cleanAvatarPath) ?? null
              : null,
            organizationEntity: investor.organization_entity,
          },
          bestScore: score.score,
          bestTier: score.tier,
          bestReasons: score.reasons,
          matchedListings: [matchedListing],
        });

        continue;
      }

      existing.matchedListings.push(matchedListing);

      if (score.score > existing.bestScore) {
        existing.bestScore = score.score;
        existing.bestTier = score.tier;
        existing.bestReasons = score.reasons;
      }
    }
  }

  return Array.from(grouped.values())
    .map((match) => ({
      ...match,
      matchedListings: match.matchedListings.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;

        return (a.listing.title ?? "").localeCompare(b.listing.title ?? "");
      }),
    }))
    .sort((a, b) => {
      const scoreDiff = b.bestScore - a.bestScore;
      if (scoreDiff !== 0) return scoreDiff;

      const aName = `${a.investor.firstName ?? ""} ${a.investor.lastName ?? ""}`.trim();
      const bName = `${b.investor.firstName ?? ""} ${b.investor.lastName ?? ""}`.trim();

      return aName.localeCompare(bName);
    })
    .slice(0, limit);
}