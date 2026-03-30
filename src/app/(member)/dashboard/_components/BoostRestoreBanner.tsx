"use client";

type BoostRestoreBannerProps = {
  listingTitle?: string | null;
  onRestore: () => void;
  onDismiss: () => void;
  restoring?: boolean;
  dismissing?: boolean;
};

export function BoostRestoreBanner({
  listingTitle,
  onRestore,
  onDismiss,
  restoring = false,
  dismissing = false,
}: BoostRestoreBannerProps) {
  const subject = listingTitle?.trim()
    ? `"${listingTitle.trim()}"`
    : "this listing";

  return (
    <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-900">
            Boost restore available
          </span>

          <h4 className="mt-3 text-sm font-semibold text-sky-950">
            Bring your boosted listing back?
          </h4>

          <p className="mt-1 text-sm leading-relaxed text-sky-900">
            Your membership is active again. The Boosted Listing add-on for{" "}
            {subject} was paused with it and can be restored anytime.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={onDismiss}
            disabled={dismissing || restoring}
            className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100 disabled:opacity-60"
          >
            {dismissing ? "Saving..." : "Maybe Later"}
          </button>

          <button
            onClick={onRestore}
            disabled={restoring || dismissing}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
            style={{ backgroundColor: "#9ed3c3" }}
          >
            {restoring ? "Restoring..." : "Restore Boost"}
          </button>
        </div>
      </div>
    </div>
  );
}