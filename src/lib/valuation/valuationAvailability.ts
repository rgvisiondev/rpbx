import "server-only";

export type ValuationFeatureStatus = "active" | "disabled";

export function getValuationFeatureStatus(): ValuationFeatureStatus {
  const status = process.env.VALUATION_FEATURE_STATUS;

  if (status === "active" || status === "disabled") {
    return status;
  }

  return "active";
}

export function isValuationFeatureEnabled(): boolean {
  return getValuationFeatureStatus() === "active";
}

export function isValuationFeatureDisabled(): boolean {
  return getValuationFeatureStatus() === "disabled";
}
