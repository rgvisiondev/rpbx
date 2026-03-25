// app/(member)/layout.tsx
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { requireEntitlementOrNull } from "@/lib/serverGuard";
import MemberGateShell from "./MemberGateShell";

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
    <MemberGateShell blocked={blocked} status={gate.status}>
      {children}
    </MemberGateShell>
  );
}