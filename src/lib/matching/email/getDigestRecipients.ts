// lib/matching/email/getDigestRecipients.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type InvestorDigestRecipientRow = {
  userId: string;
  profileId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  recipientType: "investor";
};

export type BusinessOwnerDigestRecipientRow = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  activeListingCount: number;
  recipientType: "business_owner";
};

export type GetDigestRecipientsResult = {
  investors: InvestorDigestRecipientRow[];
  businessOwners: BusinessOwnerDigestRecipientRow[];
};

type RecipientOptions = {
  limit?: number;
};

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function getInvestorDigestRecipients(
  supabase: SupabaseClient<Database>,
  options: RecipientOptions = {}
): Promise<InvestorDigestRecipientRow[]> {
  const { limit } = options;

  const query = supabase
    .from("investor_profiles")
    .select(`
      id,
      user_id,
      contact_email,
      first_name,
      last_name,
      status,
      is_hidden
    `)
    .eq("status", "published")
    .eq("is_hidden", false);

  const { data, error } = limit
    ? await query.limit(limit)
    : await query;

  if (error) throw error;

  return (data ?? [])
    .filter((row) => isNonEmptyString(row.user_id))
    .filter((row) => isNonEmptyString(row.id))
    .filter((row) => isNonEmptyString(row.contact_email))
    .map((row) => ({
      userId: row.user_id,
      profileId: row.id,
      email: row.contact_email!.trim(),
      firstName: row.first_name,
      lastName: row.last_name,
      recipientType: "investor" as const,
    }));
}

export async function getBusinessOwnerDigestRecipients(
  supabase: SupabaseClient<Database>,
  options: RecipientOptions = {}
): Promise<BusinessOwnerDigestRecipientRow[]> {
  const { limit } = options;

  const listingQuery = supabase
    .from("business_listings")
    .select(`
      owner_id,
      contact_email
    `)
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  const { data: listings, error: listingsError } = limit
    ? await listingQuery.limit(limit * 5) // rough buffer since many rows may collapse to one owner
    : await listingQuery;

  if (listingsError) throw listingsError;

  const listingRows = (listings ?? []).filter(
    (row) => isNonEmptyString(row.owner_id) && isNonEmptyString(row.contact_email)
  );

  const byOwner = new Map<
    string,
    { email: string; activeListingCount: number }
  >();

  for (const row of listingRows) {
    const ownerId = row.owner_id!;
    const email = row.contact_email!.trim();

    const existing = byOwner.get(ownerId);
    if (!existing) {
      byOwner.set(ownerId, {
        email,
        activeListingCount: 1,
      });
    } else {
      existing.activeListingCount += 1;
    }
  }

  const ownerIds = Array.from(byOwner.keys());
  if (ownerIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, user_type")
    .in("id", ownerIds);

  if (profilesError) throw profilesError;

  const results: BusinessOwnerDigestRecipientRow[] = (profiles ?? [])
    .filter((profile) => isNonEmptyString(profile.id))
    .filter((profile) => byOwner.has(profile.id))
    .map((profile) => {
      const ownerMeta = byOwner.get(profile.id)!;
      return {
        userId: profile.id,
        email: ownerMeta.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        activeListingCount: ownerMeta.activeListingCount,
        recipientType: "business_owner" as const,
      };
    });

  return limit ? results.slice(0, limit) : results;
}

export async function getDigestRecipients(
  supabase: SupabaseClient<Database>,
  options: RecipientOptions = {}
): Promise<GetDigestRecipientsResult> {
  const [investors, businessOwners] = await Promise.all([
    getInvestorDigestRecipients(supabase, options),
    getBusinessOwnerDigestRecipients(supabase, options),
  ]);

  return {
    investors,
    businessOwners,
  };
}