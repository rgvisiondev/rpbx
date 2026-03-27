import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";
import { siteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";

type RestoreBoostRequestBody = {
  subscriptionId?: string;
};

type MainSubscriptionRecord = {
  id: string;
  user_id: string;
  status: string | null;
  listing_id: string | null;
  paused_boost_restore_pending: boolean | null;
  paused_boost_subscription_id: string | null;
};

type BoostSubscriptionRecord = {
  id: string;
  user_id: string;
  purpose_sub: string | null;
  listing_id: string | null;
  price_id: string | null;
  quantity: number | null;
};

type CustomerRecord = {
  stripe_customer_id: string | null;
};

function getBaseUrl() {
  return typeof siteUrl === "function" ? siteUrl() : siteUrl;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClientRSC();
    const admin = await getSupabaseAdmin();
    const stripe = getStripe();

    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as RestoreBoostRequestBody;
    const subscriptionId = body?.subscriptionId?.trim();

    if (!subscriptionId) {
      return Response.json(
        { error: "subscriptionId is required." },
        { status: 400 },
      );
    }

    const mainSubResult = await admin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        status,
        listing_id,
        paused_boost_restore_pending,
        paused_boost_subscription_id
      `)
      .eq("id", subscriptionId)
      .single();

    const mainSub =
      (mainSubResult.data as MainSubscriptionRecord | null) ?? null;

    if (mainSubResult.error || !mainSub) {
      return Response.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    if (mainSub.user_id !== user.id) {
      return Response.json(
        { error: "You do not have access to this subscription." },
        { status: 403 },
      );
    }

    if (!mainSub.paused_boost_restore_pending) {
      return Response.json(
        { error: "There is no paused boost available to restore." },
        { status: 400 },
      );
    }

    if (!mainSub.paused_boost_subscription_id) {
      return Response.json(
        { error: "Missing paused boost reference." },
        { status: 400 },
      );
    }

    if (!mainSub.listing_id) {
      return Response.json(
        { error: "Missing listing association for this subscription." },
        { status: 400 },
      );
    }

    const boostSubResult = await admin
      .from("subscriptions")
      .select(`
        id,
        user_id,
        purpose_sub,
        listing_id,
        price_id,
        quantity
      `)
      .eq("id", mainSub.paused_boost_subscription_id)
      .single();

    const boostSub =
      (boostSubResult.data as BoostSubscriptionRecord | null) ?? null;

    if (boostSubResult.error || !boostSub) {
      return Response.json(
        { error: "Paused boost subscription could not be found." },
        { status: 404 },
      );
    }

    if (boostSub.purpose_sub !== "listing_promo") {
      return Response.json(
        { error: "Stored paused boost reference is invalid." },
        { status: 400 },
      );
    }

    if (!boostSub.price_id) {
      return Response.json(
        { error: "Original boost price is missing." },
        { status: 400 },
      );
    }

    const customerMapResult = await admin
      .from("customers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customerMap =
      (customerMapResult.data as CustomerRecord | null) ?? null;

    if (customerMapResult.error) {
      throw new Error(
        `Error loading Stripe customer mapping: ${customerMapResult.error.message}`,
      );
    }

    const baseUrl = getBaseUrl();

    const metadata: Record<string, string> = {
      supabase_user_id: user.id,
      purpose: "listing_promo",
      purpose_sub: "listing_promo",
      listing_id: mainSub.listing_id,
      restore_from_paused_boost: "true",
      restored_from_boost_subscription_id: boostSub.id,
      parent_subscription_id: mainSub.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerMap?.stripe_customer_id ?? undefined,
      client_reference_id: user.id,
      success_url: `${baseUrl}/dashboard/billing?boost_restore=success`,
      cancel_url: `${baseUrl}/dashboard/billing?boost_restore=canceled`,
      line_items: [
        {
          price: boostSub.price_id,
          quantity: boostSub.quantity ?? 1,
        },
      ],
      metadata,
      subscription_data: {
        metadata,
      },
      allow_promotion_codes: true,
    });

    return Response.json({
      ok: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Error restoring paused boost:", error);

    return Response.json(
      { error: "Failed to restore paused boost." },
      { status: 500 },
    );
  }
}