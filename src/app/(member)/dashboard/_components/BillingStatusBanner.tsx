// app/dashboard/_components/BillingStatusBanner.tsx
"use client";

import * as React from "react";
import type { EntitlementStatus } from "@/lib/entitlements";

export default function BillingStatusBanner({
  show,
  status,
}: {
  show: boolean;
  status: EntitlementStatus;
}) {
  const [loading, setLoading] = React.useState(false);
  if (!show) return null;

  async function openBillingPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const label = status === "unpaid" ? "Payment overdue" : "Payment issue";

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            {label}
          </span>
          <p className="text-sm text-amber-900">
            We couldn’t process your most recent payment. Update your billing to avoid interruption.
          </p>
        </div>

        <button
          onClick={openBillingPortal}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "#F44336" }}
        >
          {loading ? "Opening…" : "Update billing"}
        </button>
      </div>
    </div>
  );
}