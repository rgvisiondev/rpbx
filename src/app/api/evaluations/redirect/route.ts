// app/api/evaluations/redirect/route.ts
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const listingId = url.searchParams.get("listing_id") ?? "";

  if (!listingId) {
    return new Response("Missing listing_id", { status: 400 });
  }


  const target = `/owner/listings/${listingId}/success`;
  return new Response(null, { status: 302, headers: { Location: target } });
}
