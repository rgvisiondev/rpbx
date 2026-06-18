type MatchTier = "excellent" | "strong" | "weak";

type MatchScoreBadgeProps = {
  score: number;
  tier: MatchTier;
  compact?: boolean;
};

const tierLabel: Record<MatchTier, string> = {
  excellent: "Excellent",
  strong: "Strong",
  weak: "Developing",
};

const tierClassName: Record<MatchTier, string> = {
  excellent: "bg-[#60BC9B] text-white ring-[#d8eee6]",
  strong: "bg-[#60A1BC] text-white ring-[#d9edf4]",
  weak: "bg-gray-100 text-gray-700 ring-gray-200",
};

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export default function MatchScoreBadge({
  score,
  tier,
  compact = false,
}: MatchScoreBadgeProps) {
  const percent = toPercent(score);

  if (compact) {
    return (
      <div
        className={[
          "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-4",
          tierClassName[tier],
        ].join(" ")}
      >
        {percent}%
      </div>
    );
  }

  return (
    <div
      className={[
        "shrink-0 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm ring-4",
        tierClassName[tier],
      ].join(" ")}
    >
      {percent}% Match
      <span className="ml-1 hidden sm:inline">· {tierLabel[tier]}</span>
    </div>
  );
}