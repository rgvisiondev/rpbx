// app/business-listings/page.tsx
import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import { BadgeCheckIcon} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { imageUrl } from "@/lib/industryImages";

export const metadata: Metadata = {
  title: "Business Listings | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

// --- filter tokens (match what you SAVE in DB) ---
const INDUSTRIES = [
  { label: "All Categories", value: "" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Retail", value: "Retail" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Construction", value: "Construction" },
  { label: "Professional Services", value: "Professional_services" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Real Estate", value: "Real_estate" },
  { label: "Transportation & Logistics", value: "Transportation_logistics" },
  { label: "Technology", value: "Technology" },
  { label: "Other", value: "Other" },
] as const;

const COUNTIES = [
  { label: "—", value: "" },
  { label: "Hidalgo County", value: "Hidalgo County" },
  { label: "Cameron County", value: "Cameron County" },
  { label: "Starr County", value: "Starr County" },
  { label: "Willacy County", value: "Willacy County" },
] as const;

const ANNUAL = [
  { label: "—", value: "" },
  { label: "0–50K", value: "0_50k" },
  { label: "50K–100K", value: "50k_100k" },
  { label: "100K–250K", value: "100k_250k" },
  { label: "250K–1M", value: "250k_1m" },
  { label: "1M+", value: "1m_plus" },
] as const;

const EBITDA = [
  { label: "—", value: "" },
  { label: "Under 50K", value: "lt_50k" },
  { label: "50K–150K", value: "50k_150k" },
  { label: "150K–500K", value: "150k_500k" },
  { label: "500K–1M", value: "500k_1m" },
  { label: "1M+", value: "gt_1m" },
] as const;

const YEARS = [
  { label: "—", value: "" },
  { label: "Less than 1", value: "lt_1" },
  { label: "1–3", value: "1_3" },
  { label: "3–5", value: "3_5" },
  { label: "5–10", value: "5_10" },
  { label: "10+", value: "gt_10" },
] as const;

const EMP = [
  { label: "—", value: "" },
  { label: "1–4", value: "1_4" },
  { label: "5–10", value: "5_10" },
  { label: "11–25", value: "11_25" },
  { label: "26–50", value: "26_50" },
  { label: "51–100", value: "51_100" },
  { label: "100+", value: "gt_100" },
] as const;

// label maps for displaying tokens on cards
const LABELS = {
  annual: Object.fromEntries(ANNUAL.filter(x => x.value).map(x => [x.value, x.label])),
  ebitda: Object.fromEntries(EBITDA.filter(x => x.value).map(x => [x.value, x.label])),
  years:  Object.fromEntries(YEARS.filter(x => x.value).map(x => [x.value, x.label])),
  emp:    Object.fromEntries(EMP.filter(x => x.value).map(x => [x.value, x.label])),
} as const;

type SearchParams = Promise<{
  industry?: string;
  annual?: string;
  ebitda?: string;
  years?: string;
  emp?: string;
  county?: string;
  sort?: "date" | "revenue" | "ebitda";
  page?: string;
}>;

const PAGE_SIZE = 8;

export default async function Businesses({
  searchParams,
}: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/business-listing");

  // read & validate filters
  const industry = INDUSTRIES.some(i => i.value === sp.industry) ? (sp.industry || "") : "";
  const annual = ANNUAL.some(a => a.value === sp.annual) ? (sp.annual || "") : "";
  const ebitda = EBITDA.some(e => e.value === sp.ebitda) ? (sp.ebitda || "") : "";
  const years  = YEARS.some(y => y.value === sp.years) ? (sp.years || "") : "";
  const emp    = EMP.some(e => e.value === sp.emp) ? (sp.emp || "") : "";
  const county = COUNTIES.some(c => c.value === sp.county) ? (sp.county || "") : "";

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // base query (published & active only)
  let query = supabase
    .from("v_business_listings_with_promo")
    .select(`
      id,
      title,
      industry,
      county,
      city,
      annual_revenue_range,
      ebitda_range,
      listing_image_choice,
      updated_at,
      is_promoted_effective
    `, { count: "exact" })
    .eq("status", "published")
    .eq("is_active", true);

  if (industry) query = query.eq("industry", industry);
  if (annual)   query = query.eq("annual_revenue_range", annual);
  if (ebitda)   query = query.eq("ebitda_range", ebitda);
  if (years)    query = query.eq("years_in_business", years);
  if (emp)      query = query.eq("employee_count_range", emp);
  if (county)   query = query.eq("county", county);

  // sorting — stick to "date" (updated_at desc). (You can add others later.)
  query = query
  .order("is_promoted_effective", { ascending: false, nullsFirst: false})
  .order("updated_at", { ascending: false })
  .range(from, to);

  const { data: rows, count, error } = await query;
  if (error) {
    // basic fallback; you can render a nicer empty state if you prefer
    console.error("Listings query failed:", error.message);
  }

  // signed URLs for covers (private bucket)
  const covers: Record<string, string | null> = {};
  if (rows?.length){
    for (const r of rows){
      covers[r.id] = r.listing_image_choice
        ? imageUrl(r.listing_image_choice)
        : null;
    }
  }

  const total = count ?? 0;
  const startIdx = total ? from + 1 : 0;
  const endIdx = rows ? from + rows.length : 0;

  // helper for building selected attr in the sidebar form
  const sel = (a: string | undefined, b: string) => (a === b ? true : undefined);

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-0">
        <h1 className="text-center pb-15">Business Owners</h1>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* LEFT: Filters (GET form keeps your styling, same spot) */}
          <form id="filters" className="w-full lg:w-1/4 bg-white p-5 rounded-lg shadow-md h-fit">
            {/* Categories (Industry) */}
            <div className="mb-5 max-h-52 overflow-y-auto pr-2">
              <p className="font-medium mb-2">Categories</p>
              <ul className="space-y-2 text-md">
                {INDUSTRIES.map((it) => (
                  <li key={it.value || "all"} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="industry"
                      value={it.value}
                      defaultChecked={sel(industry, it.value)}
                    />
                    <span>{it.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Annual Revenue */}
            <div className="mb-4">
              <label className="block mb-1 text-md">Annual Revenue</label>
              <select name="annual" className="w-full border rounded px-2 py-1 text-md" defaultValue={annual}>
                {ANNUAL.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* EBITDA */}
            <div className="mb-4">
              <label className="block mb-1 text-md">Company EBITDA</label>
              <select name="ebitda" className="w-full border rounded px-2 py-1 text-md" defaultValue={ebitda}>
                {EBITDA.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Years */}
            <div className="mb-4">
              <label className="block mb-1 text-md">Years in Business</label>
              <select name="years" className="w-full border rounded px-2 py-1 text-md" defaultValue={years}>
                {YEARS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* Employees */}
            <div className="mb-4">
              <label className="block mb-1 text-md">Number of Employees</label>
              <select name="emp" className="w-full border rounded px-2 py-1 text-md" defaultValue={emp}>
                {EMP.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {/* County */}
            <div className="mb-4">
              <label className="block mb-1 text-md">County Business is Located In</label>
              <select name="county" className="w-full border rounded px-2 py-1 text-md" defaultValue={county}>
                {COUNTIES.map(opt => <option key={opt.value || "none"} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <Button className="mt-3 w-full">Filter</Button>
          </form>

          {/* RIGHT: Listings */}
          <div className="flex-1">
            {/* Header + Sort (sort wired to ?sort=date for now) */}
            <div className="flex justify-between items-center mb-5">
              <p>{total > 0 ? `Showing ${startIdx}-${endIdx} of ${total} results` : "No results"}</p>
              <div>
                <label className="text-md mr-2">Sort by</label>
                <select
                  name="sort"
                  className="border rounded px-2 py-1 text-md bg-white"
                  defaultValue={sp.sort || "date"}
                  form="filters"               // <-- this makes it submit with the sidebar form
                >
                  <option value="date">Date</option>
                  <option value="revenue" disabled>Revenue</option>
                  <option value="ebitda" disabled>EBITDA</option>
                </select>
              </div>
            </div>
            {/* Grid: 2 per row (sm and up) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(rows || []).map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow-lg overflow-hidden border">
                  {/* Use <img> for signed URLs; Next/Image requires remotePatterns config */}
                  {covers[r.id] ? (
                    <img
                      src={covers[r.id]!}
                      alt={r.title ?? "Business"}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/businesses/home-services.jpg"
                      alt="Business"
                      className="w-full h-40 object-cover"
                      width={300}
                      height={200}
                    />
                  )}

                  <div className="p-5">
                    <div className="flex items-left gap-5">
                    <h4 className="large">{r.industry + " Business" || "Business"}</h4>
                    {r.is_promoted_effective && (
                      <Tooltip>                    
                        <TooltipTrigger>
                          <div className="bg-[#9ed3c3] hover:bg-[#7fb8a9] text-black p-[2px] flex rounded-full items-center justify-center">
                            <BadgeCheckIcon size={15} strokeWidth={2.5} className="text-white"/>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {`Boosted Listing Active`}
                        </TooltipContent>
                      </Tooltip>

                    )}
                    </div>
                    <div className="flex justify-between mt-2">
                      <div>
                        <p className="font-semibold">Annual Revenue</p>
                        <p>{(r.annual_revenue_range && LABELS.annual[r.annual_revenue_range]) || "—"}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Company EBITDA</p>
                        <p>{(r.ebitda_range && LABELS.ebitda[r.ebitda_range]) || "—"}</p>
                      </div>
                    </div>

                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <Image
                        src="/images/icons/location.png"
                        alt="Location"
                        className="w-3 h-4 mr-2"
                        width={16}
                        height={16}
                      />
                      <p>{r.county || "—"}</p>
                    </div>

                    {/* Link to your listing page; adjust route as needed */}
                    <Link href={`/business-listing/${r.id}`}>
                      <Button className="mt-4 w-full">View Business</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Simple pager (prev/next) */}
            {total > PAGE_SIZE && (
              <div className="flex justify-center gap-3 mt-8">
                {page > 1 && (
                  <Link
                    href={{ pathname: "/business-listings", query: { ...sp, page: String(page - 1) } }}
                    className="underline"
                  >
                    ← Previous
                  </Link>
                )}
                {endIdx < total && (
                  <Link
                    href={{ pathname: "/business-listings", query: { ...sp, page: String(page + 1) } }}
                    className="underline"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
