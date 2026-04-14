// app/business-listings/page.tsx
import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import { BadgeCheckIcon, Filter, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { imageUrl, INDUSTRY_OPTIONS } from "@/lib/industryImages";
import {
  ANNUAL_REVENUE_BUCKETS,
  EBITDA_BUCKETS,
  YEARS_IN_BUSINESS_BUCKETS,
  EMPLOYEE_COUNT_BUCKETS,
  labelForKey,
} from "@/lib/ranges";

export const metadata: Metadata = {
  title: "Business Listings | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

const INDUSTRIES = [
  { label: "All Categories", value: "" },
  ...INDUSTRY_OPTIONS.map((label) => ({
    label,
    value: label,
  })),
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
  ...ANNUAL_REVENUE_BUCKETS.map((b) => ({
    label: b.label,
    value: b.key,
  })),
] as const;

const EBITDA = [
  { label: "—", value: "" },
  ...EBITDA_BUCKETS.map((b) => ({
    label: b.label,
    value: b.key,
  })),
] as const;

const YEARS = [
  { label: "—", value: "" },
  ...YEARS_IN_BUSINESS_BUCKETS.map((b) => ({
    label: b.label,
    value: b.key,
  })),
] as const;

const EMP = [
  { label: "—", value: "" },
  ...EMPLOYEE_COUNT_BUCKETS.map((b) => ({
    label: b.label,
    value: b.key,
  })),
] as const;

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

  const industry = INDUSTRIES.some(i => i.value === sp.industry) ? (sp.industry || "") : "";
  const annual = ANNUAL.some(a => a.value === sp.annual) ? (sp.annual || "") : "";
  const ebitda = EBITDA.some(e => e.value === sp.ebitda) ? (sp.ebitda || "") : "";
  const years = YEARS.some(y => y.value === sp.years) ? (sp.years || "") : "";
  const emp = EMP.some(e => e.value === sp.emp) ? (sp.emp || "") : "";
  const county = COUNTIES.some(c => c.value === sp.county) ? (sp.county || "") : "";

  const page = Math.max(1, Number(sp.page || "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

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
      years_in_business,
      employee_count_range,
      listing_image_choice,
      updated_at,
      is_promoted_effective,
      has_purchased_valuation
    `, { count: "exact" })
    .eq("status", "published")
    .eq("is_active", true);

  if (industry) query = query.eq("industry", industry);
  if (annual) query = query.eq("annual_revenue_range", annual);
  if (ebitda) query = query.eq("ebitda_range", ebitda);
  if (years) query = query.eq("years_in_business", years);
  if (emp) query = query.eq("employee_count_range", emp);
  if (county) query = query.eq("county", county);

  query = query
    .order("is_promoted_effective", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .range(from, to);

  const { data: rows, count, error } = await query;
  if (error) {
    console.error("Listings query failed:", error.message);
  }

  const covers: Record<string, string | null> = {};
  if (rows?.length) {
    for (const r of rows) {
      covers[r.id] = r.listing_image_choice
        ? imageUrl(r.listing_image_choice)
        : null;
    }
  }

  const total = count ?? 0;
  const startIdx = total ? from + 1 : 0;
  const endIdx = rows ? from + rows.length : 0;

  const sel = (a: string | undefined, b: string) => (a === b ? true : undefined);

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
        <h1 className="text-center pb-15">Business Listings</h1>

        <div className="flex flex-col md:flex-row gap-10">
          <div className="w-full md:w-1/3 lg:w-1/4 h-fit">
            <input type="checkbox" id="filter-toggle" className="peer hidden" />
            <label
              htmlFor="filter-toggle"
              className="md:hidden w-full bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center cursor-pointer select-none text-gray-700"
            >
              <div className="flex items-center gap-2">
                <Filter size={20} />
                <span className="font-semibold">Filters</span>
              </div>
              <ChevronDown size={20} />
            </label>

            <form id="filters" className="hidden peer-checked:block md:block w-full bg-white p-5 rounded-lg shadow-md">
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

              <div className="mb-4">
                <label className="block mb-1 text-md">Annual Revenue</label>
                <select
                  name="annual"
                  className="w-full border rounded px-2 py-1 text-md"
                  defaultValue={annual}
                >
                  {ANNUAL.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-md">Company EBITDA</label>
                <select
                  name="ebitda"
                  className="w-full border rounded px-2 py-1 text-md"
                  defaultValue={ebitda}
                >
                  {EBITDA.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-md">Years in Business</label>
                <select
                  name="years"
                  className="w-full border rounded px-2 py-1 text-md"
                  defaultValue={years}
                >
                  {YEARS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-md">Number of Employees</label>
                <select
                  name="emp"
                  className="w-full border rounded px-2 py-1 text-md"
                  defaultValue={emp}
                >
                  {EMP.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-md">County Business is Located In</label>
                <select
                  name="county"
                  className="w-full border rounded px-2 py-1 text-md"
                  defaultValue={county}
                >
                  {COUNTIES.map((opt) => (
                    <option key={opt.value || "none"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button className="mt-3 w-full">Filter</Button>
            </form>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm md:text-base">
                {total > 0 ? `Showing ${startIdx}-${endIdx} of ${total} results` : "No results"}
              </p>
              <div className="flex items-center">
                <label className="text-md mr-2 hidden sm:block">Sort by</label>
                <select
                  name="sort"
                  className="border rounded px-2 py-1 text-md bg-white"
                  defaultValue={sp.sort || "date"}
                  form="filters"
                >
                  <option value="date">Date</option>
                  <option value="revenue" disabled>Revenue</option>
                  <option value="ebitda" disabled>EBITDA</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(rows || []).map((r) => (
                <div key={r.id} className="bg-white rounded-lg shadow-lg overflow-hidden border">
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
                            <div className="bg-[#9ed3c3] hover:bg-[#7fb8a9] text-black p-[3px] flex rounded-full items-center justify-center min-w-[25px] min-h-[25px]">
                              <BadgeCheckIcon size={20} strokeWidth={2.5} className="text-white" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {`Boosted Listing Active`}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {r.has_purchased_valuation && (
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="text-black flex rounded-full items-center justify-center min-w-[25px] min-h-[25px]">
                              <Image
                                src={"/images/logos/svg/Rio-Plex-Logo-Icon-Mint.svg"}
                                alt="RPBX"
                                width={25}
                                height={25}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {`Valuated By RPBX`}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    <div className="flex justify-between mt-2">
                      <div>
                        <p className="font-semibold">Annual Revenue</p>
                        <p>{labelForKey(r.annual_revenue_range, ANNUAL_REVENUE_BUCKETS)}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Company EBITDA</p>
                        <p>{labelForKey(r.ebitda_range, EBITDA_BUCKETS)}</p>
                      </div>
                    </div>

                    <div className="flex items-center mt-3 text-sm text-gray-600">
                      <Image
                        src="/images/icons/location.png"
                        alt="Location"
                        className="w-4 h-4 mr-2"
                        width={16}
                        height={16}
                      />
                      <p>{r.county || "—"}</p>
                    </div>

                    <Link href={`/business-listing/${r.id}`}>
                      <Button className="mt-4 w-full">View Business</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

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