// lib/matching/matchListings.ts
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorProfile = Database["public"]["Tables"]["investor_profiles"]["Row"];

function strIncludes(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  return aLower.includes(bLower) || bLower.includes(aLower);
}

function matchesIndustry(l: Listing, inv?: InvestorProfile | null): boolean {
  if (!inv) return false;

  const li = (l.industry || "").toLowerCase();
  if (!li) return false;

  if (inv.primary_industry && inv.primary_industry.toLowerCase() === li) {
    return true;
  }

  if (inv.additional_industries?.length) {
    return inv.additional_industries.some(
      (i) => i && i.toLowerCase() === li
    );
  }

  return false;
}

function rangeLikeMatch(
  listingRange?: string | null,
  investorTarget?: string | null
): boolean {
  if (!listingRange || !investorTarget) return false;
  return strIncludes(listingRange, investorTarget);
}

/**
 * Mirror the scoring idea from matchInvestorsToListings:
 * - +5 for industry match
 * - +3 for EBITDA overlap
 * - +2 for annual_revenue_range vs target_cash_flow overlap
 */
function calculateListingScore(
  l: Listing,
  inv?: InvestorProfile | null
): number {
  if (!inv) return 0;

  let score = 0;

  // Industry is the main signal
  if (matchesIndustry(l, inv)) {
    score += 5;
  }

  // EBITDA compatibility
  if (rangeLikeMatch(l.ebitda_range, inv.target_ebitda)) {
    score += 3;
  }

  // Cash-flow proxy vs annual revenue
  if (rangeLikeMatch(l.annual_revenue_range, inv.target_cash_flow)) {
    score += 2;
  }

  return score;
}

export function matchListingsToInvestor(
  all: Listing[],
  inv?: InvestorProfile | null
): Listing[] {
  if (!all.length) return [];

  // Compute scores per listing
  const scored = all.map((l) => ({
    listing: l,
    score: calculateListingScore(l, inv),
  }));

  // Positive-scoring matches first
  const matches = scored
    .filter((s) => (s.score ?? 0) > 0)
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;

      // Tie-breaker: newest first
      const aDate = new Date(a.listing.created_at ?? 0).getTime();
      const bDate = new Date(b.listing.created_at ?? 0).getTime();
      return bDate - aDate;
    })
    .slice(0, 4)
    .map((s) => s.listing);

  if (matches.length > 0) {
    return matches;
  }

  // Fallback: newest 4 listings overall
  return [...all]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    )
    .slice(0, 4);
}
