// app/api/pricing/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const LOOKUPS = (process.env.STRIPE_PUBLIC_LOOKUPS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const revalidate = 600;

type Out = {
  id: string;
  lookup_key: string | null;
  currency: string;                    // "USD"
  unit_amount: number | null;          // cents
  interval: Stripe.Price.Recurring["interval"] | null; // 'month' | 'year' | ...
  interval_count: number | null;
  productId: string;
  productName: string;
  productDescription: string | null;
  metadata: Record<string, string>;    // merged product + price metadata
  popular: boolean;                    // computed from merged metadata
  sortOrder: number;                   // parsed from metadata.sort_order
};

export async function GET() {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ["data.product"],
      lookup_keys: LOOKUPS.length ? LOOKUPS : undefined,
    });

    const out: Out[] = prices.data.map((p) => {
      const prod = p.product as Stripe.Product;

      const mf: string[] = Array.isArray(prod.marketing_features)
        ? prod.marketing_features
            .map(f => (f?.name || "").trim())
            .filter(Boolean)
        : [];

      const metaFeatures = (prod.metadata?.features || p.metadata?.features || "")
        .split("|")
        .map(s => s.trim())
        .filter(Boolean);
        
    
        const features = mf.length ? mf : metaFeatures;

      // Merge product + price metadata (price overrides product on key collisions)
      const mergedMeta: Record<string, string> = {
        ...(prod?.metadata ?? {}),
        ...(p.metadata ?? {}),
      };

      // Normalize booleans / numbers from strings
      const popular =
        String(mergedMeta.popular ?? "").trim().toLowerCase() === "true";

      const sortOrderRaw = mergedMeta.sort_order ?? mergedMeta.order ?? "";
      const sortOrder = Number.isFinite(parseInt(sortOrderRaw, 10))
        ? parseInt(sortOrderRaw, 10)
        : 999;

      return {
        id: p.id,
        lookup_key: p.lookup_key ?? null,
        currency: p.currency.toUpperCase(),
        unit_amount: p.unit_amount,
        interval: p.recurring?.interval ?? null,
        interval_count: p.recurring?.interval_count ?? null,
        productId: prod?.id ?? "",
        productName: prod?.name ?? (p.nickname ?? "Plan"),
        productDescription: prod?.description ?? null,
        features,
        metadata: mergedMeta,
        popular,
        sortOrder,
      };
    });

    // Optional: sort by sortOrder then name (lets you control order via Stripe metadata)
    out.sort((a, b) => (a.sortOrder - b.sortOrder) || a.productName.localeCompare(b.productName));

    return NextResponse.json(out);
  } catch (err) {
    console.error("GET /api/pricing error:", err);
    return NextResponse.json({ error: "Failed to load pricing" }, { status: 500 });
  }
}
