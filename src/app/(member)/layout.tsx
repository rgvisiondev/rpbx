// app/(member)/layout.tsx
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { getEntitlement } from "@/lib/entitlements";
import PaywallOverlay from "./dashboard/_components/PaywallOverlay";
import { IdleLogout } from "@/components/IdleLogout";

export default async function MemberLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in? Send to login before anything else.
  if (!user) redirect("/login");

  // Email not verified yet? nudge first.
  const { entitled, unverified } = await getEntitlement();
  if (unverified) redirect("/auth/verify-email");

  // OPTIONAL: choose between hard gate vs soft overlay.
  // Hard gate example (send to pricing if not entitled):
  // if (!entitled) redirect("/pricing?from=member");

  // Soft gate (your current pattern): show overlay + blur content.
  return (
    <div className="relative">
      {!entitled && <PaywallOverlay />}
      <div
        className={!entitled ? "pointer-events-none select-none blur-sm" : ""}
        aria-hidden={!entitled}
      >
        <IdleLogout />
        {children}
      </div>
    </div>
  );
}
