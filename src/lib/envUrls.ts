import "server-only";

export function getBizEquityUrl() {
  const bizEquity = process.env.BIZEQUITY_URL;

  if (!bizEquity) {
    throw new Error("BIZEQUITY_URL is not set");
  }

  return bizEquity;
}

export function getCalendlyUrl() {
  const calendlyUrl = process.env.CALENDLY_VALUATION_URL;

  if (!calendlyUrl) {
    throw new Error("CALENDLY_VALUATION_URL is not set");
  }

  return calendlyUrl;
}

export function getBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL is not set");
  }

  return baseUrl;
}
