// lib/matching/email/runDigestForRecipient.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import type {
  InvestorDigestRecipientRow,
  BusinessOwnerDigestRecipientRow,
} from "@/lib/matching/email/getDigestRecipients";

import { buildInvestorDigest } from "@/lib/matching/email/buildInvestorDigest";
import { buildBusinessOwnerDigest } from "@/lib/matching/email/buildBusinessOwnerDigest";
import { shouldSendDigest } from "@/lib/matching/email/shouldSendDigest";
import { sendMatchDigestEmail } from "@/lib/matching/email/sendMatchDigestEmail";
import { logDigestSend } from "@/lib/matching/email/logDigestSend";
import { logDigestSkip } from "@/lib/matching/email/logDigestSkip";
import { upsertMatchExposures } from "@/lib/matching/email/upsertMatchExposure";

export type RunDigestResult = {
  recipientType: "investor" | "business_owner";
  recipientUserId: string;
  outcome: "sent" | "skipped" | "failed";
  reason?: string;
  messageId?: string | null;
  subject?: string;
  matchCount?: number;
};

type CommonOptions = {
  appBaseUrl: string;
  dryRun?: boolean;
};

function mapSkipReason(
  reason:
    | "ok"
    | "no_email"
    | "no_matches"
    | "missing_payload"
    | "recipient_ineligible",
):
  | "no_strong_matches"
  | "no_email"
  | "missing_payload"
  | "recipient_ineligible"
  | "builder_returned_false" {
  if (reason === "no_matches") return "no_strong_matches";
  if (reason === "no_email") return "no_email";
  if (reason === "missing_payload") return "missing_payload";
  if (reason === "recipient_ineligible") return "recipient_ineligible";
  return "builder_returned_false";
}

