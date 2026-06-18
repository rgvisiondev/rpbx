// lib/matching/dashboard/getInvestorDashboardMatches.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  scoreBusinessForInvestor,
  type BusinessMatchScore,
  type InvestorForScoring,
} from "@/lib/matching/scoreBusinessForInvestor";

type ListingRow = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorRow = Database["public"]["Tables"]["investor_profiles"]["Row"];

export type InvestorDashboardListing = {
  id: string;
  title: string | null;
  industry: string | null;
  city: string | null;
  county: string | null;
  stateCode: string | null;
  listingImageChoice: string | null;
  listingImagePath: string | null;
  listingImageAlt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InvestorDashboardBusinessMatch = {
  kind: "business_match";
  listing: InvestorDashboardListing;
  score: number;
  tier: BusinessMatchScore["tier"];
  reasons: string[];
  reasonCodes: BusinessMatchScore["reasonCodes"];
  breakdown: BusinessMatchScore["breakdown"];
};

export type GetInvestorDashboardMatchesOptions = {
  limit?: number;
  includeWeak?: boolean;
};

type InvestorDashboardProfile = Pick<
  InvestorRow,
  | "id"
  | "user_id"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "city"
  | "status"
  | "is_hidden"
  | "updated_at"
  | "created_at"
>;

type ListingDashboardRow = Pick<
  ListingRow,
  | "id"
  | "owner_id"
  | "title"
  | "industry"
  | "city"
  | "county"
  | "state_code"
  | "description"
  | "status"
  | "is_active"
  | "is_hidden"
  | "ebitda_range"
  | "cash_flow_range"
  | "annual_revenue_range"
  | "listing_image_choice"
  | "listing_image_path"
  | "listing_image_alt"
  | "created_at"
  | "updated_at"
>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toInvestorForScoring(
  investor: InvestorDashboardProfile,
): InvestorForScoring {
  return {
    user_id: investor.user_id,
    primary_industry: investor.primary_industry,
    additional_industries: investor.additional_industries,
    target_ebitda: investor.target_ebitda,
    target_cash_flow: investor.target_cash_flow,
    city: investor.city,
    status: investor.status,
    updated_at: investor.updated_at,
    created_at: investor.created_at,
  };
}

function toDashboardListing(
  listing: ListingDashboardRow,
): InvestorDashboardListing {
  return {
    id: listing.id,
    title: listing.title,
    industry: listing.industry,
    city: listing.city,
    county: listing.county,
    stateCode: listing.state_code,
    listingImageChoice: listing.listing_image_choice,
    listingImagePath: listing.listing_image_path,
    listingImageAlt: listing.listing_image_alt,
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  };
}

export async function getInvestorDashboardMatches(
  supabase: SupabaseClient<Database>,
  investorUserId: string,
  options: GetInvestorDashboardMatchesOptions = {},
): Promise<InvestorDashboardBusinessMatch[]> {
  const { limit = 50, includeWeak = false } = options;

  if (!isNonEmptyString(investorUserId)) {
    return [];
  }

  const { data: investorRaw, error: investorError } = await supabase
    .from("investor_profiles")
    .select(
      `
        id,
        user_id,
        primary_industry,
        additional_industries,
        target_ebitda,
        target_cash_flow,
        city,
        status,
        is_hidden,
        updated_at,
        created_at
      `,
    )
    .eq("user_id", investorUserId)
    .maybeSingle();

  if (investorError) {
    throw investorError;
  }

  const investor = investorRaw as InvestorDashboardProfile | null;

  if (
    !investor ||
    investor.status !== "published" ||
    investor.is_hidden === true
  ) {
    return [];
  }

  const { data: listingsRaw, error: listingsError } = await supabase
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
        description,
        status,
        is_active,
        is_hidden,
        ebitda_range,
        cash_flow_range,
        annual_revenue_range,
        listing_image_choice,
        listing_image_path,
        listing_image_alt,
        created_at,
        updated_at
      `,
    )
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  if (listingsError) {
    throw listingsError;
  }

  const listings = (listingsRaw ?? []) as ListingDashboardRow[];
  const investorForScoring = toInvestorForScoring(investor);

  const matches = listings
    .map((listing): InvestorDashboardBusinessMatch | null => {
      if (!isNonEmptyString(listing.id)) {
        return null;
      }

      const score = scoreBusinessForInvestor(listing, investorForScoring);

      const shouldInclude = includeWeak
        ? score.score > 0
        : score.isWorthSending;

      if (!shouldInclude) {
        return null;
      }

      return {
        kind: "business_match",
        listing: toDashboardListing(listing),
        score: score.score,
        tier: score.tier,
        reasons: score.reasons,
        reasonCodes: score.reasonCodes,
        breakdown: score.breakdown,
      };
    })
    .filter((match): match is InvestorDashboardBusinessMatch => match !== null)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      const aUpdated = new Date(a.listing.updatedAt ?? a.listing.createdAt ?? 0).getTime();
      const bUpdated = new Date(b.listing.updatedAt ?? b.listing.createdAt ?? 0).getTime();

      return bUpdated - aUpdated;
    });

  return matches.slice(0, limit);
}