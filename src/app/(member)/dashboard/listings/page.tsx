// app/owner/listings/page.tsx
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { getListingBadges } from "@/lib/listings/badges";
import { imageUrl } from "@/lib/industryImages";
import NavGate from "@/app/components/NavGate";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const PRICE_LISTING_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_MONTHLY!;
const PRICE_LISTING_YEARLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS_YEARLY!;
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Your Listings | RioPlex Business Exchange",
  description: "Manage your business listings and subscriptions on RioPlex Business Exchange.",
};

// ---- SERVER ACTIONS ----
async function startListingPriceCheckout(priceId: string) {
  "use server";

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  const h = await headers();
  const ck = h.get("cookie") ?? "";

  const res = await fetch(`${ORIGIN}/api/checkout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: ck.toString(),
    },
    body: JSON.stringify({
      priceId,
      purpose: "listing_plan",
      successUrl: `${ORIGIN}/onboarding/business/claim?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${ORIGIN}/dashboard/listings`,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }
    console.error("listing_plan checkout failed", res.status, body);
    redirect("/dashboard/listings?err=listing_plan_checkout");
  }

  const { url } = await res.json();
  if (!url) {
    console.error("No session URL returned from /api/checkout (listing_plan)");
    redirect("/dashboard/listings?err=no_session_url");
  }

  redirect(url);
}

async function startEvaluation(listingId: string) {
  "use server";

  const h = await headers();
  const ck = h.get("cookie");

  const res = await fetch(`${ORIGIN}/api/checkout/evaluation`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(ck ? { cookie: ck } : {}),
    },
    body: JSON.stringify({ listingId }),
    cache: "no-store",
  });

  if (!res.ok) {
    let body = "";
    try {
      body = await res.text();
    } catch {
      // ignore
    }
    console.error("Failed to create evaluation checkout session", res.status, body);
    return redirect("/dashboard/listings?err=eval_checkout");
  }

  const { url } = await res.json();
  if (!url) return redirect("/dashboard/listings?err=no_eval_url");

  redirect(url);
}

async function startBoost(listingId: string) {
  "use server";

  const { createClientRSC } = await import("@/../utils/supabase/server");
  const stripe = getStripe();
  const admin = getSupabaseAdmin();
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  // Verify if profile is a business owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.user_type !== "business") {
    return redirect("/dashboard");
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
  const customerId = await ensureCustomer(stripe, admin, user);

  // (Optional) ensure the price is recurring
  const price = await stripe.prices.retrieve(promoPriceId);
  if (price.type !== "recurring") redirect("/dashboard/listings?err=not_recurring");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: promoPriceId, quantity: 1 }],
    success_url: `${ORIGIN}/dashboard/listings?promoted=${listingId}`,
    cancel_url: `${ORIGIN}/dashboard/listings`,
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
  const url = await openBillingPortal(`${ORIGIN}/dashboard/listings`);
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
    .select("id, title, industry, listing_image_choice, status, is_active, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const listingIds = (rows ?? []).map((r) => r.id);

  // 2) Centralize badges (boost + evaluation) via shared helper
  const { boosted, evalStatus } = await getListingBadges(supabase, listingIds);

  // 3) Signed URLs for thumbnails
  const signedUrls = new Map<string, string>();
  for (const r of rows ?? []) {
    if (r.listing_image_choice) {
      const { data: s } = await supabase.storage
        .from("listings")
        .createSignedUrl(r.listing_image_choice, 60);
      if (s?.signedUrl) signedUrls.set(r.id, s.signedUrl);
    }
  }

  return (
    <div>
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

        <div className="w-full lg:w-[1140px] mx-auto py-10 px-5 lg:px-0">
          <h1 className="mb-4">Your Listings</h1>
          <p className="text-sm text-gray-600 mb-6">
            Use the customer portal to update payment methods, view invoices, or cancel plans.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Existing listings */}
            {rows &&
              rows.length > 0 &&
              rows.map((l) => {
                const updated = l.updated_at
                  ? new Date(l.updated_at).toLocaleString()
                  : "—";
                const isBoosted = boosted.has(l.id);
                const evalState = evalStatus.get(l.id); // 'purchased' | 'in_progress' | 'completed' | undefined;
                const catalogKey = l.listing_image_choice as string | null;
                const imgSrc = catalogKey ? imageUrl(catalogKey) : null;

                return (
                  <div
                    key={l.id}
                    className="
                      bg-white 
                      rounded-2xl 
                      shadow-sm 
                      border 
                      p-0 
                      flex 
                      flex-col 
                      transition-all 
                      hover:shadow-xl 
                      hover:-translate-y-1
                    "
                  >
                    {/* Thumbnail */}
                    <div className="relative h-50 w-full mb-4 overflow-hidden rounded-t-xl">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src="/images/businesses/home-services.jpg"
                          alt="Listing"
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div className="p-5">
                      {/* Title + meta */}
                      <h3 className="text-lg font-semibold mb-1 -mt-5">
                        {l.title ?? "Untitled Listing"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {l.industry ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Last Updated: {updated}
                      </p>

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
                      <div className="flex gap-4 text-sm">
                        <Link
                          href={`/business-listing/${l.id}`}
                          className="green-link"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/dashboard/listings/${l.id}/edit`}
                          className="green-link"
                        >
                          Edit
                        </Link>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-5 grid grid-cols-3 gap-1 text-sm text-center">
                        {!isBoosted ? (
                          <form action={startBoost.bind(null, l.id)}>
                            <button
                              type="submit"
                              className="w-full text-white font-medium items-center py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer"
                            >
                              Promote
                            </button>
                          </form>
                        ) : (
                          <form action={openPortal}>
                            <button
                              type="submit"
                              className="w-full text-white font-medium items-center py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer"
                            >
                              Manage Boost
                            </button>
                          </form>
                        )}

                        <form action={openPortal}>
                          <button
                            type="submit"
                            className="w-full text-white font-medium items-center py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer"
                          >
                            Manage Plan
                          </button>
                        </form>
                        {!evalState && (
                          <form action={startEvaluation.bind(null, l.id)}>
                            <button
                              type="submit"
                              className="w-full text-white font-medium items-center py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer"
                            >
                              Get Valuation
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* Add Listing Card */}
            <div className="bg-white rounded-xl border border-dashed flex items-center justify-center p-4 min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  className="opacity-60"
                >
                  <path
                    d="M12 5v14m-7-7h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-sm font-medium">Add Listing</div>
                <div className="flex gap-2">
                  <form
                    action={startListingPriceCheckout.bind(
                      null,
                      PRICE_LISTING_MONTHLY
                    )}
                  >
                    <button
                      type="submit"
                      className="w-25 mt-4 px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer text-white transition"
                    >
                      Monthly
                    </button>
                  </form>
                  <form
                    action={startListingPriceCheckout.bind(
                      null,
                      PRICE_LISTING_YEARLY
                    )}
                  >
                    <button
                      type="submit"
                      className="w-25 mt-4 px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer text-white transition"
                    >
                      Yearly
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
}
