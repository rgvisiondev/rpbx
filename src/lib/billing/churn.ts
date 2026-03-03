import Stripe from "stripe"
import type { AdminClient } from "@/types/billing";

export async function getUserIdForStripeCustomer(
  admin: AdminClient,
  stripe: Stripe,
  stripeCustomerId: string | null | undefined,
): Promise<string | null> {
  if (!stripeCustomerId) return null;

  // 1) customers mapping table
  const { data: mapRow } = await admin
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (mapRow?.id) return mapRow.id;

  // 2) fallback: customer metadata
  try {
    const cust = await stripe.customers.retrieve(stripeCustomerId);
    if ("deleted" in cust) return null;
    return (cust.metadata?.supabase_user_id as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getCancellationReasonForSub(
  admin: AdminClient,
  stripeSubId: string,
): Promise<string | null> {
  // assumes you add this column on subscriptions table
  const { data } = await admin
    .from("subscriptions")
    .select("cancellation_reason")
    .eq("id", stripeSubId)
    .maybeSingle();

  return (data?.cancellation_reason as string | null) ?? null;
}

export async function getContactEmailForUser(
  admin: AdminClient,
  uid: string,
): Promise<string | null> {
  // prefer investor contact email first
  const { data: invRow } = await admin
    .from("investor_profiles")
    .select("contact_email")
    .eq("user_id", uid)
    .maybeSingle();

  if (invRow?.contact_email) return invRow.contact_email;

  // fallback to business listing contact email
  const { data: listingRow } = await admin
    .from("business_listings")
    .select("contact_email")
    .eq("owner_id", uid)
    .limit(1)
    .maybeSingle();

  return listingRow?.contact_email ?? null;
}