export async function runInvestorDigestForRecipient(
  supabase: SupabaseClient<Database>,
  recipient: InvestorDigestRecipientRow,
  options: CommonOptions,
): Promise<RunDigestResult> {
  try {
    const digest = await buildInvestorDigest(supabase, recipient.userId, {
      appBaseUrl: options.appBaseUrl,
    });

    const decision = shouldSendDigest(digest);

    if (!decision.shouldSend) {
      await logDigestSkip(supabase, {
        recipientUserId: recipient.userId,
        recipientType: "investor",
        recipientEmail: recipient.email,
        reason: mapSkipReason(decision.reason),
        matchCount: Array.isArray(digest.matches) ? digest.matches.length : 0,
        notes: `Investor digest skipped. reason=${decision.reason}`,
      });

      return {
        recipientType: "investor",
        recipientUserId: recipient.userId,
        outcome: "skipped",
        reason: decision.reason,
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    if (options.dryRun) {
      return {
        recipientType: "investor",
        recipientUserId: recipient.userId,
        outcome: "sent",
        reason: "dry_run",
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    const sendResult = await sendMatchDigestEmail({
      recipientType: "investor",
      payload: digest,
    });

    if (!sendResult.success) {
      await logDigestSend(supabase, {
        recipientUserId: digest.recipient.userId,
        recipientType: "investor",
        recipientEmail: digest.recipient.email ?? recipient.email,
        subject: digest.subject,
        matchCount: digest.matches.length,
        featuredEntityId: digest.featuredMatch?.entity.listing.id ?? null,
        includedEntityIds: digest.matches.map((m) => m.entity.listing.id),
        status: "failed",
        providerMessageId: null,
        errorMessage: sendResult.error ?? "Unknown send error",
      });

      return {
        recipientType: "investor",
        recipientUserId: recipient.userId,
        outcome: "failed",
        reason: sendResult.error ?? "Unknown send error",
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    await logDigestSend(supabase, {
      recipientUserId: digest.recipient.userId,
      recipientType: "investor",
      recipientEmail: digest.recipient.email ?? recipient.email,
      subject: digest.subject,
      matchCount: digest.matches.length,
      featuredEntityId: digest.featuredMatch?.entity.listing.id ?? null,
      includedEntityIds: digest.matches.map((m) => m.entity.listing.id),
      status: "sent",
      providerMessageId: sendResult.messageId ?? null,
      errorMessage: null,
    });

    await upsertMatchExposures(
      supabase,
      digest.matches
        .map((match) => match.entity.listing.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
        .map((listingId) => ({
          recipientUserId: digest.recipient.userId,
          recipientType: "investor" as const,
          entityType: "listing" as const,
          entityId: listingId,
          matchedListingId: null,
        })),
    );

    return {
      recipientType: "investor",
      recipientUserId: recipient.userId,
      outcome: "sent",
      messageId: sendResult.messageId ?? null,
      subject: digest.subject,
      matchCount: digest.matches.length,
    };
  } catch (error) {
    return {
      recipientType: "investor",
      recipientUserId: recipient.userId,
      outcome: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "Unknown investor orchestrator error",
    };
  }
}

export async function runBusinessOwnerDigestForRecipient(
  supabase: SupabaseClient<Database>,
  recipient: BusinessOwnerDigestRecipientRow,
  options: CommonOptions,
): Promise<RunDigestResult> {
  try {
    const digest = await buildBusinessOwnerDigest(supabase, recipient.userId, {
      appBaseUrl: options.appBaseUrl,
      defaultRecipientEmail: recipient.email,
    });

    const decision = shouldSendDigest(digest);

    if (!decision.shouldSend) {
      await logDigestSkip(supabase, {
        recipientUserId: recipient.userId,
        recipientType: "business_owner",
        recipientEmail: recipient.email,
        reason: mapSkipReason(decision.reason),
        matchCount: Array.isArray(digest.matches) ? digest.matches.length : 0,
        notes: `Business owner digest skipped. reason=${decision.reason}`,
      });

      return {
        recipientType: "business_owner",
        recipientUserId: recipient.userId,
        outcome: "skipped",
        reason: decision.reason,
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    if (options.dryRun) {
      return {
        recipientType: "business_owner",
        recipientUserId: recipient.userId,
        outcome: "sent",
        reason: "dry_run",
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    const sendResult = await sendMatchDigestEmail({
      recipientType: "business_owner",
      payload: digest,
    });

    if (!sendResult.success) {
      await logDigestSend(supabase, {
        recipientUserId: digest.recipient.userId,
        recipientType: "business_owner",
        recipientEmail: digest.recipient.email ?? recipient.email,
        subject: digest.subject,
        matchCount: digest.matches.length,
        featuredEntityId: digest.featuredMatch?.entity.investor.id ?? null,
        includedEntityIds: digest.matches
          .map((m) => m.entity.investor.id)
          .filter(
            (id): id is string => typeof id === "string" && id.length > 0,
          ),
        status: "failed",
        providerMessageId: null,
        errorMessage: sendResult.error ?? "Unknown send error",
      });

      return {
        recipientType: "business_owner",
        recipientUserId: recipient.userId,
        outcome: "failed",
        reason: sendResult.error ?? "Unknown send error",
        subject: digest.subject,
        matchCount: digest.matches.length,
      };
    }

    await logDigestSend(supabase, {
      recipientUserId: digest.recipient.userId,
      recipientType: "business_owner",
      recipientEmail: digest.recipient.email ?? recipient.email,
      subject: digest.subject,
      matchCount: digest.matches.length,
      featuredEntityId: digest.featuredMatch?.entity.investor.id ?? null,
      includedEntityIds: digest.matches
        .map((m) => m.entity.investor.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
      status: "sent",
      providerMessageId: sendResult.messageId ?? null,
      errorMessage: null,
    });

    await upsertMatchExposures(
      supabase,
      digest.matches
        .map((match) => {
          const investorId = match.entity.investor.id;
          const listingId = match.entity.matchedListing.id;

          if (!investorId || !listingId) return null;

          return {
            recipientUserId: digest.recipient.userId,
            recipientType: "business_owner" as const,
            entityType: "investor" as const,
            entityId: investorId,
            matchedListingId: listingId,
          };
        })
        .filter((input): input is NonNullable<typeof input> => input !== null),
    );

    return {
      recipientType: "business_owner",
      recipientUserId: recipient.userId,
      outcome: "sent",
      messageId: sendResult.messageId ?? null,
      subject: digest.subject,
      matchCount: digest.matches.length,
    };
  } catch (error) {
    return {
      recipientType: "business_owner",
      recipientUserId: recipient.userId,
      outcome: "failed",
      reason:
        error instanceof Error
          ? error.message
          : "Unknown business owner orchestrator error",
    };
  }
}
