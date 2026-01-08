// app/server/billing.ts
"use server";

import { stripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";

function pickPortalConfig() {
  const key = process.env.STRIPE_SECRET_KEY!;
  const isTest = key.startsWith("sk_test_");
  return isTest
    ? process.env.STRIPE_PORTAL_CONFIGURATION_ID_TEST // e.g. bpc_...
    : process.env.STRIPE_PORTAL_CONFIGURATION_ID_LIVE; // optional
}

export async function openBillingPortal(returnTo: string) {
  // Reuse your RSC helper to get the logged-in user on the server
  const { createClientRSC } = await import("@/../utils/supabase/server");
  const supabase = await createClientRSC();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Ensure one Stripe customer per user
  const customerId = await ensureCustomer(user);

  const configuration = pickPortalConfig();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnTo,
    ...(configuration ? { configuration } : {}),
  });

  return session.url;
}
