import NavGate from "@/app/components/NavGate";
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
  TooltipTrigger
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

// Optional: dynamic metadata from the listing
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientRSC();
  const { data } = await supabase
    .from("business_listings")
    .select("title, industry, status, is_active")
    .eq("id", id)
    .maybeSingle();

  const title = data?.industry || "Business Listing";
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

  // Require login
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/business-listing/${id}`);

  // Fetch investor information if logged in
  let investorName: string | undefined;
  let investorOrganization: string | undefined;
  let investorIndustry: string | undefined;
  let investorLocation: string | undefined;

  if (user) {
    const { data: investor } = await supabase
      .from("investor_profiles")
      .select("first_name, last_name, organization_entity, primary_industry, city")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (investor) {
      investorName = [investor.first_name, investor.last_name].filter(Boolean).join(" ") || undefined;
      investorOrganization = investor.organization_entity || undefined;
      investorIndustry = investor.primary_industry || undefined;
      investorLocation = investor.city || undefined;
    }
  }

  // Fetch listing by id
  const { data: listing } = await supabase
    .from("v_business_listings_with_promo")
    .select(`
      id,
      owner_id,
      status,
      is_active,
      title,
      industry,
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

  // Gate visibility: any authed user can view published+active; drafts only visible to owner
  const isPublished = listing.status === "published" && listing.is_active === true;
  const isOwner = listing.owner_id === user.id;
  if (!isPublished && !isOwner) {
    notFound();
  }

  const catalogKey = listing.listing_image_choice as string | null;
  const imgSrc = catalogKey ? imageUrl(catalogKey) : null;

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border p-6 lg:p-10 ">
          <div className="flex flex-col lg:flex-row lg:items-center gap-5 pb-5">
            <h1 className="text-2xl lg:text-3xl font-bold text-left flex ">
              {listing.industry + " Business" || "Business Listing"}
            </h1>

            <div className="flex flex-row gap-2">
              {listing.is_promoted_effective && (
                <div className="flex">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="min-w-[130px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black px-3 py-1 gap-3 flex rounded-full items-center justify-center ">
                        <BadgeCheckIcon size={20} strokeWidth={2.5} className="text-white" />
                        <p className="text-white">Boosted</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {`Boosted Listing Active`}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}

              {listing.has_purchased_valuation && (
                <div className="flex">
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="min-w-[130px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black px-3 py-1 gap-3 flex rounded-full items-center justify-center ">
                        <Image
                          src={"/images/logos/svg/Rio-Plex-Logo-Icon-White.svg"}
                          alt="RPBX"
                          width={20}
                          height={20}
                        />
                        <p className="text-white">Valuated</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {`Valuated By RPBX`}
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex flex-col w-full lg:w-2/3">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={listing.industry ?? "Business"}
                  className="w-full h-auto object-cover rounded-lg mb-5"
                />
              ) : (
                <Image
                  src="/images/businesses/home-services.jpg"
                  alt="Business"
                  className="w-full object-cover rounded-lg mb-5"
                  width={300}
                  height={200}
                />
              )}

              <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap">
                <b>About Us: </b> {listing.description || "—"}
              </p>
            </div>

            <div className="flex flex-col w-full lg:w-1/3">
              {[
                {
                  label: "Annual Revenue",
                  value: labelForKey(listing.annual_revenue_range, ANNUAL_REVENUE_BUCKETS),
                },
                {
                  label: "Company EBITDA",
                  value: labelForKey(listing.ebitda_range, EBITDA_BUCKETS),
                },
                {
                  label: "Years in Business",
                  value: labelForKey(listing.years_in_business, YEARS_IN_BUSINESS_BUCKETS),
                },
                {
                  label: "Employees",
                  value: labelForKey(listing.employee_count_range, EMPLOYEE_COUNT_BUCKETS),
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
              ].map((item, i) => (
                <div key={i} className="mb-5 p-5 bg-[#f5f5f5] rounded-lg text-center">
                  <p className="font-semibold">{item.label}</p>
                  <p>{item.value}</p>
                </div>
              ))}

              <Modal
                trigger={<Button className="w-full">Contact</Button>}
              >
                <ContactBusiness
                  name={listing.title ? `${listing.title} Owner` : "Business Owner"}
                  email={listing.contact_email || ""}
                  businessName={listing.title || undefined}
                  investorName={investorName}
                  investorOrganization={investorOrganization}
                  investorIndustry={investorIndustry}
                  investorLocation={investorLocation}
                />
              </Modal>

              {isOwner && (
                <Link
                  href={`/dashboard/listings/${listing.id}/edit`}
                  className="mt-3 inline-block underline text-center"
                >
                  Edit this listing
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}