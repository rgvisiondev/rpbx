// app/dashboard/matches/_components/MatchReasonChips.tsx

type MatchReasonChipsProps = {
  reasons: string[];
  max?: number;
};

export default function MatchReasonChips({
  reasons,
  max = 3,
}: MatchReasonChipsProps) {
  const visibleReasons = reasons
    .filter((reason) => reason.trim().length > 0)
    .slice(0, max);

  if (visibleReasons.length === 0) {
    return (
      <p className="text-sm leading-6 text-gray-600">
        This match is based on your profile and listing preferences.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleReasons.map((reason) => (
        <span
          key={reason}
          className="rounded-full border border-[#d8eee6] bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm"
        >
          {reason}
        </span>
      ))}
    </div>
  );
}