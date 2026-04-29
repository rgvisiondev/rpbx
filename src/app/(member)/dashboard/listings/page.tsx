export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { getListingBadges } from "@/lib/listings/badges";
import { imageUrl } from "@/lib/industryImages";
import { VALUATION_MODE } from "@/lib/valuation-config";
import NavGate from "@/app/components/NavGate";
import { VisibilityToggle } from "../_components/VisibilityToggle";
import Modal from "@/app/components/Modal";
import HoverGif from "@/components/HoverGif";
import Eval from "@/app/components/popups/Eval";
import Legal from "@/app/components/popups/Legal";
import Cpa from "@/app/components/popups/Cpa";
import Marketing from "@/app/components/popups/marketing";
import {
  openPortal,
  setListingHidden,
  startBoost,
  startEvaluation,
  startMonthlyListingCheckout,
  startYearlyListingCheckout,
} from "./actions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Your Listings | RioPlex Business Exchange",
  description:
    "Manage your business listings and subscriptions on RioPlex Business Exchange.",
};

type SubscriptionLite = {
  id: string;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

function canContinueOnboarding(subscription: SubscriptionLite | null) {
  if (!subscription) return false;

  const status = subscription.status ?? "";
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;
  const now = Date.now();

  if (status === "active" || status === "trialing") {
    if (subscription.cancel_at_period_end && periodEnd !== null) {
      return periodEnd > now;
    }
    return true;
  }

  return false;
}

export default async function OwnerListings() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const { data: rows } = await supabase
    .from("business_listings")
    .select(
      "id, title, industry, secondary_industry, listing_image_choice, status, is_active, updated_at, is_hidden, stripe_subscription_id",
    )
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const listingIds = (rows ?? []).map((r) => r.id);
  const subscriptionIds = (rows ?? [])
    .map((r) => r.stripe_subscription_id)
    .filter((id): id is string => !!id);

  const { boosted, evalStatus } = await getListingBadges(supabase, listingIds);

  const subscriptionMap = new Map<string, SubscriptionLite>();
  if (subscriptionIds.length > 0) {
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("id, status, current_period_end, cancel_at_period_end")
      .in("id", subscriptionIds);

    for (const sub of subscriptions ?? []) {
      subscriptionMap.set(sub.id, sub);
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
            Use the customer portal to update payment methods, view invoices, or
            cancel plans.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rows &&
              rows.length > 0 &&
              rows.map((l) => {
                const updated = l.updated_at
                  ? new Date(l.updated_at).toLocaleString()
                  : "—";

                const isBoosted = boosted.has(l.id);
                const evalState = evalStatus.get(l.id);
                const catalogKey = l.listing_image_choice as string | null;
                const imgSrc = catalogKey ? imageUrl(catalogKey) : null;

                const subscription = l.stripe_subscription_id
                  ? subscriptionMap.get(l.stripe_subscription_id) ?? null
                  : null;

                const isDraft = l.status === "draft";
                const showContinueOnboarding =
                  isDraft && canContinueOnboarding(subscription);
                const showBillingRequired =
                  isDraft && !canContinueOnboarding(subscription);

                return (
                  <div
                    key={l.id}
                    className={`
                      bg-white
                      rounded-2xl
                      shadow-sm
                      border
                      overflow-hidden
                      flex
                      flex-col
                      transition-all
                      hover:shadow-xl
                      hover:-translate-y-1
                      ${l.is_hidden ? "opacity-90" : ""}
                    `}
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={l.industry ?? "Business listing"}
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

                      {l.is_hidden && (
                        <div className="absolute inset-0 bg-neutral-200/50" />
                      )}

                      {l.is_hidden && (
                        <span className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full bg-neutral-900/80 text-white">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 leading-snug">
                          {l.title ?? "Untitled Listing"}
                        </h3>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {l.industry && (
                            <span className="inline-flex items-center rounded-full bg-[#9ed3c3]/25 px-3 py-1 text-xs font-medium text-gray-800">
                              {l.industry}
                            </span>
                          )}

                          {l.secondary_industry && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                              Secondary: {l.secondary_industry}
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-xs text-neutral-400">
                          Last Updated: {updated}
                        </p>
                      </div>

                      {!isDraft && (
                        <>
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <div className="flex flex-wrap gap-2">
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

                            <div className="mt-4 flex gap-4 text-sm">
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
                          </div>

                          <div className="mt-4">
                            <VisibilityToggle
                              id={l.id}
                              initialHidden={!!l.is_hidden}
                              setHiddenAction={setListingHidden}
                              labelVisible="Visible to investors"
                              labelHidden="Hidden from investors"
                              helper="Turn off to hide this listing"
                              toastHidden="Listing hidden"
                              toastVisible="Listing is now visible"
                            />
                          </div>

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
                                  {VALUATION_MODE === "free"
                                    ? "Get Free Valuation"
                                    : "Get Valuation"}
                                </button>
                              </form>
                            )}
                          </div>
                        </>
                      )}

                      {showContinueOnboarding && (
                        <div className="mt-4 rounded-2xl border border-[#9ed3c3] bg-[#f6fbf9] p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-[#d7eee7] shadow-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5 text-[#5c9f8d]"
                              >
                                <path
                                  d="M12 6v6l4 2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="inline-flex items-center rounded-full bg-[#9ed3c3]/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#3f7f70]">
                                Onboarding Incomplete
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <p className="text-sm font-semibold text-neutral-900">
                                  Finish setup
                                </p>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-white text-[11px] text-neutral-500"
                                    >
                                      ⓘ
                                    </button>
                                  </TooltipTrigger>

                                  <TooltipContent>
                                    This listing is still a draft. Complete
                                    onboarding to publish it and make it visible
                                    to investors.
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Link
                              href={`/onboarding/business/${l.id}/set-up`}
                              className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
                            >
                              Continue Onboarding
                            </Link>
                          </div>
                        </div>
                      )}

                      {showBillingRequired && (
                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5 text-neutral-500"
                              >
                                <path
                                  d="M12 8V12M12 16H12.01"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <circle cx="12" cy="12" r="9" />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="inline-flex items-center rounded-full bg-neutral-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-700">
                                Draft Listing
                              </div>

                              <p className="mt-3 text-sm font-semibold text-neutral-900">
                                Active plan required to continue
                              </p>

                              <p className="mt-1 text-sm leading-5 text-neutral-600">
                                This draft needs an active business membership
                                before it can be published.
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-col gap-2">
                            <form action={openPortal}>
                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
                              >
                                Manage Billing
                              </button>
                            </form>

                            <p className="text-center text-xs text-neutral-500">
                              Once your listing access is active, you can finish
                              onboarding and publish.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            <div className="bg-white rounded-2xl border-2 border-dashed border-[#9ed3c3]/60 p-6 min-h-[360px] flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#9ed3c3]/20 text-gray-800">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    className="opacity-80"
                  >
                    <path
                      d="M12 5v14m-7-7h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  Add another business listing
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  Create a separate listing for another business opportunity.
                  Choose monthly flexibility or yearly savings to start setup.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <form action={startMonthlyListingCheckout}>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)] hover:cursor-pointer"
                  >
                    Add Monthly Listing
                  </button>
                </form>

                <form action={startYearlyListingCheckout}>
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-[#9ed3c3] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:bg-[#9ed3c3]/15 hover:cursor-pointer"
                  >
                    Add Yearly Listing
                  </button>
                </form>

                <p className="text-center text-xs text-gray-500">
                  You’ll be guided through setup after checkout.
                </p>
              </div>
            </div>
          </div>

          <section className="max-w-[1140px] mx-auto px-5 lg:px-0 py-14">
            <div className="relative bg-[url('/images/backgrounds/footer-bg.png')] bg-fixed bg-center bg-cover rounded-[40px] p-8 lg:p-12 text-white overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4da685]/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="max-w-2xl">
                <h2 className="text-white text-2xl lg:text-3xl font-semibold">
                  Need support beyond your listing?
                </h2>

                <p className="text-white mt-2 text-sm lg:text-base">
                  Work with trusted advisors to strengthen your valuation, legal
                  positioning, financial structure, and media exposure.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center">
                  <Modal
                    trigger={
                      <HoverGif
                        staticSrc="/images/icons/evaluation.png"
                        gifSrc="/images/gifs/evaluation.gif"
                        alt="Business Valuation"
                        width={170}
                        height={170}
                      />
                    }
                  >
                    <Eval />
                  </Modal>

                  <h4 className="mt-4 text-white font-medium text-center">
                    Business Valuation
                  </h4>
                </div>

                <div className="flex flex-col items-center">
                  <Modal
                    trigger={
                      <HoverGif
                        staticSrc="/images/icons/legal.png"
                        gifSrc="/images/gifs/legal.gif"
                        alt="Legal Representation"
                        width={170}
                        height={170}
                      />
                    }
                  >
                    <Legal />
                  </Modal>

                  <h4 className="mt-4 text-white font-medium text-center">
                    Legal Representation
                  </h4>
                </div>

                <div className="flex flex-col items-center">
                  <Modal
                    trigger={
                      <HoverGif
                        staticSrc="/images/icons/cpa.png"
                        gifSrc="/images/gifs/cpa.gif"
                        alt="CPA & Bookkeeping"
                        width={170}
                        height={170}
                      />
                    }
                  >
                    <Cpa />
                  </Modal>

                  <h4 className="mt-4 text-white font-medium text-center">
                    CPA &amp; Bookkeeping
                  </h4>
                </div>

                <div className="flex flex-col items-center">
                  <Modal
                    trigger={
                      <HoverGif
                        staticSrc="/images/icons/marketing.png"
                        gifSrc="/images/gifs/marketing.gif"
                        alt="Media Amplification"
                        width={170}
                        height={170}
                      />
                    }
                  >
                    <Marketing />
                  </Modal>

                  <h4 className="mt-4 text-white font-medium text-center">
                    Media Amplification
                  </h4>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}