// app/server/billing.ts
"use server";

import { ensureCustomer } from "@/lib/ensure-customer";
import { getStripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

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
  const stripe = getStripe();
  if (!stripe) {
    // don't return Response from here
    redirect("/dashboard/listings?err=stripe_not_configured");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
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
