// lib/matching/scoreBusinessForInvestor.ts
import type { Database } from "@/types/database.types";

type ListingRow = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorRow = Database["public"]["Tables"]["investor_profiles"]["Row"];

export type InvestorForScoring = Pick<
  InvestorRow,
  | "user_id"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "city"
  | "status"
  | "updated_at"
  | "created_at"
>;

export type ListingForScoring = Pick<
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
  | "created_at"
  | "updated_at"
>;

export type MatchTier = "excellent" | "strong" | "weak";

export type ScoreReasonCode =
  | "industry_primary_match"
  | "industry_additional_match"
  | "city_match"
  | "size_ebitda_match"
  | "size_cash_flow_match"
  | "size_dual_match"
  | "listing_recently_updated"
  | "listing_recently_created"
  | "listing_complete_profile"
  | "listing_has_description"
  | "listing_has_financials"
  | "listing_has_image"
  | "listing_is_active";

export type BusinessMatchScore = {
  score: number;
  tier: MatchTier;
  isWorthSending: boolean;
  reasons: string[];
  reasonCodes: ScoreReasonCode[];
  breakdown: {
    industry: number;
    geography: number;
    size: number;
    freshness: number;
    completeness: number;
    activity: number;
  };
};

const THRESHOLDS = {
  excellent: 80,
  strong: 60,
};

function normalize(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "";
}

function daysSince(dateLike?: string | null): number | null {
  if (!dateLike) return null;
  const ts = new Date(dateLike).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function listingIndustryMatch(
  listing: ListingForScoring,
  investor: InvestorForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const listingIndustry = normalize(listing.industry);
  if (!listingIndustry) {
    return { points: 0, reasons: [], reasonCodes: [] };
  }

  if (normalize(investor.primary_industry) === listingIndustry) {
    return {
      points: 35,
      reasons: ["Matches your primary industry focus"],
      reasonCodes: ["industry_primary_match"],
    };
  }

  const additional = (investor.additional_industries ?? []).map(normalize);
  if (additional.includes(listingIndustry)) {
    return {
      points: 28,
      reasons: ["Matches one of your additional industry interests"],
      reasonCodes: ["industry_additional_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function geographyMatch(
  listing: ListingForScoring,
  investor: InvestorForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const investorCity = normalize(investor.city);
  const listingCity = normalize(listing.city);

  if (investorCity && listingCity && investorCity === listingCity) {
    return {
      points: 15,
      reasons: ["Located in your target city"],
      reasonCodes: ["city_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function bucketMatch(a?: string | null, b?: string | null): boolean {
  return hasValue(a) && hasValue(b) && a === b;
}

function sizeMatch(
  listing: ListingForScoring,
  investor: InvestorForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const ebitda = bucketMatch(listing.ebitda_range, investor.target_ebitda);
  const cashFlow = bucketMatch(listing.cash_flow_range, investor.target_cash_flow);

  if (ebitda && cashFlow) {
    return {
      points: 25,
      reasons: ["Fits your EBITDA and cash-flow target range"],
      reasonCodes: ["size_dual_match", "size_ebitda_match", "size_cash_flow_match"],
    };
  }

  if (ebitda) {
    return {
      points: 15,
      reasons: ["Fits your EBITDA target range"],
      reasonCodes: ["size_ebitda_match"],
    };
  }

  if (cashFlow) {
    return {
      points: 10,
      reasons: ["Fits your cash-flow target range"],
      reasonCodes: ["size_cash_flow_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function freshnessScore(
  listing: ListingForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const updatedDays = daysSince(listing.updated_at);
  const createdDays = daysSince(listing.created_at);

  if (updatedDays !== null && updatedDays <= 30) {
    return {
      points: 10,
      reasons: ["Recently updated listing"],
      reasonCodes: ["listing_recently_updated"],
    };
  }

  if (createdDays !== null && createdDays <= 30) {
    return {
      points: 8,
      reasons: ["Recently added listing"],
      reasonCodes: ["listing_recently_created"],
    };
  }

  if (updatedDays !== null && updatedDays <= 90) {
    return {
      points: 4,
      reasons: [],
      reasonCodes: [],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function completenessScore(
  listing: ListingForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  let points = 0;
  const reasons: string[] = [];
  const reasonCodes: ScoreReasonCode[] = [];

  if (hasValue(listing.description)) {
    points += 4;
    reasons.push("Includes a business summary");
    reasonCodes.push("listing_has_description");
  }

  if (
    hasValue(listing.ebitda_range) ||
    hasValue(listing.cash_flow_range) ||
    hasValue(listing.annual_revenue_range)
  ) {
    points += 4;
    reasons.push("Includes financial details");
    reasonCodes.push("listing_has_financials");
  }

  if (hasValue(listing.listing_image_choice) || hasValue(listing.listing_image_path)) {
    points += 2;
    reasons.push("Includes listing media");
    reasonCodes.push("listing_has_image");
  }

  if (points >= 8) {
    reasonCodes.push("listing_complete_profile");
  }

  return { points, reasons, reasonCodes };
}

function activityScore(
  listing: ListingForScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const isEligible =
    listing.status === "published" &&
    listing.is_active === true &&
    listing.is_hidden === false;

  if (!isEligible) {
    return { points: 0, reasons: [], reasonCodes: [] };
  }

  return {
    points: 5,
    reasons: ["Active published listing"],
    reasonCodes: ["listing_is_active"],
  };
}

function toTier(score: number): MatchTier {
  if (score >= THRESHOLDS.excellent) return "excellent";
  if (score >= THRESHOLDS.strong) return "strong";
  return "weak";
}

function dedupeReasons(reasons: string[]): string[] {
  return Array.from(new Set(reasons)).slice(0, 4);
}

function dedupeReasonCodes(codes: ScoreReasonCode[]): ScoreReasonCode[] {
  return Array.from(new Set(codes));
}

export function scoreBusinessForInvestor(
  listing: ListingForScoring,
  investor: InvestorForScoring
): BusinessMatchScore {
  const industry = listingIndustryMatch(listing, investor);
  const geography = geographyMatch(listing, investor);
  const size = sizeMatch(listing, investor);
  const freshness = freshnessScore(listing);
  const completeness = completenessScore(listing);
  const activity = activityScore(listing);

  const score =
    industry.points +
    geography.points +
    size.points +
    freshness.points +
    completeness.points +
    activity.points;

  const reasons = dedupeReasons([
    ...industry.reasons,
    ...geography.reasons,
    ...size.reasons,
    ...freshness.reasons,
    ...completeness.reasons,
    ...activity.reasons,
  ]);

  const reasonCodes = dedupeReasonCodes([
    ...industry.reasonCodes,
    ...geography.reasonCodes,
    ...size.reasonCodes,
    ...freshness.reasonCodes,
    ...completeness.reasonCodes,
    ...activity.reasonCodes,
  ]);

  const tier = toTier(score);

  return {
    score,
    tier,
    isWorthSending: tier === "excellent" || tier === "strong",
    reasons,
    reasonCodes,
    breakdown: {
      industry: industry.points,
      geography: geography.points,
      size: size.points,
      freshness: freshness.points,
      completeness: completeness.points,
      activity: activity.points,
    },
  };
}