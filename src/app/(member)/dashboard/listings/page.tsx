// app/owner/listings/page.tsx
export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { headers, cookies } from "next/headers" 
import { getListingBadges } from "@/lib/listings/badges";
import { Badge } from "lucide-react";

const PRICE_LISTING_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY!;
const PRICE_LISTING_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY!;

// ---- SERVER ACTIONS (unchanged behaviors, just colocated) ----
async function startListingPriceCheckout(priceId: string){
  "use server";

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  //calling unified checkout with purpose=listing_plan
  const h = await headers();
  const proto = (await h).get("x-forwarded-proto") ?? "http";
  const host = (await h).get("x-forwarded-host") ?? (await h).get("host");
  if (!host) redirect("/dashboard/listings?err=no_host");
  const base = `${proto}://${host}`;
  const ck = await cookies();

  const res = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: ck.toString() },
    body: JSON.stringify({
      priceId,
      purpose: "listing_plan",
      successUrl: `${base}/onboarding/business/claim?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/dashbaord/listings`
    }),
    cache: "no-store",
  });

  if (!res.ok) redirect("/dashboard/listings?err=listing_plan_checkout");
  const { url } = await res.json();
  if (!url) redirect("/dashboard/listings?errno_session_url");
  redirect(url);

}

async function startEvaluation(listingId: string){
  "use server";

  const h = await headers();
  const proto = (await h).get("x-fowarded-proto") ?? "http";
  const host = (await h).get("x-forwarded-host") ?? (await h).get("host");

  if(!host) {
    console.error("Missing host header")
    return redirect("/dashboard/listings?err=no_host")
  }

  const base = `${proto}://${host}`;
  const ck = await cookies();

  const res = await fetch(`${base}/api/checkout/evaluation`, {
    method: "POST",
    headers: { "content-type": "application/json",
      cookie: ck.toString(),
     },
    body: JSON.stringify({ listingId }),

    cache: "no-store",
  });

  if (!res.ok){
    console.error("Failed to create evaluation checkout session")
    return redirect("/dashboard/listings?err=eval_checkout")
  }

  const { url } = await res.json();
  if (!url) return redirect("/dashboard/listings?err=no_eval_url");

  redirect(url);
}

async function startBoost(listingId: string) {
  "use server";

  const { createClientRSC } = await import("@/../utils/supabase/server");
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  // Verify if profile is a business owner"

  const { data: profile } = await supabase.from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.user_type !== "business"){
    return redirect ("/dashboard")
  }

  // Verify listing ownership
  const { data: listing, error: listErr } = await supabase
    .from("business_listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (listErr) redirect("/dashboard/listings?err=promo_db");
  if (!listing || listing.owner_id !== user.id) redirect("/dashboard/listings?err=forbidden");

  // Whitelist promo price
  const promoPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PROMO;
  if (!promoPriceId) redirect("/dashboard/listings?err=missing_price");

  const { ensureCustomer } = await import("@/lib/ensure-customer");
  const customerId = await ensureCustomer(user);

  const { stripe } = await import("@/lib/stripe");

  // (Optional) ensure the price is recurring
  const price = await stripe.prices.retrieve(promoPriceId);
  if (price.type !== "recurring") redirect("/dashboard/listings?err=not_recurring");

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: promoPriceId, quantity: 1 }],
    success_url: `${origin}/dashboard/listings?promoted=${listingId}`,
    cancel_url: `${origin}/dashboard/listings`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        purpose: "listing_promo",
        listing_id: listingId,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      purpose: "listing_promo",
      listing_id: listingId,
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    console.error("Stripe returned no session.url", { sessionId: session.id });
    redirect("/dashboard/listings?err=no_session_url");
  }

  redirect(session.url);
}

async function openPortal() {
  "use server";
  const { openBillingPortal } = await import("@/app/server/billing");
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const url = await openBillingPortal(`${origin}/dashboard/listings`);
  redirect(url);
}

