// app/dashboard/matches/_components/DashboardMatchesView.tsx

import Link from "next/link";
import NavGate from "@/app/components/NavGate";
import type { DashboardMatchesResult } from "@/lib/matching/dashboard/getDashboardMatches";
import BusinessMatchCard from "./BusinessMatchCard";
import InvestorMatchCard from "./InvestorMatchCard";
import EmptyMatchesState from "./EmptyMatchesState";

type DashboardMatchesViewProps = {
  data: DashboardMatchesResult;
};

function getExcellentCount(data: DashboardMatchesResult): number {
  if (data.userType === "investor") {
    return data.matches.filter((match) => match.tier === "excellent").length;
  }

  return data.matches.filter((match) => match.bestTier === "excellent").length;
}

function getStrongCount(data: DashboardMatchesResult): number {
  if (data.userType === "investor") {
    return data.matches.filter((match) => match.tier === "strong").length;
  }

  return data.matches.filter((match) => match.bestTier === "strong").length;
}

function getMatchedListingCount(data: DashboardMatchesResult): number {
  if (data.userType === "investor") {
    return data.matches.length;
  }

  return data.matches.reduce(
    (total, match) => total + match.matchedListings.length,
    0,
  );
}

export default function DashboardMatchesView({
  data,
}: DashboardMatchesViewProps) {
  const isInvestor = data.userType === "investor";

  const totalMatches = data.matches.length;
  const excellentCount = getExcellentCount(data);
  const strongCount = getStrongCount(data);
  const matchedListingCount = getMatchedListingCount(data);

  return (
    <div className="flex min-h-screen flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <NavGate />

      <main className="mx-auto flex w-full flex-col gap-8 px-5 py-10 lg:max-w-[1140px] lg:px-2">
        <section className="overflow-hidden rounded-[28px] bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center shadow-lg">
          <div className="bg-black/30 p-6 lg:p-9">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white ring-1 ring-white/20">
                  Match Center
                </div>

                <h1 className="text-left text-3xl font-bold leading-tight text-white lg:text-4xl">
                  Your recommended matches
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white lg:text-base">
                  {isInvestor
                    ? "Review business opportunities that align with your investment focus, location, and financial preferences."
                    : "Review investors who align with your active business listings, industry, and transaction profile."}
                </p>
              </div>

              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-950 shadow-sm transition hover:bg-[#f8fbfa]"
              >
                Back to dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total matches" value={totalMatches} />
              <StatCard label="Excellent" value={excellentCount} />
              <StatCard label="Strong" value={strongCount} />
              <StatCard
                label={isInvestor ? "Business matches" : "Listing connections"}
                value={matchedListingCount}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-lg lg:p-7">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-950">
                {isInvestor ? "Business opportunities" : "Investor opportunities"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-gray-600">
                {isInvestor
                  ? "Sorted by the businesses that best match your investor profile."
                  : "Sorted by the investors with the strongest fit across your active listings."}
              </p>
            </div>

            {data.matches.length > 0 && (
              <div className="rounded-full bg-[#f8fbfa] px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-[#d8eee6]">
                {data.matches.length} shown
              </div>
            )}
          </div>

          {data.matches.length === 0 ? (
            <EmptyMatchesState userType={data.userType} />
          ) : data.userType === "investor" ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {data.matches.map((match) => (
                <BusinessMatchCard key={match.listing.id} match={match} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {data.matches.map((match) => (
                <InvestorMatchCard key={match.investor.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-white">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}