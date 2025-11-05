// app/api/billing/rows/route.ts
import { NextResponse } from "next/server";
import { createClientRSC } from "@/../utils/supabase/server";

// Define typed row structures for clarity
interface SubscriptionRow {
  product_name: string | null;
  status: string | null;
  current_period_end: string | null;
  user_id: string;
}

interface PromotionRow {
  listing_id: string;
  status: string | null;
  current_period_end: string | null;
}

interface ListingRow {
  id: string;
  title: string | null;
  owner_id: string;
}

interface BillingRow {
  type: "platform" | "boost";
  label: string;
  status: string | null;
  renews: string | null;
  listingId?: string;
}

export async function GET() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ rows: [] });

  const rows: BillingRow[] = [];

  // ----- Platform member subs (mirror table) -----
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("product_name, status, current_period_end, user_id")
    .eq("user_id", user.id)
    .returns<SubscriptionRow[]>();

  (subs ?? []).forEach((s) =>
    rows.push({
      type: "platform",
      label: s.product_name ?? "Membership",
      status: s.status,
      renews: s.current_period_end ?? null,
    })
  );

  // ----- Boosted listing subs -----
  const { data: boosts } = await supabase
    .from("listing_promotions")
    .select("listing_id, status, current_period_end")
    .returns<PromotionRow[]>();

  const ids = (boosts ?? []).map((b) => b.listing_id);
  if (ids.length > 0) {
    const { data: listings } = await supabase
      .from("business_listings")
      .select("id, title, owner_id")
      .in("id", ids)
      .eq("owner_id", user.id)
      .returns<ListingRow[]>();

    const byId = new Map<string, string>(
      (listings ?? []).map((l) => [l.id, l.title ?? l.id])
    );

    (boosts ?? [])
      .filter((b) => byId.has(b.listing_id))
      .forEach((b) =>
        rows.push({
          type: "boost",
          label: byId.get(b.listing_id) ?? b.listing_id,
          status: b.status,
          renews: b.current_period_end ?? null,
          listingId: b.listing_id,
        })
      );
  }

  return NextResponse.json({ rows });
}
