// app/api/checkout/evaluation-public/route.ts
export const runtime = "nodejs";

import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_EVAL_PUBLIC;

    console.log("Public evaluation checkout:", {
      priceId,
      origin,
      stripeSecretKeyExists: !!process.env.STRIPE_SECRET_KEY,
    });

    if (!priceId) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PRICE_EVAL_PUBLIC");
      return NextResponse.json(
        { error: "Missing price configuration" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/checkout/success?type=evaluation&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?eval=canceled`,
      metadata: {
        purpose: "evaluation_public",
      },
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Public evaluation checkout error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
