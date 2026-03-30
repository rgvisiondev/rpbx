// app/(member)/MemberGateShell.tsx
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type { EntitlementStatus } from "@/lib/entitlements";
import PaywallOverlay from "./dashboard/_components/PaywallOverlay";
import { IdleLogout } from "@/components/IdleLogout";

type MemberGateShellProps = {
  blocked: boolean;
  status: EntitlementStatus;
  children: React.ReactNode;
};

const BILLING_PATHS = new Set([
  "/dashboard/billing",
]);

export default function MemberGateShell({
  blocked,
  status,
  children,
}: MemberGateShellProps) {
  const pathname = usePathname();

  const allowPausedBillingAccess =
    status === "paused" && BILLING_PATHS.has(pathname);

  const shouldBlock = blocked && !allowPausedBillingAccess;

  return (
    <div className="relative">
      {shouldBlock && <PaywallOverlay status={status} />}

      <div
        className={shouldBlock ? "pointer-events-none select-none blur-sm" : ""}
        aria-hidden={shouldBlock}
      >
        <IdleLogout />
        {children}
      </div>
    </div>
  );
}