// app/api/subscribe/route.ts
export const runtime = 'nodejs' // keep Node runtime for Stripe SDK

import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClientRSC } from '@/../utils/supabase/server'
import { ensureCustomer } from '@/lib/ensure-customer' // make sure the path matches your file

function deriveUserTypeFromPrice(price: Stripe.Price): 'investor' | 'business' | 'member' {
  const fromMeta = (price.metadata?.user_type ?? '').toLowerCase()
  if (fromMeta === 'investor' || fromMeta === 'business') return fromMeta

  const lk = (price.lookup_key ?? '').toLowerCase()
  if (lk.startsWith('investor_')) return 'investor'
  if (lk.startsWith('business_')) return 'business'

  // default role before webhook adjusts (matches your DB default)
  return 'member'
}

export async function POST(req: Request) {
  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  try {
    const form = await req.formData()
    const lookup = String(form.get('lookup') ?? '')
    const priceIdFromForm = String(form.get('priceId') ?? '') // optional fallback
    const firstName = String(form.get('first_name') ?? '')
    const lastName = String(form.get('last_name') ?? '')
    const username = String(form.get('username') ?? '')
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')

    const trialDaysRaw = form.get('trial_days')
    const trialDays =
      typeof trialDaysRaw === 'string' && /^\d+$/.test(trialDaysRaw)
        ? parseInt(trialDaysRaw, 10)
        : 0

    if ((!lookup && !priceIdFromForm) || !email || !password) {
      return Response.redirect(`${origin}/subscribe/${lookup}?error=missing_fields`, 303)
    }

    // 1) Create Supabase user (session may be null if email confirmations are ON)
    const supabase = await createClientRSC()
    const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, username }, // stored in user_metadata
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verified`,
      },
    })

    if (signUpErr) {
      console.error('Sign up error:', signUpErr)

      // Check for "user already exists" error
      if (String(signUpErr.message).toLowerCase().includes('already registered') ||
        String(signUpErr.message).toLowerCase().includes('user already registered')) {
        return Response.redirect(`${origin}/subscribe/${lookup}?error=account_exists`, 303)
      }

      // Check for rate limiting
      if (String(signUpErr.message).toLowerCase().includes('rate') ||
        String(signUpErr.message).toLowerCase().includes('too many')) {
        return Response.redirect(`${origin}/subscribe/${lookup}?error=rate_limit`, 303)
      }

      // Generic error - redirect back with unknown error
      return Response.redirect(`${origin}/subscribe/${lookup}?error=unknown`, 303)
    }

    const userId = signUpRes.user?.id
    if (!userId) {
      return Response.redirect(`${origin}/subscribe/${lookup}?error=unknown`, 303)
    }

    // 2) Resolve the Price (by lookup preferred; priceId fallback)
    let price: Stripe.Price | null = null
    if (lookup) {
      const { data } = await stripe.prices.list({
        active: true,
        type: 'recurring',
        lookup_keys: [lookup],
        limit: 1,
        expand: ['data.product'],
      })
      price = data[0] ?? null
    } else if (priceIdFromForm) {
      price = await stripe.prices.retrieve(priceIdFromForm, { expand: ['product'] })
    }

    if (!price || !price.active || !((price.product as Stripe.Product)?.active)) {
      return Response.redirect(`${origin}/subscribe/${lookup}?error=invalid_plan`, 303)
    }

    // Derive user_type that the webhook will ultimately enforce
    const intendedUserType = deriveUserTypeFromPrice(price)

    // 3) Ensure Stripe Customer mapped to this user
    const customerId = await ensureCustomer({ id: userId, email: signUpRes.user?.email ?? email })

    // 4) Create Checkout Session (subscription) with helpful metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: userId, // convenient for reconciling
      subscription_data: {
        trial_period_days: trialDays > 0 ? trialDays : undefined,
        metadata: {
          supabase_user_id: userId,                 // webhook uses this
          plan_lookup: lookup || '',                // optional for logging
          price_id: price.id,                       // explicit
          user_type_intended: intendedUserType,     // webhook can read this or compute from Price again
        },
      },
      success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscribe/${lookup}`,
      allow_promotion_codes: true,
    })

    return Response.redirect(session.url!, 303)
  } catch (e) {
    console.error('Subscribe flow error:', e)

    // Get lookup from form if available for redirect
    let lookup = ''
    try {
      const form = await req.formData()
      lookup = String(form.get('lookup') ?? '')
    } catch { }

    // Redirect back to subscribe page with error instead of showing black screen
    return Response.redirect(`${origin}/subscribe/${lookup || 'business_monthly'}?error=unknown`, 303)
  }
}