// lib/siteUrl.ts
export function siteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";

  if (!url) throw new Error("Missing NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_BASE_URL)");
  return url.replace(/\/+$/, ""); // trim trailing slash
}