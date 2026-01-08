// lib/stripe.ts
import Stripe from 'stripe'

// Using Accounts API version
export function getStripe(){

    const stripe = process.env.STRIPE_SECRET_KEY;

    if (!stripe) throw Error("STRIPE_SECRET_KEY missing");

    return new Stripe(stripe);

}