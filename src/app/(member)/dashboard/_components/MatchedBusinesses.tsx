// app/dashboard/_components/MatchedBusinesses.tsx

import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import { imageUrl } from "@/lib/industryImages";
import type { InvestorDashboardBusinessMatch } from "@/lib/matching/dashboard/getInvestorDashboardMatches";
import MatchPreviewScoreBadge from "./MatchPreviewScoreBadge";

export default function MatchedBusinesses({
  matches,
}: {
  matches: InvestorDashboardBusinessMatch[];
}) {
  if (!matches?.length) {
    return (
      <div className="col-span-full rounded-2xl bg-[#f8fbfa] p-5 text-sm text-gray-600 ring-1 ring-[#d8eee6]">
        No strong matches yet — check back soon.
      </div>
    );
  }

  return (
    <>
      {matches.map((match) => {
        const listing = match.listing;

        const imgSrc =
          (listing.listingImageChoice && imageUrl(listing.listingImageChoice)) ||
          "/images/businesses/home-services.jpg";

        const alt =
          listing.listingImageAlt ||
          listing.title ||
          "Business listing thumbnail";

        const location = [listing.city, listing.stateCode]
          .filter(Boolean)
          .join(", ");

        const title = listing.industry
          ? `${listing.industry} Business`
          : "Business Opportunity";

        return (
          <article
            key={listing.id}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="relative">
              <Image
                src={imgSrc}
                alt={alt}
                className="h-[210px] w-full object-cover"
                width={400}
                height={210}
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
              />

              <div className="absolute left-3 top-3">
                <MatchPreviewScoreBadge
                  score={match.score}
                  tier={match.tier}
                />
              </div>
            </div>

            <div className="flex min-h-[195px] flex-col p-5">
              <div>
                <h4 className="font-semibold leading-snug text-gray-950">
                  {title}
                </h4>

                {location && (
                  <p className="mt-1 text-xs font-medium text-gray-600">
                    {location}
                  </p>
                )}

                {match.reasons[0] && (
                  <p className="mt-3 text-sm leading-5 text-gray-600">
                    {match.reasons[0]}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4">
                <Link href={`/business-listing/${listing.id}`}>
                  <Button className="w-full">View Listing</Button>
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}