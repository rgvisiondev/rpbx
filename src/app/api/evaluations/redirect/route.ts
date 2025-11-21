// app/api/evaluations/redirect/route.ts
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const listingId = url.searchParams.get("listing_id") ?? "";
  // (Optional) look up anything you need before redirecting.
  // Example: const bizeqUrl = await getBizEquityLink(listingId);
  // For now, hard-code or build your BizEquity URL:
  const bizeqUrl = process.env.BIZEQUITY_URL!; // e.g., https://... with partner token
  const target = `${bizeqUrl}?listing_id=${encodeURIComponent(listingId)}`;
  return new Response(null, { status: 302, headers: { Location: target } });
}
