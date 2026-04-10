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

export const metadata: Metadata = {
  title: "Your Listings | RioPlex Business Exchange",
  description:
    "Manage your business listings and subscriptions on RioPlex Business Exchange.",
};

export default async function OwnerListings() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/listings");

  const { data: rows } = await supabase
    .from("business_listings")
    .select(
      "id, title, industry, listing_image_choice, status, is_active, updated_at, is_hidden"
    )
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  const listingIds = (rows ?? []).map((r) => r.id);

  const { boosted, evalStatus } = await getListingBadges(supabase, listingIds);

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

                return (
                  <div
                    key={l.id}
                    className={`
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
                      ${l.is_hidden ? "opacity-90" : ""}
                    `}
                  >
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

                      {l.is_hidden && (
                        <div className="absolute inset-0 bg-neutral-200/50" />
                      )}

                      {l.is_hidden && (
                        <span className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full bg-neutral-900/80 text-white">
                          HIDDEN
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-semibold mb-1 -mt-5">
                        {l.title ?? "Untitled Listing"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {l.industry ?? "—"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Last Updated: {updated}
                      </p>

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
                    </div>
                  </div>
                );
              })}

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
                  <form action={startMonthlyListingCheckout}>
                    <button
                      type="submit"
                      className="w-25 mt-4 px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer text-white transition"
                    >
                      Monthly
                    </button>
                  </form>

                  <form action={startYearlyListingCheckout}>
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

          <section className="max-w-[1140px] mx-auto px-5 lg:px-0 py-14">
            <div className="relative bg-[url('/images/backgrounds/footer-bg.png')] bg-fixed bg-center bg-cover rounded-[40px] p-8 lg:p-12 text-white overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4da685]/20 rounded-full blur-3xl pointer-events-none"></div>

              <div className="max-w-2xl">
                <h2 className=" text-white text-2xl lg:text-3xl font-semibold">
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