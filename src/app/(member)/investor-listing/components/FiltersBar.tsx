// app/investor-listing/components/FiltersBar.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";

// If your option arrays are in this file, keep them here.
// Ideally move to a shared module like "@/lib/constants" and import them here.
const INDUSTRIES = [
  { label: "All Categories", value: "" },
  { label: "Healthcare", value: "Healthcare" },
  { label: "Technology", value: "Technology" },
  { label: "Finance", value: "Finance" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Education", value: "Education" },
  { label: "Manufacturing", value: "Manufacturing" },
  { label: "Retail", value: "Retail" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Transportation", value: "Transportation" },
  { label: "Agriculture", value: "Agriculture" },
  { label: "Energy", value: "Energy" },
  { label: "Entertainment", value: "Entertainment" },
  { label: "Construction", value: "Construction" },
  { label: "Telecommunications", value: "Telecommunications" },
  { label: "Insurance", value: "Insurance" },
  { label: "Legal", value: "Legal" },
  { label: "Automotive", value: "Automotive" },
  { label: "Food and Beverage", value: "Food and Beverage" },
  { label: "Media and Advertising", value: "Media and Advertising" },
  { label: "Pharmaceutical", value: "Pharmaceutical" },
  { label: "Tourism", value: "Tourism" },
  { label: "Fashion", value: "Fashion" },
  { label: "Logistics", value: "Logistics" },
  { label: "Non-profit", value: "Non-profit" },
  { label: "Environmental Services", value: "Environmental Services" },
  { label: "Biotechnology", value: "Biotechnology" },
  { label: "Aerospace", value: "Aerospace" },
  { label: "E-commerce", value: "E-commerce" },
  { label: "Consulting", value: "Consulting" },
  { label: "Sports and Recreation", value: "Sports and Recreation" },
  { label: "Other", value: "Other" },
] as const;


const EBITDA = [
  { label: "EBITDA: Any", value: "" },
  { label: "< 250K", value: "<250k" },
  { label: "250K - 500K", value: "250k-500k" },
  { label: "500K - 1M", value: "500k-1M" },
  { label: "1M - 2M", value: "1M-2M" },
  { label: "2M - 5M", value: "2M-5M" },
  { label: "> 5M", value: ">5M" },
] as const;

const CASH = [
  { label: "Cash Flow: Any", value: "" },
  { label: "< 50K", value: "<50k" },
  { label: "50K - 100K", value: "50k-100k" },
  { label: "100K - 250K", value: "100k-250k" },
  { label: "250K - 500K", value: "250k-500k" },
  { label: "> 500K", value: ">500k" },
] as const;

export default function FiltersBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const industry = searchParams.get("industry") ?? "";
  const ebitda = searchParams.get("ebitda") ?? "";
  const cash = searchParams.get("cash") ?? "";
  const sort = (searchParams.get("sort") ?? "date").toLowerCase();

  const setParam = (key: string, val?: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (val && val.trim()) params.set(key, val);
    else params.delete(key);
    params.delete("page"); // reset pagination on filter change
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <form className="flex justify-end gap-4">
      <select
        className="w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        value={industry}
        onChange={(e) => setParam("industry", e.target.value)}
        aria-label="Filter by industry"
      >
        {INDUSTRIES.map((it) => (
          <option key={it.value || "all"} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>

      <select
        className="w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        value={ebitda}
        onChange={(e) => setParam("ebitda", e.target.value)}
        aria-label="Filter by EBITDA"
      >
        {EBITDA.map((it) => (
          <option key={it.value || "any"} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>

      <select
        className="w-56 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        value={cash}
        onChange={(e) => setParam("cash", e.target.value)}
        aria-label="Filter by cash flow"
      >
        {CASH.map((it) => (
          <option key={it.value || "any"} value={it.value}>
            {it.label}
          </option>
        ))}
      </select>

      <select
        className="w-44 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        value={sort}
        onChange={(e) => setParam("sort", e.target.value)}
        aria-label="Sort results"
      >
        <option value="date">Sort: Recent</option>
        <option value="name">Sort: Name</option>
      </select>
    </form>
  );
}
