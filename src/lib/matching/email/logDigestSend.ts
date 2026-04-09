// lib/matching/email/logDigestSend.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";

export type DigestRecipientType = "investor" | "business_owner";

export type LogDigestSendInput = {
  recipientUserId: string;
  recipientType: DigestRecipientType;
  recipientEmail: string;
  subject: string;
  matchCount: number;
  featuredEntityId?: string | null;
  includedEntityIds: string[];
  status: "sent" | "failed";
  providerMessageId?: string | null;
  errorMessage?: string | null;
  sentAt?: string;
};

type LogDigestSendResult = {
  success: boolean;
  error?: string;
};

function toJsonArray(values: string[]): Json {
  return values;
}

export async function logDigestSend(
  supabase: SupabaseClient<Database>,
  input: LogDigestSendInput
): Promise<LogDigestSendResult> {
  const payload = {
    recipient_user_id: input.recipientUserId,
    recipient_type: input.recipientType,
    recipient_email: input.recipientEmail,
    subject: input.subject,
    match_count: input.matchCount,
    featured_entity_id: input.featuredEntityId ?? null,
    included_entity_ids: toJsonArray(input.includedEntityIds),
    sent_at: input.sentAt ?? new Date().toISOString(),
    status: input.status,
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
  };

  const { error } = await supabase.from("match_digest_sends").insert(payload);

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