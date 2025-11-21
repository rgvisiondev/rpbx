// lib/entitlements/serverGuard.ts
import { getEntitlement } from "@/lib/entitlements";

export async function requireEntitlementOrNull() {
  const { entitled, unverified, role } = await getEntitlement();
  if (unverified) return { entitled, role, block: "unverified" as const };
  if (!entitled)   return { entitled, role, block: "paywall" as const };
  return { entitled, role, block: null };
}
