// lib/valuation-config.ts

export type ValuationMode = "free" | "paid";

export const VALUATION_MODE: ValuationMode =
  process.env.NEXT_PUBLIC_VALUATION_MODE === "paid" ? "paid" : "free";

export const BIZEQUITY_VALUATION_LINK =
  process.env.BIZEQUITY_URL || "";

export const VALUATION_CALENDLY_LINK =
  process.env.CALENDLY_VALUATION_URL || "";