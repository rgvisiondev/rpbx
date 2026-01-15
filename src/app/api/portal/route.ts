import { getStripe } from "@/lib/stripe";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");
  const { customerId, returnUrl } = await req.json();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return Response.json({ url: session.url });
}
