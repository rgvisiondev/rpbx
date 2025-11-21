// app/dashboard/_components/PaywallOverlay.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";

export default function PaywallOverlay({
  priceId,
}: {
  priceId?: string; // optional — if missing, routes to /pricing
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  async function resumeCheckout() {
    try {
      setLoading(true);
      setErr(null);

      // No price chosen yet → send them to plan picker
      if (!priceId) {
        router.push("/pricing?from=dashboard");
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          priceId,
          purpose: "base_membership",
          successUrl: `${window.location.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/dashboard`,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Checkout failed");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (e: unknown) {
        if (e instanceof Error){
            setErr(e?.message);
        } else {
            setErr("Something went wrong")
        }
        setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl borde text-center">
        <h2 className="text-xl font-semibold">Complete Your Membership</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your account is created, but you don’t have an active membership yet.
        </p>

        {!!err && <p className="mt-3 text-sm text-red-600">{err}</p>}

        <div className="mt-5 space-y-2 w-full">
          <Button onClick={resumeCheckout} disabled={loading} className="w-full">
            {loading ? "Opening checkout…" : "Continue checkout"}
          </Button>

<span className="flex flex-row mx-auto justify-center items-center gap-1">
  <p className="mt-1 text-center small text-grey">
    You can cancel anytime.
  </p>
  <form action="/signout" method="post">
    <button type="submit" className="small text-grey cursor-pointer hover:underline">
      Log Out
    </button>
  </form>
</span>

        </div>
      </div>
    </div>
  );
}
