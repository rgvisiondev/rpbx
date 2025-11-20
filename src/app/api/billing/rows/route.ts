// app/api/billing/rows/route.ts
import { NextResponse } from "next/server";
import { createClientRSC } from "@/../utils/supabase/server";

// DB row shapes (only the fields we actually use)
interface SubscriptionRow {
  id: string;                       // Stripe subscription id
  product_name: string | null;
  status: string | null;
  current_period_end: string | null;
  user_id: string;
  metadata: any | null;             // holds listing_id, etc.
}

interface PromotionRow {
  listing_id: string;
  status: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string;
}

interface ListingRow {
  id: string;
  title: string | null;
  owner_id: string;
}

// What the client receives
interface BillingRow {
  type: "platform" | "boost";
  label: string;
  status: string | null;
  renews: string | null;
  listingId?: string;
  listingTitle?: string | null;
  stripeSubscriptionId?: string | null;
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;

  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;

  return d.toLocaleDateString("en-US", {
    month: "short",   // "Jan"
    day: "numeric",   // "5"
    year: "numeric",  // "2025"
  });
}

export async function GET() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ rows: [] });

  const rows: BillingRow[] = [];

  // ----------------------------
  // 1) Load all subscriptions
  // ----------------------------
  const { data: subs, error: subsError } = await supabase
    .from("subscriptions")
    .select(
      "id, product_name, status, current_period_end, user_id, metadata"
    )
    .eq("user_id", user.id)
    .returns<SubscriptionRow[]>();

  if (subsError) {
    console.error("Error loading subscriptions:", subsError);
    return NextResponse.json(
      { rows: [], error: "Failed to load subscriptions" },
      { status: 500 }
    );
  }

  const allSubs = subs ?? [];

  // Separate subscriptions into:
  // - plain platform-level subs (no listing_id in metadata)
  // - listing-specific subs (metadata.listing_id exists)
  const listingSubs: SubscriptionRow[] = [];
  const platformSubs: SubscriptionRow[] = [];

  for (const s of allSubs) {
    const meta = (s.metadata ?? {}) as { listing_id?: string };
    if (meta && typeof meta === "object" && meta.listing_id) {
      listingSubs.push(s);
    } else {
      platformSubs.push(s);
    }
  }

  // ---- 1a) Plain platform subs (no listing) ----
  for (const s of platformSubs) {
    rows.push({
      type: "platform",
      label: s.product_name ?? "Membership",
      status: s.status,
      renews: formatDate(s.current_period_end) ?? null,
      stripeSubscriptionId: s.id,
    });
  }

  // ----------------------------
  // 2) Listing-specific subs
  //    (subscriptions.metadata.listing_id)
  // ----------------------------
  const listingIdsFromSubs = Array.from(
    new Set(
      listingSubs
        .map((s) => {
          const meta = (s.metadata ?? {}) as { listing_id?: string };
          return meta?.listing_id ?? null;
        })
        .filter((id): id is string => !!id)
    )
  );

  let listingTitleById = new Map<string, string>();

  if (listingIdsFromSubs.length > 0) {
    const { data: listingRecords, error: listingError } = await supabase
      .from("business_listings")
      .select("id, title, owner_id")
      .in("id", listingIdsFromSubs)
      .eq("owner_id", user.id)
      .returns<ListingRow[]>();

    if (listingError) {
      console.error("Error loading listing memberships:", listingError);
    } else {
      listingTitleById = new Map<string, string>(
        (listingRecords ?? []).map((l) => [l.id, l.title ?? l.id])
      );
    }
  }

  for (const s of listingSubs) {
    const meta = (s.metadata ?? {}) as { listing_id?: string };
    const listingId = meta?.listing_id;
    if (!listingId) continue;

    const listingTitle =
      listingTitleById.get(listingId) ?? `Listing ${listingId}`;

    rows.push({
      type: "platform", // still a membership-type sub, but tied to a listing
      label: s.product_name ?? "Listing Membership",
      status: s.status,
      renews: formatDate(s.current_period_end) ?? null,
      listingId,
      listingTitle,
      stripeSubscriptionId: s.id,
    });
  }

  // ----------------------------
  // 3) Boosted listing subs (listing_promotions)
  // ----------------------------
  const { data: boosts, error: boostsError } = await supabase
    .from("listing_promotions")
    .select("listing_id, status, current_period_end, stripe_subscription_id")
    .returns<PromotionRow[]>();

  if (boostsError) {
    console.error("Error loading boosts:", boostsError);
  } else {
    const boostListingIds = (boosts ?? []).map((b) => b.listing_id);

    if (boostListingIds.length > 0) {
      const { data: listings } = await supabase
        .from("business_listings")
        .select("id, title, owner_id")
        .in("id", boostListingIds)
        .eq("owner_id", user.id)
        .returns<ListingRow[]>();

      const byId = new Map<string, string>(
        (listings ?? []).map((l) => [l.id, l.title ?? l.id])
      );

      for (const b of boosts ?? []) {
        if (!byId.has(b.listing_id)) continue;

        rows.push({
          type: "boost",
          label: byId.get(b.listing_id) ?? b.listing_id,
          status: b.status,
          renews: formatDate(b.current_period_end) ?? null,
          listingId: b.listing_id,
          listingTitle: byId.get(b.listing_id) ?? b.listing_id,
          stripeSubscriptionId: b.stripe_subscription_id,
        });
      }
    }
  }

  return NextResponse.json({ rows });
}
