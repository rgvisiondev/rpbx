// lib/serverGuard.ts
import { getEntitlement } from "@/lib/entitlements";

export async function requireEntitlementOrNull() {
  const ent = await getEntitlement();

  if (ent.unverified) return { ...ent, block: "unverified" as const };
  if (ent.blocked) return { ...ent, block: "paywall" as const };
  return { ...ent, block: null };
}
