// lib/matching/email/logDigestSkip.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type DigestSkipRecipientType = "investor" | "business_owner";

export type DigestSkipReason =
  | "no_strong_matches"
  | "no_email"
  | "missing_payload"
  | "recipient_ineligible"
  | "builder_returned_false"
  | "unknown";

export type LogDigestSkipInput = {
  recipientUserId: string;
  recipientType: DigestSkipRecipientType;
  recipientEmail?: string | null;
  reason: DigestSkipReason;
  matchCount?: number | null;
  notes?: string | null;
  skippedAt?: string;
};

export type LogDigestSkipResult = {
  success: boolean;
  error?: string;
};

export async function logDigestSkip(
  supabase: SupabaseClient<Database>,
  input: LogDigestSkipInput
): Promise<LogDigestSkipResult> {
  const payload = {
    recipient_user_id: input.recipientUserId,
    recipient_type: input.recipientType,
    recipient_email: input.recipientEmail ?? null,
    reason: input.reason,
    match_count: input.matchCount ?? 0,
    notes: input.notes ?? null,
    skipped_at: input.skippedAt ?? new Date().toISOString(),
  };

  const { error } = await supabase.from("match_digest_skips").insert(payload);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
  };
}