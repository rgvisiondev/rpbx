// lib/matching/matchListings.ts
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorProfile = Database["public"]["Tables"]["investor_profiles"]["Row"];

function matchesIndustry(l: Listing, inv?: InvestorProfile | null): boolean {
  if (!inv) return false;
  const li = (l.industry || "").toLowerCase();
  if (inv.primary_industry && inv.primary_industry.toLowerCase() === li) return true;
  if (inv.additional_industries?.length) {
    return inv.additional_industries.some((i) => i?.toLowerCase() === li);
  }
  return false;
}

export function matchListingsToInvestor(
  all: Listing[],
  inv?: InvestorProfile | null
): Listing[] {
  const prioritized = all.filter((l) => matchesIndustry(l, inv));
  const pool = prioritized.length ? prioritized : all;
  return [...pool]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    )
    .slice(0, 4);
}
