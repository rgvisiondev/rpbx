// app/billing/BillingClient.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

type BillingRow = {
  type: "platform" | "boost";
  label: string;
  status: string | null;            // 'active' | 'canceled' | ...
  renews: string | null;
  listingId?: string;
  listingTitle?: string | null;
  stripeSubscriptionId?: string | null;
};

function formatStatus(status: string | null): string {
  if (!status) return "—";

  const map: Record<string, string> = {
    trialing: "Trialing",
    active: "Active",
    canceled: "Canceled",
    incomplete: "Incomplete",
    incomplete_expired: "Incomplete (Expired)",
    past_due: "Past due",
    unpaid: "Unpaid",
    paused: "Paused",
  };

  return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export default function BillingClient() {
  const [rows, setRows] = useState<BillingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/billing/rows", { cache: "no-store" });
        const data = await res.json();
        setRows(data.rows ?? []);
      } catch (e) {
        console.error("Failed to load billing rows", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) alert(error);
    else window.location.href = url;
  }

  async function manageSubscription(
    subscriptionId: string,
    action: "update" | "cancel"
  ) {
    try {
      const res = await fetch("/api/billing/subscription-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, action }),
      });

      const { url, error } = await res.json();
      if (error) {
        alert(error);
      } else if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error(e);
      alert("Something went wrong creating the billing portal session.");
    }
  }

  return (
    <div className="w-full lg:w-[1140px] mx-auto py-10 px-5 lg:px-0">
      <h1 className="mb-4">Manage Subscription</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use the customer portal to update payment methods, view invoices, or cancel plans.
      </p>

      <div className="bg-white border rounded-xl p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading subscriptions…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">
            You don&apos;t have any active subscriptions yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="py-2">Type</th>
                <th className="py-2">Label</th>
                <th className="py-2">Listing</th>
                <th className="py-2">Status</th>
                <th className="py-2">Renews</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isActive =
                  r.status === "active" || r.status === "trialing" || r.status === "past_due";
                const isCanceled = r.status === "canceled" || r.status === "unpaid" || r.status === "paused";

                return (
                  <tr key={i} className="border-t">
                    <td className="py-2">
                      {r.type === "platform" ? "Platform" : "Boosted Listing"}
                    </td>
                    <td className="py-2">{r.label}</td>
                    <td className="py-2">
                      {r.listingTitle ? (
                        r.listingId ? (
                          <Link
                            href={`/business-listing/${r.listingId}`}
                            className="text-[var(--color-primary)] underline underline-offset-2"
                          >
                            {r.listingTitle}
                          </Link>
                        ) : (
                          r.listingTitle
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      <span
                        className={
                          r.status === "active"
                            ? "inline-flex items-center px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs"
                            : r.status === "canceled"
                            ? "inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs"
                            : "inline-flex items-center px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs"
                        }
                      >
                        {formatStatus(r.status)}
                      </span>
                    </td>
                    <td className="py-2">{r.renews ?? "—"}</td>
                    <td className="py-2 text-right space-x-2">
                      {!r.stripeSubscriptionId ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : isActive ? (
                        <>
                          <button
                            onClick={() =>
                              manageSubscription(
                                r.stripeSubscriptionId as string,
                                "update"
                              )
                            }
                            className="px-3 py-1 rounded-full border text-xs hover:bg-gray-50 transition"
                          >
                            Update
                          </button>
                          <button
                            onClick={() =>
                              manageSubscription(
                                r.stripeSubscriptionId as string,
                                "cancel"
                              )
                            }
                            className="px-3 py-1 rounded-full bg-red-500 text-white text-xs hover:bg-red-600 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : isCanceled ? (
                        <button
                          onClick={openPortal}
                          className="px-3 py-1 rounded-full border text-xs hover:bg-gray-50 transition"
                        >
                          Renew / Manage
                        </button>
                      ) : (
                        <button
                          onClick={openPortal}
                          className="px-3 py-1 rounded-full border text-xs hover:bg-gray-50 transition"
                        >
                          Manage
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <button
          onClick={openPortal}
          className="mt-4 px-4 py-2 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:cursor-pointer text-white transition"
        >
          Open Billing Portal
        </button>
      </div>
    </div>
  );
}
