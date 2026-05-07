// lib/matching/email/upsertMatchExposure.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type MatchExposureRecipientType = "investor" | "business_owner";
export type MatchExposureEntityType = "listing" | "investor";

export type UpsertMatchExposureInput = {
  recipientUserId: string;
  recipientType: MatchExposureRecipientType;
  entityType: MatchExposureEntityType;
  entityId: string;
  matchedListingId?: string | null;
  seenAt?: string;
};

export type UpsertMatchExposuresResult = {
  success: boolean;
  updatedCount: number;
  errors: string[];
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function upsertMatchExposures(
  supabase: SupabaseClient<Database>,
  inputs: UpsertMatchExposureInput[]
): Promise<UpsertMatchExposuresResult> {
  const errors: string[] = [];
  let updatedCount = 0;

  const validInputs = inputs.filter(
    (input) =>
      isNonEmptyString(input.recipientUserId) &&
      isNonEmptyString(input.entityId)
  );

  for (const input of validInputs) {
    const now = input.seenAt ?? new Date().toISOString();
    const matchedListingId = input.matchedListingId ?? null;

    let query = supabase
      .from("match_exposures")
      .select("id, first_seen_at")
      .eq("recipient_user_id", input.recipientUserId)
      .eq("recipient_type", input.recipientType)
      .eq("entity_type", input.entityType)
      .eq("entity_id", input.entityId);

    query = matchedListingId
      ? query.eq("matched_listing_id", matchedListingId)
      : query.is("matched_listing_id", null);

    const { data: existing, error: selectError } = await query.maybeSingle();

    if (selectError) {
      errors.push(selectError.message);
      continue;
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("match_exposures")
        .update({
          first_seen_at: existing.first_seen_at ?? now,
          last_seen_at: now,
          last_emailed_at: now,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (updateError) {
        errors.push(updateError.message);
        continue;
      }

      updatedCount += 1;
      continue;
    }

    const { error: insertError } = await supabase
      .from("match_exposures")
      .insert({
        recipient_user_id: input.recipientUserId,
        recipient_type: input.recipientType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        matched_listing_id: matchedListingId,
        first_seen_at: now,
        last_seen_at: now,
        last_emailed_at: now,
        created_at: now,
        updated_at: now,
      });

    if (insertError) {
      errors.push(insertError.message);
      continue;
    }

    updatedCount += 1;
  }

  return {
    success: errors.length === 0,
    updatedCount,
    errors,
  };
}