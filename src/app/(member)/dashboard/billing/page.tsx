"use client";

import { useEffect, useState } from "react";

type BillingRow = {
  type: "platform" | "boost";
  label: string;
  status?: string | null;
  renews?: string | null;
  listingId?: string | null;
};

export default function BillingPage() {
  const [rows, setRows] = useState<BillingRow[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/billing/rows"); // create a small RSC handler or route to aggregate data
      const data = await res.json();
      setRows(data.rows as BillingRow[]);
    })();
  }, []);

  async function openPortal() {
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (error) alert(error);
    else window.location.href = url;
  }

  return (
    <div className="w-full lg:w-[1140px] mx-auto py-10 px-5">
      <h1 className="mb-4">Manage Subscription</h1>
      <p className="text-sm text-gray-600 mb-6">
        Use the customer portal to update payment methods, view invoices, or cancel plans.
      </p>
      <div className="bg-white border rounded-xl p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-2">Type</th>
              <th className="py-2">Label</th>
              <th className="py-2">Status</th>
              <th className="py-2">Renews</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2">{r.type === "platform" ? "Platform" : "Boosted Listing"}</td>
                <td className="py-2">{r.label}</td>
                <td className="py-2">{r.status ?? "—"}</td>
                <td className="py-2">{r.renews ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={openPortal} className="mt-4 px-4 py-2 rounded bg-black text-white">
          Open Billing Portal
        </button>
      </div>
    </div>
  );
}
