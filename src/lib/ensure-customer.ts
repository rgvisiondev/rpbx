// lib/ensure-customer.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Always return the single Stripe Customer ID for this Supabase user.
 * - Reuse mapping in public.customers (id = user.id)
 * - If none, try to find an exact single match by email in Stripe
 * - Otherwise create one
 * - Persist mapping
 */
export async function ensureCustomer(user: { id: string; email?: string | null }) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role – server only
    { auth: { persistSession: false } }
  );

  // 1) Already mapped?
  const { data: row, error } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id) // <-- correct column
    .maybeSingle();
  if (error) throw error;
  if (row?.stripe_customer_id) return row.stripe_customer_id;

  // 2) Try to reuse an existing Stripe Customer by email (only if exactly one match)
  let existing: Stripe.Customer | null = null;
  if (user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 5 });
    const exact = list.data.filter(
      (c) => (c.email || "").toLowerCase() === user.email!.toLowerCase()
    );
    if (exact.length === 1) existing = exact[0];
  }

  // 3) Create if not found
  const customer =
    existing ??
    (await stripe.customers.create({
      email: user.email || undefined,
      metadata: { supabase_user_id: user.id },
    }));

  // 4) Persist mapping
  const { error: upsertErr } = await admin
    .from("customers")
    .upsert({ id: user.id, stripe_customer_id: customer.id }); // <-- id, not user_id
  if (upsertErr) throw upsertErr;

  return customer.id;
}
