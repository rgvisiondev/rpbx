// src/lib/stripe.ts
import "server-only";
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;

  // Treat empty string as missing too
  if (!key || key.trim().length === 0) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }

  return stripeSingleton;
}
