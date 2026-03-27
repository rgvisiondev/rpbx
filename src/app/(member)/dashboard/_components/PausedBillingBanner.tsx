"use client";

export function PausedBillingBanner({
  mode,
  count = 1,
}: {
  mode: "paused" | "pause_scheduled";
  count?: number;
}) {
  const multiple = count > 1;
  const isScheduled = mode === "pause_scheduled";

  const title = isScheduled
    ? multiple
      ? "Pauses scheduled"
      : "Pause scheduled"
    : multiple
      ? "Some of your memberships are paused"
      : "Your membership is paused";

  const body = isScheduled
    ? multiple
      ? "Some of your subscriptions are set to pause at the end of the current billing period. You can keep them active below if you changed your mind."
      : "Your subscription will pause at the end of the current billing period. You can keep it active below if you changed your mind."
    : multiple
      ? "Some of your subscriptions are currently paused. Resume them below anytime to restore full access where needed."
      : "You can resume anytime below to restore full access to RioPlex Business Exchange.";

  return (
    <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900">
            {title}
          </span>

          <p className="text-sm text-sky-900">{body}</p>
        </div>
      </div>
    </div>
  );
}