// ---- PAGE ----
export default async function OwnerListings() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  // 1) Fetch listings
  const { data: rows } = await supabase
    .from("business_listings")
    .select("id, title, industry, listing_image_path, status, is_active, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const listingIds = (rows ?? []).map(r => r.id);

  // 2) Centralize badges (boost + evaluation) via shared helper
  const { boosted, evalStatus } = await getListingBadges(supabase, listingIds);

  // 3) Signed URLs for thumbnails
  const signedUrls = new Map<string, string>();
  for (const r of rows ?? []) {
    if (r.listing_image_path) {
      const { data: s } = await supabase
        .storage
        .from("listings")
        .createSignedUrl(r.listing_image_path, 60);
      if (s?.signedUrl) signedUrls.set(r.id, s.signedUrl);
    }
  }

  return (
    <div className="w-full lg:w-[1140px] mx-auto py-10 px-5 lg:px-0">
      <h1 className="mb-5">Your Listings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Existing listings */}
        {rows && rows.length > 0 && rows.map((l) => {
          const updated = l.updated_at ? new Date(l.updated_at).toLocaleString() : "—";
          const isBoosted = boosted.has(l.id);
          const evalState = evalStatus.get(l.id); // 'purchased' | 'in_progress' | 'completed' | undefined

          return (
            <div key={l.id} className="bg-white rounded-xl shadow p-4 border">
              {/* Thumbnail */}
              <div className="relative h-40 w-full mb-3">
                {signedUrls.get(l.id) ? (
                  <img
                    src={signedUrls.get(l.id)!}
                    className="rounded-lg object-cover w-full h-full"
                    alt={l.title ?? "Listing"}
                  />
                ) : (
                  <Image
                    src="/images/businesses/home-services.jpg"
                    alt="Listing"
                    fill
                    className="rounded-lg object-cover"
                  />
                )}
              </div>

              {/* Title + meta */}
              <h3 className="text-lg font-semibold">{l.title ?? "Untitled Listing"}</h3>
              <p className="text-sm text-gray-600">{l.industry ?? "—"}</p>
              <p className="text-xs text-neutral-500 mt-1">Updated: {updated}</p>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {isBoosted && (
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
                    Boosted
                  </span>
                )}
                {evalState === "purchased" && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                    Evaluation: Purchased
                  </span>
                )}
                {evalState === "in_progress" && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    Evaluation: In Progress
                  </span>
                )}
                {evalState === "completed" && (
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                    Evaluation: Completed
                  </span>
                )}
              </div>

              {/* Links row */}
              <div className="flex gap-3 mt-4">
                <Link href={`/business-listing/${l.id}`} className="underline">
                  Preview
                </Link>
                <Link href={`/onboarding/business/review`} className="underline">
                  Edit
                </Link>
              </div>

              {/* Actions row */}
              <div className="mt-4 flex flex-wrap gap-2">
                {!isBoosted ? (
                  <form action={startBoost.bind(null, l.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-2 rounded-xl border"
                    >
                      Promote
                    </button>
                  </form>
                ) : (
                  <form action={openPortal}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-2 rounded-xl border"
                    >
                      Manage Boost
                    </button>
                  </form>
                )}

                {/* Base plan management through portal */}
                <form action={openPortal}>
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 rounded-xl border"
                    title="Manage your plan in the Billing Portal"
                  >
                    Manage Plan
                  </button>
                </form>

                {/* Evaluation CTA */}
                {evalState === "completed" ? (
                  <span
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-green-50 text-green-700"
                    title="This listing has been valuated"
                  >
                    {/* Replace with custom icon */}
                    <Badge></Badge>
                  </span>
                ) : (
                  <form action={startEvaluation.bind(null, l.id)}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-2 rounded-xl border"
                      title="Purchase a Professional Valuation"
                    >
                      Get Valuation
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Listing Card */}
        <div className="bg-white rounded-xl border border-dashed flex items-center justify-center p-4 min-h-[300px] cursor-pointer hover:bg-neutral-50">
          <div className="flex flex-col items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 24 24" className="opacity-60">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
            </svg>
            <div className="text-sm font-medium">Add Listing</div>
            <div className="flex gap-2">
              <form action={startListingPriceCheckout.bind(null, PRICE_LISTING_MONTHLY)}>
                <button type="submit" className="px-3 py-1.5 rounded-lg border">Monthly</button>
              </form>
              <form action={startListingPriceCheckout.bind(null, PRICE_LISTING_YEARLY)}>
                <button type="submit" className="px-3 py-1.5 rounded-lg border">Yearly</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}