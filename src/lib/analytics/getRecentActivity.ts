// lib/analytics/getRecentActivity.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];
// type BusinessMembership = Database["public"]["Tables"]["business_memberships"]["Row"];
// type InvestorProfile = Database["public"]["Tables"]["investor_profiles"]["Row"];

export type Activity =
  | {
      id: string;
      type: "listing_created" | "listing_updated";
      at: string; // ISO
      meta: { listing_id: string; title: string | null; status?: string | null };
    }
  | {
      id: string;
      type: "membership_updated";
      at: string;
      meta: {
        plan_code: string;
        product_name: string;
        status: string;
        current_period_end: string;
      };
    }
  | {
      id: string;
      type: "profile_updated";
      at: string;
      meta: {
        primary_industry?: string | null;
        additional_industries?: string[] | null;
        status?: string | null;
      };
    };

/**
 * Returns a small, role-aware activity feed without N+1 queries.
 * - If `listings` is provided, we assume BUSINESS role and include listing + membership activity.
 * - Otherwise we assume INVESTOR role and include investor profile activity.
 *
 * This keeps one query per table, each ordered/limited.
 * Expand later (messages, saves, views) with more single-shot queries or an RPC.
 */
export async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
  listings?: Listing[]
): Promise<Activity[]> {
  // If the caller passed listings, we prioritize business activity
  if (Array.isArray(listings)) {
    const [
      // latest listing “created/updated” snapshots
      { data: latestListings },
      // latest membership change (if any)
      { data: memberships },
    ] = await Promise.all([
      supabase
        .from("business_listings")
        .select("id, title, status, created_at, updated_at")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false, nullsFirst: false })
        .limit(5),

      supabase
        .from("business_memberships")
        .select(
          "id, product_name, plan_code, status, current_period_end, updated_at, created_at"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(3),
    ]);

    const listingActivities: Activity[] = (latestListings ?? []).flatMap((l) => {
      const acts: Activity[] = [];
      // Treat created_at as "listing_created"
      if (l.created_at) {
        acts.push({
          id: `lc_${l.id}`,
          type: "listing_created",
          at: l.created_at,
          meta: { listing_id: l.id, title: l.title ?? null, status: l.status ?? null },
        });
      }
      // If updated_at differs from created_at, add "listing_updated"
      if (l.updated_at && l.updated_at !== l.created_at) {
        acts.push({
          id: `lu_${l.id}_${l.updated_at}`,
          type: "listing_updated",
          at: l.updated_at,
          meta: { listing_id: l.id, title: l.title ?? null, status: l.status ?? null },
        });
      }
      return acts;
    });

    const membershipActivities: Activity[] = (memberships ?? []).map((m) => ({
      id: `m_${m.id}`,
      type: "membership_updated",
      at: m.updated_at ?? m.created_at,
      meta: {
        plan_code: m.plan_code,
        product_name: m.product_name,
        status: m.status,
        current_period_end: m.current_period_end,
      },
    }));

    // Merge, sort by time desc, and trim to a small feed
    return [...listingActivities, ...membershipActivities]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 10);
  }

  // INVESTOR: show profile changes (you can add “saved listings” or messages later)
  const { data: profile } = await supabase
    .from("investor_profiles")
    .select(
      "id, updated_at, created_at, primary_industry, additional_industries, status"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return [];

  const acts: Activity[] = [];

  if (profile.created_at) {
    acts.push({
      id: `ipc_${profile.id}`,
      type: "profile_updated",
      at: profile.created_at,
      meta: {
        primary_industry: profile.primary_industry,
        additional_industries: profile.additional_industries,
        status: profile.status,
      },
    });
  }

  if (profile.updated_at && profile.updated_at !== profile.created_at) {
    acts.push({
      id: `ipu_${profile.id}_${profile.updated_at}`,
      type: "profile_updated",
      at: profile.updated_at,
      meta: {
        primary_industry: profile.primary_industry,
        additional_industries: profile.additional_industries,
        status: profile.status,
      },
    });
  }

  return acts.slice(0, 10);
}
