import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

type SB = SupabaseClient<Database>;
type ListingEvalRow = { listing_id: string; status: string };

export async function getListingBadges(supabase: SB, listingIds: string[]) {
  const { data: promos } = await supabase
    .from("listing_promotions")
    .select("listing_id, status, current_period_end, cancel_at_period_end")
    .in("listing_id", listingIds);

  const now = Date.now();
  const boosted = new Set(
    (promos ?? [])
      .filter(
        (p) =>
          p.status === "active" &&
          p.current_period_end &&
          new Date(p.current_period_end).getTime() > now
      )
      .map((p) => p.listing_id)
  );

  // TEMP: bypass typed schema for this one table name
  const raw = await (supabase as unknown as SupabaseClient)
    .from("listing_evaluations")
    .select("listing_id, status")
    .in("listing_id", listingIds);

  const evals = (raw.data ?? []) as ListingEvalRow[];
  const evalStatus = new Map(evals.map((e) => [e.listing_id, e.status]));

  return { boosted, evalStatus };
}
