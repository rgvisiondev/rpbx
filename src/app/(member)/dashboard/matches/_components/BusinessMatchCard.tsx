// app/dashboard/matches/_components/BusinessMatchCard.tsx

import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import { imageUrl } from "@/lib/industryImages";
import type { InvestorDashboardBusinessMatch } from "@/lib/matching/dashboard/getInvestorDashboardMatches";
import MatchScoreBadge from "./MatchScoreBadge";
import MatchReasonChips from "./MatchReasonChips";
import MatchBreakdown from "./MatchBreakdown";

type BusinessMatchCardProps = {
  match: InvestorDashboardBusinessMatch;
};

function formatLocation(
  city?: string | null,
  stateCode?: string | null,
  county?: string | null,
): string {
  const cityState = [city, stateCode].filter(Boolean).join(", ");
  if (cityState) return cityState;

  return [county, stateCode].filter(Boolean).join(", ");
}

export default function BusinessMatchCard({ match }: BusinessMatchCardProps) {
  const imgSrc =
    (match.listing.listingImageChoice &&
      imageUrl(match.listing.listingImageChoice)) ||
    "/images/businesses/home-services.jpg";

  const alt =
    match.listing.listingImageAlt ||
    match.listing.industry ||
    "Business listing thumbnail";

  const location = formatLocation(
    match.listing.city,
    match.listing.stateCode,
    match.listing.county,
  );

  const displayTitle = match.listing.industry
    ? `${match.listing.industry} Business`
    : "Business Opportunity";

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="relative h-[210px] w-full bg-gray-100">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />

        <div className="absolute left-4 top-4">
          <MatchScoreBadge score={match.score} tier={match.tier} />
        </div>
      </div>

      <div className="flex min-h-[310px] flex-col p-5">
        <div>
          <h3 className="text-lg font-bold leading-snug text-gray-950">
            {displayTitle}
          </h3>

          {location && (
            <p className="mt-1 text-sm font-medium text-gray-600">
              {location}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-[#f8fbfa] p-4 ring-1 ring-[#d8eee6]">
          <p className="mb-3 text-sm font-semibold text-gray-950">
            Why this is a fit
          </p>

          <MatchReasonChips reasons={match.reasons} />
        </div>

        <div className="mt-4">
          <MatchBreakdown breakdown={match.breakdown} />
        </div>

        <div className="mt-auto pt-5">
          <Link href={`/business-listing/${match.listing.id}`}>
            <Button className="w-full">View Listing</Button>
          </Link>
        </div>
      </div>
    </article>
  );
}