type MatchTier = "excellent" | "strong" | "weak";

type MatchPreviewScoreBadgeProps = {
  score: number;
  tier: MatchTier;
};

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function MatchPreviewScoreBadge({
  score,
  tier,
}: MatchPreviewScoreBadgeProps) {
  const percent = toPercent(score);

  const className =
    tier === "excellent"
      ? "bg-[#60BC9B] text-white ring-[#d8eee6]"
      : tier === "strong"
        ? "bg-[#60A1BC] text-white ring-[#d9edf4]"
        : "bg-gray-100 text-gray-700 ring-gray-200";

  return (
    <div
      className={[
        "rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ring-4",
        className,
      ].join(" ")}
    >
      {percent}% Match
    </div>
  );
}