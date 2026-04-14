"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { INDUSTRY_OPTIONS } from "@/lib/industryImages";

const INDUSTRIES = [
  { label: "All Categories", value: "" },
  ...INDUSTRY_OPTIONS.map((label) => ({
    label,
    value: label,
  })),
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
  const [isOpen, setIsOpen] = useState(false);

  const industry = searchParams.get("industry") ?? "";
  const ebitda = searchParams.get("ebitda") ?? "";
  const cash = searchParams.get("cash") ?? "";
  const sort = (searchParams.get("sort") ?? "date").toLowerCase();

  const setParam = (key: string, val?: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (val && val.trim()) params.set(key, val);
    else params.delete(key);
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full flex flex-col md:flex-row justify-end items-stretch md:items-start gap-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-left flex justify-between items-center text-gray-700"
      >
        <span>Filters</span>
        <span className="text-gray-500 text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      <form
        className={`
          ${isOpen ? 'flex' : 'hidden'} 
          md:flex 
          flex-col md:flex-row 
          flex-wrap gap-4 
          items-stretch md:items-center 
          justify-end
        `}
      >
        <select
          className="w-full md:w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
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
          className="w-full md:w-48 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
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
          className="w-full md:w-56 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
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
          className="w-full md:w-44 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          aria-label="Sort results"
        >
          <option value="date">Sort: Recent</option>
          <option value="name">Sort: Name</option>
        </select>
      </form>
    </div>
  );
}