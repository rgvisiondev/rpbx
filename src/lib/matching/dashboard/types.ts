export type DashboardMatchTier = "excellent" | "strong" | "weak";

export type DashboardMatchBreakdown = {
  industry: number;
  geography: number;
  size: number;
  freshness: number;
  completeness: number;
  activity: number;
};

export type InvestorDashboardBusinessMatch = {
  kind: "business_match";
  listing: {
    id: string;
    title: string | null;
    industry: string | null;
    city: string | null;
    stateCode: string | null;
    listingImageChoice: string | null;
    listingImageAlt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  score: number;
  tier: DashboardMatchTier;
  reasons: string[];
  reasonCodes: string[];
  breakdown: DashboardMatchBreakdown;
};

export type BusinessOwnerDashboardInvestorMatch = {
  kind: "investor_match";
  investor: {
    id: string;
    userId: string | null;
    firstName: string | null;
    lastName: string | null;
    primaryIndustry: string | null;
    city: string | null;
    avatarPath: string | null;
    avatarUrl?: string | null;
    organizationEntity: string | null;
  };
  bestScore: number;
  bestTier: DashboardMatchTier;
  bestReasons: string[];
  matchedListings: {
    listing: {
      id: string;
      title: string | null;
      industry: string | null;
      city: string | null;
      stateCode: string | null;
    };
    score: number;
    tier: DashboardMatchTier;
    reasons: string[];
    reasonCodes: string[];
    breakdown: DashboardMatchBreakdown;
  }[];
};

export type DashboardMatchesResult =
  | {
      userType: "investor";
      matches: InvestorDashboardBusinessMatch[];
    }
  | {
      userType: "business_owner";
      matches: BusinessOwnerDashboardInvestorMatch[];
    };