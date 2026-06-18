// app/dashboard/matches/_components/EmptyMatchesState.tsx

import Link from "next/link";

type EmptyMatchesStateProps = {
  userType: "investor" | "business_owner";
};

export default function EmptyMatchesState({ userType }: EmptyMatchesStateProps) {
  const isInvestor = userType === "investor";

  return (
    <div className="rounded-[28px] border border-dashed border-[#d8eee6] bg-[#f8fbfa] p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-[#d8eee6]">
        ✦
      </div>

      <h2 className="mt-5 text-2xl font-semibold text-gray-950">
        No strong matches yet
      </h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
        {isInvestor
          ? "We could not find strong business matches for your current investor preferences. Updating your target industries, city, EBITDA range, or cash-flow range can improve future recommendations."
          : "We could not find strong investor matches for your active listings yet. Completing your listing details, financial ranges, city, and business summary can improve future recommendations."}
      </p>

      <div className="mt-6 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#60BC9B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4fa987]"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}