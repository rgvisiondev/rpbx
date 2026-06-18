import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import type {
  BusinessOwnerDashboardInvestorMatch,
  BusinessOwnerDashboardMatchedListing,
} from "@/lib/matching/dashboard/getBusinessOwnerDashboardMatches";
import MatchScoreBadge from "./MatchScoreBadge";
import MatchReasonChips from "./MatchReasonChips";
import MatchBreakdown from "./MatchBreakdown";

type InvestorMatchCardProps = {
  match: BusinessOwnerDashboardInvestorMatch;
};

function getInvestorName(match: BusinessOwnerDashboardInvestorMatch): string {
  const fullName = [
    match.investor.firstName ?? "",
    match.investor.lastName ?? "",
  ]
    .join(" ")
    .trim();

  return fullName || `Investor #${match.investor.id.slice(0, 6)}`;
}

function pluralizeListing(count: number): string {
  return count === 1 ? "listing" : "listings";
}

function formatListingMeta(
  listingMatch: BusinessOwnerDashboardMatchedListing,
): string {
  return [
    listingMatch.listing.industry,
    listingMatch.listing.city,
    listingMatch.listing.stateCode,
  ]
    .filter(Boolean)
    .join(" • ");
}

function ListingMatchRow({
  listingMatch,
  featured = false,
}: {
  listingMatch: BusinessOwnerDashboardMatchedListing;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 shadow-sm",
        featured ? "border-[#d8eee6]" : "border-gray-100",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {featured && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#4fa987]">
              Top matched listing
            </p>
          )}

          <p className="truncate font-semibold text-gray-950">
            {listingMatch.listing.title || "Business listing"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatListingMeta(listingMatch) || "Listing match"}
          </p>
        </div>

        <MatchScoreBadge
          score={listingMatch.score}
          tier={listingMatch.tier}
          compact
        />
      </div>

      <div className="mt-3">
        <MatchReasonChips reasons={listingMatch.reasons} max={2} />
      </div>
    </div>
  );
}

export default function InvestorMatchCard({ match }: InvestorMatchCardProps) {
  const name = getInvestorName(match);
  const imgSrc = match.investor.avatarUrl || "/images/svg/def-inv.svg";

  const [topListingMatch, ...otherListingMatches] = match.matchedListings;
  const otherCount = otherListingMatches.length;

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
          <Image
            src={imgSrc}
            alt={`${name}'s profile photo`}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized={Boolean(match.investor.avatarUrl)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold leading-tight text-gray-950">
                {name}
              </h3>

              <p className="mt-1 text-sm font-medium text-gray-700">
                {match.investor.organizationEntity || "Independent Investor"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {[match.investor.primaryIndustry, match.investor.city]
                  .filter(Boolean)
                  .join(" • ") || "Investor profile"}
              </p>
            </div>

            <MatchScoreBadge score={match.bestScore} tier={match.bestTier} />
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#f8fbfa] p-4 ring-1 ring-[#d8eee6]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-950">
            Why this investor is a fit
          </p>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
            {match.matchedListings.length}{" "}
            {pluralizeListing(match.matchedListings.length)}
          </span>
        </div>

        <MatchReasonChips reasons={match.bestReasons} />
      </div>

      {topListingMatch && (
        <div className="mt-5">
          <ListingMatchRow listingMatch={topListingMatch} featured />
        </div>
      )}

      {otherCount > 0 && (
        <details className="group mt-3 rounded-2xl border border-gray-100 bg-[#f8fbfa] p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-gray-800">
            <span className="flex items-center justify-between gap-3">
              View {otherCount} other matched {pluralizeListing(otherCount)}

              <span className="text-xs font-medium text-gray-500 group-open:hidden">
                Show
              </span>

              <span className="hidden text-xs font-medium text-gray-500 group-open:inline">
                Hide
              </span>
            </span>
          </summary>

          <div className="mt-4 space-y-3">
            {otherListingMatches.map((listingMatch) => (
              <ListingMatchRow
                key={listingMatch.listing.id}
                listingMatch={listingMatch}
              />
            ))}
          </div>
        </details>
      )}

      <div className="mt-4">
        <MatchBreakdown
          breakdown={topListingMatch?.breakdown}
          label="Top listing score details"
        />
      </div>

      <div className="mt-5">
        <Link href={`/investor-listing/${match.investor.id}`}>
          <Button className="w-full">View Investor Profile</Button>
        </Link>
      </div>
    </article>
  );
}