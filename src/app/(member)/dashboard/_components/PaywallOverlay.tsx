// app/dashboard/_components/PaywallOverlay.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";

export default function PaywallOverlay() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function goToPricing() {
    setLoading(true);
    router.push("/pricing?from=dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
        <h2 className="text-xl font-semibold">Complete Your Membership</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Your account is created, but you don’t have an active membership yet.
        </p>

        <div className="mt-5 space-y-2 w-full">
          <Button onClick={goToPricing} disabled={loading} className="w-full">
            {loading ? "Taking you to plans…" : "Choose a plan"}
          </Button>

          <span className="flex flex-row mx-auto justify-center items-center gap-1">
            <p className="mt-1 text-center small text-grey">
              You can cancel anytime.
            </p>
            <form action="/signout" method="post">
              <button
                type="submit"
                className="small text-grey cursor-pointer hover:underline"
              >
                Log Out
              </button>
            </form>
          </span>
        </div>
      </div>
    </div>
  );
}
