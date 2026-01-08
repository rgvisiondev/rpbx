// lib/stripe.ts
import Stripe from 'stripe'

// Use your account's API version (or lock one explicitly)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
