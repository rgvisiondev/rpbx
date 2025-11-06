import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { BadgeCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

const LABELS = {
  annual: {
    "0_50k": "0–50K",
    "50k_100k": "50K–100K",
    "100k_250k": "100K–250K",
    "250k_1m": "250K–1M",
    "1m_plus": "1M+",
  },
  ebitda: {
    "lt_50k": "Under 50K",
    "50k_150k": "50K–150K",
    "150k_500k": "150K–500K",
    "500k_1m": "500K–1M",
    "gt_1m": "1M+",
  },
  years: {
    "lt_1": "< 1 year",
    "1_3": "1–3 years",
    "3_5": "3–5 years",
    "5_10": "5–10 years",
    "gt_10": "10+ years",
  },
  emp: {
    "1_4": "1–4",
    "5_10": "5–10",
    "11_25": "11–25",
    "26_50": "26–50",
    "51_100": "51–100",
    "gt_100": "100+",
  },
} as const;

const fmt = (v: string | null | undefined, m: Record<string, string>) =>
  (v && m[v]) || "—";

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
      location_city,
      description,
      annual_revenue_range,
      ebitda_range,
      years_in_business,
      employee_count_range,
      listing_image_path,
      contact_email,
      can_provide_financials,
      can_provide_tax_returns,
      is_promoted_effective
    `)
    .eq("id", id)
    .maybeSingle();

  if (!listing) notFound();

  // Gate visibility: any authed user can view published+active; drafts only visible to owner
  const isPublished = listing.status === "published" && listing.is_active === true;
  const isOwner = listing.owner_id === user.id;
  if (!isPublished && !isOwner) {
    // Hide unpublished listings from non-owners
    notFound();
  }

  // Signed URL for private bucket image
  let coverUrl: string | null = null;
  if (listing.listing_image_path) {
    const { data: signed } = await supabase.storage
      .from("listings")
      .createSignedUrl(listing.listing_image_path, 60);
    coverUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-0">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border p-6 lg:p-10">
          <h1 className="text-2xl lg:text-3xl font-bold text-left pb-5">
            { listing.industry + " Business" || "Business Listing"}
          </h1>
          {listing.is_promoted_effective && (
            <Badge variant="secondary" className="bg-[#9ed3c3] hover:bg-[#7fb8a9] text-black flex items-center gap-1">
              <BadgeCheckIcon />
            </Badge>
          )}

          <div className="flex flex-col lg:flex-row gap-5">
            {/* Left: image + description */}
            <div className="flex flex-col w-full lg:w-2/3">
              {coverUrl ? (
                // Use <img> for signed URLs; Next/Image domain config not required
                <img
                  src={coverUrl}
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
                {listing.description || "—"}
              </p>
            </div>

            {/* Right: facts */}
            <div className="flex flex-col w-full lg:w-1/3">
              {[
                { label: "Annual Revenue", value: fmt(listing.annual_revenue_range, LABELS.annual) },
                { label: "Company EBITDA", value: fmt(listing.ebitda_range, LABELS.ebitda) },
                { label: "Years in Business", value: fmt(listing.years_in_business, LABELS.years) },
                { label: "Employees", value: fmt(listing.employee_count_range, LABELS.emp) },
                { label: "Location", value: [listing.county, listing.location_city].filter(Boolean).join(", ") || "—" },
                { label: "Financial Statements Available on Request", value: listing.can_provide_financials ? "Yes" : "No" },
                { label: "Tax Returns Available on Request", value: listing.can_provide_tax_returns ? "Yes" : "No" },
              ].map((item, i) => (
                <div key={i} className="mb-5 p-5 bg-[#f5f5f5] rounded-lg text-center">
                  <p className="font-semibold">{item.label}</p>
                  <p>{item.value}</p>
                </div>
              ))}

              {/* Contact CTA:
                 - For now, link to mailto if you want direct email.
                 - Or point to an internal route (messages/new) with listing id. */}
              {listing.contact_email ? (
                <a href={`mailto:${listing.contact_email}?subject=Inquiry about ${encodeURIComponent(listing.title || "your listing")}`}>
                  <Button className="w-full">Contact</Button>
                </a>
              ) : (
                <Link href={`/messages/new?listingId=${listing.id}`}>
                  <Button className="w-full">Contact</Button>
                </Link>
              )}

              {/* If you want owners to see an Edit link: */}
              {isOwner && (
                <Link href={`/onboarding/business/review`} className="mt-3 inline-block underline text-center">
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
