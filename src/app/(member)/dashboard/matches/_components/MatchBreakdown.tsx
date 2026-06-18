// app/dashboard/matches/_components/MatchBreakdown.tsx

type MatchBreakdownValue = {
  industry: number;
  geography: number;
  size: number;
  freshness: number;
  completeness: number;
  activity: number;
};

type MatchBreakdownProps = {
  breakdown?: MatchBreakdownValue | null;
  label?: string;
};

const rows: Array<{
  key: keyof MatchBreakdownValue;
  label: string;
}> = [
  { key: "industry", label: "Industry fit" },
  { key: "geography", label: "Location" },
  { key: "size", label: "Financial fit" },
  { key: "freshness", label: "Freshness" },
  { key: "completeness", label: "Completeness" },
  { key: "activity", label: "Activity" },
];

export default function MatchBreakdown({
  breakdown,
  label = "Score details",
}: MatchBreakdownProps) {
  if (!breakdown) {
    return null;
  }

  return (
    <details className="group rounded-2xl border border-gray-100 bg-[#f8fbfa] p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-gray-800">
        <span className="flex items-center justify-between gap-3">
          {label}

          <span className="text-xs font-medium text-gray-500 group-open:hidden">
            View
          </span>

          <span className="hidden text-xs font-medium text-gray-500 group-open:inline">
            Hide
          </span>
        </span>
      </summary>

      <div className="mt-4 space-y-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <span className="text-gray-600">{row.label}</span>
            <span className="font-semibold text-gray-950">
              {breakdown[row.key]}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}