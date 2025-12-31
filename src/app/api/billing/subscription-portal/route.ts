// app/api/billing/subscription-portal/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClientRSC } from "@/../utils/supabase/server";
import { getStripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const { subscriptionId, action } = (await req.json()) as {
    subscriptionId?: string;
    action?: "update" | "cancel";
  };

  if (!subscriptionId || !action) {
    return NextResponse.json(
      { error: "Missing subscriptionId or action" },
      { status: 400 }
    );
  }
  
  const stripe = getStripe();
  const supabase = await createClientRSC();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure the subscription belongs to this user
  const { data: sub, error: subError } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("id", subscriptionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (subError || !sub) {
    return NextResponse.json(
      { error: "Subscription not found" },
      { status: 404 }
    );
  }

  const customerId = await ensureCustomer(stripe, supabase, user);

  const flowData =
    action === "cancel"
      ? {
        type: "subscription_cancel" as const,
        subscription_cancel: { subscription: subscriptionId },
      }
      : {
        type: "subscription_update" as const,
        subscription_update: { subscription: subscriptionId },
      };

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${ORIGIN}/dashboard/billing`,
      flow_data: flowData,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creating subscription portal session:", err);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
