import NavGate from "@/app/components/NavGate";
import { isValuationFeatureEnabled } from "@/lib/valuation/valuationAvailability";
import Button from "@/app/components/Button";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { BadgeCheckIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { imageUrl } from "@/lib/industryImages";
import {
  ANNUAL_REVENUE_BUCKETS,
  EBITDA_BUCKETS,
  YEARS_IN_BUSINESS_BUCKETS,
  EMPLOYEE_COUNT_BUCKETS,
  labelForKey,
} from "@/lib/ranges";

import Modal from "@/app/components/Modal";
import ContactBusiness from "@/app/components/popups/ContactBusiness";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientRSC();

  const { data } = await supabase
    .from("business_listings")
    .select("title, industry, secondary_industry, status, is_active")
    .eq("id", id)
    .maybeSingle();

  const title = data?.industry
    ? `${data.industry} Business`
    : "Business Listing";

  const published = data?.status === "published" && data?.is_active === true;

  return {
    title: `${title} | RioPlex Business Exchange`,
    description: published
      ? `View details for ${title}`
      : "Business Listing | RioPlex Business Exchange",
  };
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/business-listing/${id}`);

  let investorName: string | undefined;
  let investorOrganization: string | undefined;
  let investorIndustry: string | undefined;
  let investorLocation: string | undefined;

  const { data: investor } = await supabase
    .from("investor_profiles")
    .select("first_name, last_name, organization_entity, primary_industry, city")
    .eq("user_id", user.id)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (investor) {
    investorName =
      [investor.first_name, investor.last_name].filter(Boolean).join(" ") ||
      undefined;
    investorOrganization = investor.organization_entity || undefined;
    investorIndustry = investor.primary_industry || undefined;
    investorLocation = investor.city || undefined;
  }

  const { data: listing } = await supabase
    .from("v_business_listings_with_promo")
    .select(`
      id,
      owner_id,
      status,
      is_active,
      title,
      industry,
      secondary_industry,
      county,
      city,
      description,
      annual_revenue_range,
      ebitda_range,
      years_in_business,
      employee_count_range,
      listing_image_choice,
      contact_email,
      can_provide_financials,
      can_provide_tax_returns,
      is_promoted_effective,
      has_purchased_valuation
    `)
    .eq("id", id)
    .maybeSingle();

  if (!listing) notFound();

  const isValuationEnabled = isValuationFeatureEnabled();

  const isPublished =
    listing.status === "published" && listing.is_active === true;
  const isOwner = listing.owner_id === user.id;

  if (!isPublished && !isOwner) {
    notFound();
  }

  const catalogKey = listing.listing_image_choice as string | null;
  const imgSrc = catalogKey ? imageUrl(catalogKey) : null;

  const listingTitle = listing.industry
    ? `${listing.industry} Business`
    : "Business Listing";

  const detailItems = [
    {
      label: "Annual Revenue",
      value: labelForKey(
        listing.annual_revenue_range,
        ANNUAL_REVENUE_BUCKETS,
      ),
    },
    {
      label: "Company EBITDA",
      value: labelForKey(listing.ebitda_range, EBITDA_BUCKETS),
    },
    {
      label: "Years in Business",
      value: labelForKey(
        listing.years_in_business,
        YEARS_IN_BUSINESS_BUCKETS,
      ),
    },
    {
      label: "Employees",
      value: labelForKey(
        listing.employee_count_range,
        EMPLOYEE_COUNT_BUCKETS,
      ),
    },
    {
      label: "Location",
      value: [listing.county, listing.city].filter(Boolean).join(", ") || "—",
    },
    {
      label: "Financial Statements Available on Request",
      value: listing.can_provide_financials ? "Yes" : "No",
    },
    {
      label: "Tax Returns Available on Request",
      value: listing.can_provide_tax_returns ? "Yes" : "No",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <NavGate />

      <div className="mx-auto w-full px-5 py-10 lg:max-w-[1140px] lg:px-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          <div className="border-b border-gray-100 p-6 lg:p-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">

                <h1 className="text-left text-2xl font-bold leading-tight text-gray-950 lg:text-3xl">
                  {listingTitle}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {listing.industry && (
                    <span className="inline-flex items-center rounded-full bg-[#9ed3c3]/25 px-3 py-1 text-xs font-medium text-gray-800">
                      {listing.industry}
                    </span>
                  )}

                  {listing.secondary_industry && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      {listing.secondary_industry}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {listing.is_promoted_effective && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex min-w-[130px] items-center justify-center gap-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-black hover:bg-[var(--color-primary-hover)]">
                        <BadgeCheckIcon
                          size={20}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                        <p className="text-white">Boosted</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Boosted Listing Active</TooltipContent>
                  </Tooltip>
                )}

                {listing.has_purchased_valuation && isValuationEnabled && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex min-w-[130px] items-center justify-center gap-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-black hover:bg-[var(--color-primary-hover)]">
                        <Image
                          src="/images/logos/svg/Rio-Plex-Logo-Icon-White.svg"
                          alt="RPBX"
                          width={20}
                          height={20}
                        />
                        <p className="text-white">Valuated</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Valuated By RPBX</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 lg:grid-cols-[2fr_1fr] lg:p-10">
            <div className="min-w-0">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={listing.industry ?? "Business"}
                  className="mb-6 h-auto w-full rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <Image
                  src="/images/businesses/home-services.jpg"
                  alt="Business"
                  className="mb-6 w-full rounded-2xl object-cover shadow-sm"
                  width={800}
                  height={480}
                />
              )}

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-gray-950">
                  About this business
                </h2>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 lg:text-base">
                  {listing.description || "—"}
                </p>
              </div>
            </div>

            <aside className="flex flex-col">
              <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-950">
                  Listing Details
                </h2>

                <div className="space-y-3">
                  {detailItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <Modal trigger={<Button className="w-full">Contact</Button>}>
                    <ContactBusiness
                      name={
                        listing.title
                          ? `${listing.title} Owner`
                          : "Business Owner"
                      }
                      email={listing.contact_email || ""}
                      businessName={listing.title || undefined}
                      investorName={investorName}
                      investorOrganization={investorOrganization}
                      investorIndustry={investorIndustry}
                      investorLocation={investorLocation}
                    />
                  </Modal>
                </div>

                {isOwner && (
                  <Link
                    href={`/dashboard/listings/${listing.id}/edit`}
                    className="mt-4 block text-center text-sm font-medium text-[#5c9f8d] underline-offset-4 hover:underline"
                  >
                    Edit this listing
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}