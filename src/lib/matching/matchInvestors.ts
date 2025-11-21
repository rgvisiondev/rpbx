// lib/matching/matchInvestors.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorRow = Database["public"]["Tables"]["investor_profiles"]["Row"];
type ProfileRow  = Database["public"]["Tables"]["profiles"]["Row"];

// Only the columns we SELECT from investor_profiles (plus user_id & avatar_path for UI)
type InvestorPreview = Pick<
  InvestorRow,
  | "id"
  | "user_id"
  | "created_at"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "status"
  | "avatar_path"
>;

export type ScoredInvestor = InvestorPreview & {
  score?: number;
  _source: "matched" | "newest";
  profiles?: {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
};

function strIncludes(a?: string | null, b?: string | null) {
  if (!a || !b) return false;
  return (
    a.toLowerCase().includes(b.toLowerCase()) ||
    b.toLowerCase().includes(a.toLowerCase())
  );
}

function industryMatch(listingIndustry: string, inv: InvestorPreview): boolean {
  if (!listingIndustry) return false;
  const li = listingIndustry.toLowerCase();
  if (inv.primary_industry && inv.primary_industry.toLowerCase() === li) return true;
  if (inv.additional_industries?.length) {
    return inv.additional_industries.some((i) => i?.toLowerCase() === li);
  }
  return false;
}

function rangeLikeMatch(listingRange?: string | null, investorTarget?: string | null): boolean {
  if (!listingRange || !investorTarget) return false;
  return strIncludes(listingRange, investorTarget);
}

function calculateMatchScore(inv: InvestorPreview, listings: Listing[]): number {
  let score = 0;

  // +5 industry overlap (any listing)
  const hasIndustryHit = listings.some((l) => industryMatch(l.industry, inv));
  if (hasIndustryHit) score += 5;

  // +3 EBITDA “overlap”
  const hasEbitdaHit = listings.some((l) =>
    rangeLikeMatch(l.ebitda_range, inv.target_ebitda)
  );
  if (hasEbitdaHit) score += 3;

  // +2 Cash-flow proxy vs annual_revenue_range
  const hasCashflowHit = listings.some((l) =>
    rangeLikeMatch(l.annual_revenue_range, inv.target_cash_flow)
  );
  if (hasCashflowHit) score += 2;

  return score;
}

/** Batch-enrich investors with names from profiles in one query */
async function attachNames(
  supabase: SupabaseClient<Database>,
  investors: (InvestorPreview & { _source: "matched" | "newest"; score?: number })[]
): Promise<ScoredInvestor[]> {
  const userIds = Array.from(new Set(investors.map((i) => i.user_id).filter(Boolean)));
  if (userIds.length === 0) {
    // nothing to enrich
    return investors.map((inv) => ({ ...inv, profiles: null }));
  }

  const { data: profs, error: profErr } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .in("id", userIds);

  if (profErr) {
    // If enrichment fails, just return without names rather than throwing
    console.error("attachNames: profiles fetch failed:", profErr.message);
    return investors.map((inv) => ({ ...inv, profiles: null }));
  }

  const byId = new Map<string, Pick<ProfileRow, "first_name" | "last_name">>();
  (profs ?? []).forEach((p) => {
    byId.set(p.id, { first_name: p.first_name, last_name: p.last_name });
  });

  return investors.map((inv) => ({
    ...inv,
    profiles: byId.get(inv.user_id) ?? null,
  }));
}

export async function matchInvestorsToListings(
  supabase: SupabaseClient<Database>,
  listings: Listing[]
): Promise<ScoredInvestor[]> {
  // 1) Pull PUBLISHED investors (only columns we need)
  const { data: investorsRaw, error } = await supabase
    .from("investor_profiles")
    .select<
      "id, user_id, created_at, primary_industry, additional_industries, target_ebitda, target_cash_flow, status, avatar_path"
    >()
    .eq("status", "published");

  if (error) throw error;

  const investors = (investorsRaw ?? []) as InvestorPreview[];

  // 2) Score per investor
  const scored = investors.map((inv) => ({
    ...inv,
    score: calculateMatchScore(inv, listings),
    _source: "matched" as const,
  }));

  const top = scored
    .filter((s) => (s.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 4);

  if (top.length > 0) {
    return attachNames(supabase, top);
  }

  // 3) Fallback: newest 4 published investors (no score filtering)
  const { data: newestRaw, error: newestErr } = await supabase
    .from("investor_profiles")
    .select<
      "id, user_id, created_at, primary_industry, additional_industries, target_ebitda, target_cash_flow, status, avatar_path"
    >()
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(4);

  if (newestErr) throw newestErr;

  const newest = ((newestRaw ?? []) as InvestorPreview[]).map((inv) => ({
    ...inv,
    _source: "newest" as const,
  }));

  return attachNames(supabase, newest);
}
