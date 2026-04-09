// lib/matching/scoreInvestorForBusiness.ts
import type { Database } from "@/types/database.types";

type ListingRow = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorPublicRow = Database["public"]["Views"]["v_investor_profiles_public"]["Row"];

export type ListingForInvestorScoring = Pick<
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

export type InvestorForBusinessScoring = Pick<
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
  | "updated_at"
  | "created_at"
>;

export type MatchTier = "excellent" | "strong" | "weak";

export type ScoreReasonCode =
  | "industry_primary_match"
  | "industry_additional_match"
  | "city_match"
  | "size_ebitda_match"
  | "size_cash_flow_match"
  | "size_dual_match"
  | "investor_recently_updated"
  | "investor_recently_created"
  | "investor_complete_profile"
  | "investor_has_bio"
  | "investor_has_org"
  | "investor_has_ownership_range"
  | "investor_is_active"
  | "investor_has_paid_access";

export type InvestorMatchScore = {
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

function investorIndustryMatch(
  listing: ListingForInvestorScoring,
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const listingIndustry = normalize(listing.industry);
  if (!listingIndustry) {
    return { points: 0, reasons: [], reasonCodes: [] };
  }

  if (normalize(investor.primary_industry) === listingIndustry) {
    return {
      points: 35,
      reasons: ["Interested in your industry"],
      reasonCodes: ["industry_primary_match"],
    };
  }

  const additional = (investor.additional_industries ?? []).map(normalize);
  if (additional.includes(listingIndustry)) {
    return {
      points: 28,
      reasons: ["Includes your industry in additional target sectors"],
      reasonCodes: ["industry_additional_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function geographyMatch(
  listing: ListingForInvestorScoring,
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const listingCity = normalize(listing.city);
  const investorCity = normalize(investor.city);

  if (listingCity && investorCity && listingCity === investorCity) {
    return {
      points: 15,
      reasons: ["Based in the same city as your listing"],
      reasonCodes: ["city_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function bucketMatch(a?: string | null, b?: string | null): boolean {
  return hasValue(a) && hasValue(b) && a === b;
}

function sizeMatch(
  listing: ListingForInvestorScoring,
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const ebitda = bucketMatch(listing.ebitda_range, investor.target_ebitda);
  const cashFlow = bucketMatch(listing.cash_flow_range, investor.target_cash_flow);

  if (ebitda && cashFlow) {
    return {
      points: 25,
      reasons: ["Fits your listing’s EBITDA and cash-flow profile"],
      reasonCodes: ["size_dual_match", "size_ebitda_match", "size_cash_flow_match"],
    };
  }

  if (ebitda) {
    return {
      points: 15,
      reasons: ["Fits your listing’s EBITDA range"],
      reasonCodes: ["size_ebitda_match"],
    };
  }

  if (cashFlow) {
    return {
      points: 10,
      reasons: ["Fits your listing’s cash-flow range"],
      reasonCodes: ["size_cash_flow_match"],
    };
  }

  return { points: 0, reasons: [], reasonCodes: [] };
}

function freshnessScore(
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  const updatedDays = daysSince(investor.updated_at);
  const createdDays = daysSince(investor.created_at);

  if (updatedDays !== null && updatedDays <= 30) {
    return {
      points: 10,
      reasons: ["Recently updated investor profile"],
      reasonCodes: ["investor_recently_updated"],
    };
  }

  if (createdDays !== null && createdDays <= 30) {
    return {
      points: 8,
      reasons: ["Recently joined investor"],
      reasonCodes: ["investor_recently_created"],
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
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  let points = 0;
  const reasons: string[] = [];
  const reasonCodes: ScoreReasonCode[] = [];

  if (hasValue(investor.bio)) {
    points += 4;
    reasons.push("Has a completed investor bio");
    reasonCodes.push("investor_has_bio");
  }

  if (hasValue(investor.organization_entity)) {
    points += 3;
    reasons.push("Includes investor organization details");
    reasonCodes.push("investor_has_org");
  }

  if (
    investor.ownership_min !== null ||
    investor.ownership_max !== null
  ) {
    points += 3;
    reasons.push("Includes transaction preference details");
    reasonCodes.push("investor_has_ownership_range");
  }

  if (points >= 8) {
    reasonCodes.push("investor_complete_profile");
  }

  return { points, reasons, reasonCodes };
}

function activityScore(
  investor: InvestorForBusinessScoring
): { points: number; reasons: string[]; reasonCodes: ScoreReasonCode[] } {
  let points = 0;
  const reasons: string[] = [];
  const reasonCodes: ScoreReasonCode[] = [];

  const isActive =
    investor.status === "published" &&
    investor.is_hidden === false;

  if (isActive) {
    points += 3;
    reasons.push("Active investor profile");
    reasonCodes.push("investor_is_active");
  }

  if (investor.has_paid_access === true) {
    points += 2;
    reasons.push("Currently has platform access");
    reasonCodes.push("investor_has_paid_access");
  }

  return { points, reasons, reasonCodes };
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

export function scoreInvestorForBusiness(
  listing: ListingForInvestorScoring,
  investor: InvestorForBusinessScoring
): InvestorMatchScore {
  const industry = investorIndustryMatch(listing, investor);
  const geography = geographyMatch(listing, investor);
  const size = sizeMatch(listing, investor);
  const freshness = freshnessScore(investor);
  const completeness = completenessScore(investor);
  const activity = activityScore(investor);

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