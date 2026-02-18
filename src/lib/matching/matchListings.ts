// lib/matching/matchListings.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
type InvestorRow = Database["public"]["Tables"]["investor_profiles"]["Row"];

type InvestorPreview = Pick<
  InvestorRow,
  "user_id" | "primary_industry" | "additional_industries" | "target_ebitda" | "target_cash_flow"
>;

type ListingPreview = Pick<
  Listing,
  | "id"
  | "title"
  | "industry"
  | "city"
  | "county"
  | "created_at"
  | "listing_image_choice"
  | "listing_image_alt"
  | "status"
  | "is_active"
  | "ebitda_range"
  | "cash_flow_range"
  | "annual_revenue_range"
>;

export type BusinessMatch = Omit<
  ListingPreview,
  "ebitda_range" | "cash_flow_range" | "annual_revenue_range"
> & {
  score?: number;
  _source: "matched" | "newest";
};

function matchesIndustry(l: Pick<ListingPreview, "industry">, inv: InvestorPreview): boolean {
  const li = (l.industry || "").toLowerCase();
  if (!li) return false;

  if (inv.primary_industry?.toLowerCase() === li) return true;

  return (
    inv.additional_industries?.some((i) => (i || "").toLowerCase() === li) ?? false
  );
}

// bucket keys should be matched by equality
function bucketMatch(listingKey?: string | null, investorKey?: string | null) {
  if (!listingKey || !investorKey) return false;
  return listingKey === investorKey;
}

function calculateListingScore(l: ListingPreview, inv: InvestorPreview): number {
  let score = 0;

  // Primary signal
  if (matchesIndustry(l, inv)) score += 5;

  // Financial fit signals
  if (bucketMatch(l.ebitda_range, inv.target_ebitda)) score += 3;
  if (bucketMatch(l.cash_flow_range, inv.target_cash_flow)) score += 2;

  // Optional: tiny bump for “bigger” listings when everything ties (recency helps too)
  // if (l.annual_revenue_range) score += 0.25;

  return score;
}

export async function matchListingsToInvestor(
  supabase: SupabaseClient<Database>,
  investorUserId: string
): Promise<BusinessMatch[]> {
  // 1) Load investor profile (partial)
  const { data: inv, error: invErr } = await supabase
    .from("investor_profiles")
    .select("user_id, primary_industry, additional_industries, target_ebitda, target_cash_flow")
    .eq("user_id", investorUserId)
    .maybeSingle<InvestorPreview>();

  if (invErr) throw invErr;

  const investor = inv ?? null;

  // 2) Pull PUBLISHED + ACTIVE listings (partial)
  const { data: listingsRaw, error: listErr } = await supabase
    .from("business_listings")
    .select(
      "id, title, industry, city, county, created_at, listing_image_choice, listing_image_alt, status, is_active, ebitda_range, cash_flow_range, annual_revenue_range"
    )
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  if (listErr) throw listErr;

  const listings = (listingsRaw ?? []) as ListingPreview[];
  if (listings.length === 0) return [];

  // 3) Score
  const scored: BusinessMatch[] = listings.map((l) => ({
    id: l.id,
    title: l.title,
    industry: l.industry,
    city: l.city,
    county: l.county,
    created_at: l.created_at,
    listing_image_choice: l.listing_image_choice,
    listing_image_alt: l.listing_image_alt,
    status: l.status,
    is_active: l.is_active,
    score: investor ? calculateListingScore(l, investor) : 0,
    _source: "matched",
  }));

  const top = scored
    .filter((s) => (s.score ?? 0) > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 4);

  if (top.length > 0) return top;

  // 4) Fallback newest
  return [...scored]
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    )
    .slice(0, 4)
    .map((l) => ({ ...l, _source: "newest" as const }));
}
