// lib/ensure-customer.ts
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensureCustomer(
  stripe: Stripe,
  admin: SupabaseClient,
  user: { id: string; email?: string | null }
) {
  const { data: row, error } = await admin
    .from("customers")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (row?.stripe_customer_id) return row.stripe_customer_id;

  let existing: Stripe.Customer | null = null;
  if (user.email) {
    const list = await stripe.customers.list({ email: user.email, limit: 5 });
    const exact = list.data.filter(
      (c) => (c.email || "").toLowerCase() === user.email!.toLowerCase()
    );
    if (exact.length === 1) existing = exact[0];
  }

  const customer =
    existing ??
    (await stripe.customers.create({
      email: user.email || undefined,
      metadata: { supabase_user_id: user.id },
    }));

  const { error: upsertErr } = await admin
    .from("customers")
    .upsert({ id: user.id, stripe_customer_id: customer.id });

  if (upsertErr) throw upsertErr;

  return customer.id;
}
