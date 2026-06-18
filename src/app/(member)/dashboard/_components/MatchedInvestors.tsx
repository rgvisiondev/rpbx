// app/dashboard/_components/MatchedInvestors.tsx

import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import type { BusinessOwnerDashboardInvestorMatch } from "@/lib/matching/dashboard/getBusinessOwnerDashboardMatches";
import MatchPreviewScoreBadge from "./MatchPreviewScoreBadge";

export default function MatchedInvestors({
  matches,
}: {
  matches: BusinessOwnerDashboardInvestorMatch[];
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
        const name =
          [match.investor.firstName ?? "", match.investor.lastName ?? ""]
            .join(" ")
            .trim() || `Investor #${match.investor.id.slice(0, 6)}`;

        const imgSrc = match.investor.avatarUrl || "/images/svg/def-inv.svg";
        const listingCount = match.matchedListings.length;

        return (
          <article
            key={match.investor.id}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <div className="relative">
              <Image
                src={imgSrc}
                alt={`${name}'s profile photo`}
                className="h-[210px] w-full bg-gray-100 object-cover"
                width={400}
                height={210}
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                unoptimized={Boolean(match.investor.avatarUrl)}
              />

              <div className="absolute left-3 top-3">
                <MatchPreviewScoreBadge
                  score={match.bestScore}
                  tier={match.bestTier}
                />
              </div>
            </div>

            <div className="flex min-h-[215px] flex-col p-5">
              <div>
                <h4 className="font-semibold leading-snug text-gray-950">
                  {name}
                </h4>

                <p className="mt-1 text-xs font-medium text-gray-600">
                  {match.investor.organizationEntity || "Independent Investor"}
                </p>

                <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f8fbfa] px-3.5 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-[#d8eee6]">
                  <span className="rounded-full bg-[#60BC9B] px-2 py-0.5 text-[11px] font-bold text-white">
                    {listingCount}
                  </span>
                  <span>
                    {listingCount === 1 ? "listing match" : "listing matches"}
                  </span>
                </p>
              </div>

              <div className="mt-auto pt-4">
                <Link href={`/investor-listing/${match.investor.id}`}>
                  <Button className="w-full">View Profile</Button>
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </>
  );
}
