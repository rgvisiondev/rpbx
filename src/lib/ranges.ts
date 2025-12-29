// lib/ranges.ts

export type Bucket<K extends string = string> = {
  key: K;
  label: string;
};

// ---------- Helpers ----------
export function makeKeySet<const T extends readonly Bucket<string>[]>(buckets: T) {
  return new Set(buckets.map((b) => b.key)) as ReadonlySet<T[number]["key"]>;
}

export function isAllowedKey<K extends string>(
  set: ReadonlySet<K>,
  value: unknown
): value is K {
  return typeof value === "string" && set.has(value as K);
}

export function labelForKey<K extends string>(
  key: string | null | undefined,
  buckets: readonly Bucket<K>[]
) {
  if (!key) return "—";
  return buckets.find((b) => b.key === key)?.label ?? "—";
}

// ---------- Buckets (single source of truth) ----------

// Annual Revenue (business listing)
export const ANNUAL_REVENUE_BUCKETS = [
  { key: "0_50k", label: "$0–$50K" },
  { key: "50k_100k", label: "$50K–$100K" },
  { key: "100k_250k", label: "$100K–$250K" },
  { key: "250k_1m", label: "$250K–$1M" },
  { key: "1m_plus", label: "$1M+" },
] as const;

export const EBITDA_BUCKETS = [
  { key: "lt_50k", label: "Under $50K" },
  { key: "50k_150k", label: "$50K–$150K" },
  { key: "150k_500k", label: "$150K–$500K" },
  { key: "500k_1m", label: "$500K–$1M" },
  { key: "gt_1m", label: "$1M+" },
] as const;

export const CASH_FLOW_BUCKETS = [
  { key: "lt_50k", label: "Under $50K" },
  { key: "50k_100k", label: "$50K–$100K" },
  { key: "100k_250k", label: "$100K–$250K" },
  { key: "250k_500k", label: "$250K–$500K" },
  { key: "gt_500k", label: "$500K+" },
] as const;

export const YEARS_IN_BUSINESS_BUCKETS = [
  { key: "lt_1", label: "< 1 year" },
  { key: "1_3", label: "1–3 years" },
  { key: "3_5", label: "3–5 years" },
  { key: "5_10", label: "5–10 years" },
  { key: "gt_10", label: "10+ years" },
] as const;

export const EMPLOYEE_COUNT_BUCKETS = [
  { key: "1_4", label: "1–4" },
  { key: "5_10", label: "5–10" },
  { key: "11_25", label: "11–25" },
  { key: "26_50", label: "26–50" },
  { key: "51_100", label: "51–100" },
  { key: "gt_100", label: "100+" },
] as const;

// ---------- Key sets ----------
export const ANNUAL_REVENUE_KEYS = makeKeySet(ANNUAL_REVENUE_BUCKETS);
export const EBITDA_BUCKET_KEYS = makeKeySet(EBITDA_BUCKETS);
export const CASH_FLOW_BUCKET_KEYS = makeKeySet(CASH_FLOW_BUCKETS);
export const YEARS_IN_BUSINESS_KEYS = makeKeySet(YEARS_IN_BUSINESS_BUCKETS);
export const EMPLOYEE_COUNT_KEYS = makeKeySet(EMPLOYEE_COUNT_BUCKETS);
