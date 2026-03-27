// app/dashboard/_components/PaywallOverlay.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button";
import type { EntitlementStatus } from "@/lib/entitlements";

const BILLING_PATH = "/dashboard/billing";

export default function PaywallOverlay({
  status,
}: {
  status: EntitlementStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function primaryAction() {
    if (loading) return;

    setLoading(true);

    try {
      if (status === "paused") {
        router.push(`${BILLING_PATH}?from=paused`);
        return;
      }

      router.push("/pricing?from=dashboard");
    } finally {
      setLoading(false);
    }
  }

  const ui = (() => {
    switch (status) {
      case "paused":
        return {
          title: "Your membership is paused",
          body: "Resume your subscription from billing to regain access to RioPlex Business Exchange.",
          primary: "Go to Billing",
          secondary: "View plans",
          secondaryHref: "/pricing?from=paused",
        };

      case "canceled":
      case "incomplete_expired":
        return {
          title: "Your membership is inactive",
          body: "Choose a plan to regain access to RioPlex Business Exchange.",
          primary: "View plans",
          secondary: null,
          secondaryHref: null,
        };

      case "none":
      default:
        return {
          title: "Complete your membership",
          body: "Your account is created, but you don’t have an active membership yet.",
          primary: "Choose a plan",
          secondary: null,
          secondaryHref: null,
        };
    }
  })();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="fixed inset-0 bg-black/40" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
        <h2 className="text-xl font-semibold">{ui.title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{ui.body}</p>

        <div className="mt-5 w-full space-y-2">
          <Button onClick={primaryAction} disabled={loading} className="w-full">
            {loading ? "One moment…" : ui.primary}
          </Button>

          {ui.secondary && (
            <button
              className="w-full rounded-xl border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
              onClick={() => {
                if (loading) return;
                setLoading(true);
                router.push(ui.secondaryHref!);
              }}
              disabled={loading}
            >
              {ui.secondary}
            </button>
          )}

          <span className="mx-auto flex flex-row items-center justify-center gap-1">
            <p className="mt-1 text-center small text-grey">
              You can cancel anytime.
            </p>
            <form action="/signout" method="post">
              <button
                type="submit"
                className="small cursor-pointer text-grey hover:underline"
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