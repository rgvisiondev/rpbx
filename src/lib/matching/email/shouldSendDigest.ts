// lib/matching/email/shouldSendDigest.ts

export type DigestSendBlockReason =
  | "ok"
  | "no_email"
  | "no_matches"
  | "missing_payload"
  | "recipient_ineligible";

export type DigestSendDecision = {
  shouldSend: boolean;
  reason: DigestSendBlockReason;
};

type MinimalDigestPayload = {
  shouldSend?: boolean;
  recipient?: {
    email?: string | null;
  } | null;
  matches?: unknown[] | null;
};

function hasNonEmptyEmail(email?: string | null): boolean {
  return typeof email === "string" && email.trim().length > 0;
}

export function shouldSendDigest(
  payload: MinimalDigestPayload | null | undefined
): DigestSendDecision {
  if (!payload) {
    return {
      shouldSend: false,
      reason: "missing_payload",
    };
  }

  if (!hasNonEmptyEmail(payload.recipient?.email)) {
    return {
      shouldSend: false,
      reason: "no_email",
    };
  }

  if (payload.shouldSend !== true) {
    return {
      shouldSend: false,
      reason: "recipient_ineligible",
    };
  }

  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  if (matches.length === 0) {
    return {
      shouldSend: false,
      reason: "no_matches",
    };
  }

  return {
    shouldSend: true,
    reason: "ok",
  };
}