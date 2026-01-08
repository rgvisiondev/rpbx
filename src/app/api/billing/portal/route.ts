// app/api/billing/portal/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic"

import { getStripe } from "@/lib/stripe";
import { ensureCustomer } from "@/lib/ensure-customer";
import { createClientRSC } from "@/../utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const admin = getSupabaseAdmin();

    const supabase = await createClientRSC();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return new Response("Unauthorized", { status: 401 });

    // Prefer server-derived return URL
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";

    // Reuse/ensure Stripe Customer for this user
    const customerId = await ensureCustomer(stripe, admin, user);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/billing`,
    });

    return Response.json({ url: session.url });
  } catch (e) {
    console.error("billing portal error:", e);
    return Response.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
