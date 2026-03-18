// app/(member)/layout.tsx
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { requireEntitlementOrNull } from "@/lib/serverGuard";
import PaywallOverlay from "./dashboard/_components/PaywallOverlay";
import { IdleLogout } from "@/components/IdleLogout";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const gate = await requireEntitlementOrNull();

  if (gate.block === "unverified") {
    redirect("/auth/verify-email");
  }

  const blocked = gate.block === "paywall";

  return (
    <div className="relative">
      {blocked && <PaywallOverlay status={gate.status} />}
      <div
        className={blocked ? "pointer-events-none select-none blur-sm" : ""}
        aria-hidden={blocked}
      >
        <IdleLogout />
        {children}
      </div>
    </div>
  );
}
