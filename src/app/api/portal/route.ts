import Stripe from 'stripe'
export const runtime = 'nodejs'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  const { customerId, returnUrl } = await req.json()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return Response.json({ url: session.url })
}
