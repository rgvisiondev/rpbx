// lib/ranges.ts

export type Bucket<K extends string = string> = {
  key: K;
  label: string;
};

// ---------- Helpers ----------
export function makeKeySet<const T extends readonly Bucket<string>[]>(
  buckets: T,
) {
  return new Set(buckets.map((b) => b.key)) as ReadonlySet<T[number]["key"]>;
}

export function isAllowedKey<K extends string>(
  set: ReadonlySet<K>,
  value: unknown,
): value is K {
  return typeof value === "string" && set.has(value as K);
}

export function labelForKey<K extends string>(
  key: string | null | undefined,
  buckets: readonly Bucket<K>[],
) {
  if (!key) return "—";
  return buckets.find((b) => b.key === key)?.label ?? "—";
}

// ---------- Buckets (single source of truth) ----------

// Annual Revenue (expanded ceiling: $500M+)
export const ANNUAL_REVENUE_BUCKETS = [
  { key: "0_100k", label: "Under $100K" },
  { key: "100k_250k", label: "$100K–$250K" },
  { key: "250k_500k", label: "$250K–$500K" },
  { key: "500k_750k", label: "$500K–$750K" },
  { key: "750k_1m", label: "$750K–$1M" },
  { key: "1m_2_5m", label: "$1M–$2.5M" },
  { key: "2_5m_5m", label: "$2.5M–$5M" },
  { key: "5m_10m", label: "$5M–$10M" },
  { key: "10m_25m", label: "$10M–$25M" },
  { key: "25m_50m", label: "$25M–$50M" },
  { key: "50m_100m", label: "$50M–$100M" },
  { key: "100m_250m", label: "$100M–$250M" },
  { key: "250m_500m", label: "$250M–$500M" },
  { key: "500m_plus", label: "$500M+" },
] as const;

export const EBITDA_BUCKETS = [
  { key: "0_50k", label: "Under $50K" },
  { key: "50k_100k", label: "$50K–$100K" },
  { key: "100k_250k", label: "$100K–$250K" },
  { key: "250k_500k", label: "$250K–$500K" },
  { key: "500k_1m", label: "$500K–$1M" },
  { key: "1m_2m", label: "$1M–$2M" },
  { key: "2m_5m", label: "$2M–$5M" },
  { key: "5m_10m", label: "$5M–$10M" },
  { key: "10m_25m", label: "$10M–$25M" },
  { key: "25m_50m", label: "$25M–$50M" },
  { key: "50m_100m", label: "$50M–$100M" },
  { key: "100m_plus", label: "$100M+" },
] as const;

export const CASH_FLOW_BUCKETS = [
  { key: "0_50k", label: "Under $50K" },
  { key: "50k_100k", label: "$50K–$100K" },
  { key: "100k_250k", label: "$100K–$250K" },
  { key: "250k_500k", label: "$250K–$500K" },
  { key: "500k_1m", label: "$500K–$1M" },
  { key: "1m_2m", label: "$1M–$2M" },
  { key: "2m_5m", label: "$2M–$5M" },
  { key: "5m_10m", label: "$5M–$10M" },
  { key: "10m_25m", label: "$10M–$25M" },
  { key: "25m_plus", label: "$25M+" },
] as const;

export const YEARS_IN_BUSINESS_BUCKETS = [
  { key: "lt_1", label: "< 1 year" },
  { key: "1_2", label: "1–2 years" },
  { key: "3_5", label: "3–5 years" },
  { key: "6_10", label: "6–10 years" },
  { key: "11_20", label: "11–20 years" },
  { key: "20_plus", label: "20+ years" },
] as const;

export const EMPLOYEE_COUNT_BUCKETS = [
  { key: "1_4", label: "1–4" },
  { key: "5_9", label: "5–9" },
  { key: "10_19", label: "10–19" },
  { key: "20_49", label: "20–49" },
  { key: "50_99", label: "50–99" },
  { key: "100_249", label: "100–249" },
  { key: "250_499", label: "250–499" },
  { key: "500_plus", label: "500+" },
] as const;

// ---------- Key sets ----------
export const ANNUAL_REVENUE_KEYS = makeKeySet(ANNUAL_REVENUE_BUCKETS);
export const EBITDA_BUCKET_KEYS = makeKeySet(EBITDA_BUCKETS);
export const CASH_FLOW_BUCKET_KEYS = makeKeySet(CASH_FLOW_BUCKETS);
export const YEARS_IN_BUSINESS_KEYS = makeKeySet(YEARS_IN_BUSINESS_BUCKETS);
export const EMPLOYEE_COUNT_KEYS = makeKeySet(EMPLOYEE_COUNT_BUCKETS);
