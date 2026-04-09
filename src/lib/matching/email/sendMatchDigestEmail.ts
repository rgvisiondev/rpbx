// lib/matching/email/sendMatchDigestEmail.ts
import * as React from "react";
import InvestorMatchDigestEmail from "../../../../emails/InvestorMatchDigestEmail";
import BusinessOwnerMatchDigestEmail from "../../../../emails/BusinessOwnerMatchDigestEmail";
import { getResendClient, getEmailFrom } from "@/lib/resend";
import type { InvestorDigestPayload } from "@/lib/matching/email/buildInvestorDigest";
import type { BusinessOwnerDigestPayload } from "@/lib/matching/email/buildBusinessOwnerDigest";

export type SendMatchDigestResult = {
  success: boolean;
  messageId?: string | null;
  error?: string;
};

type InvestorSendInput = {
  recipientType: "investor";
  payload: InvestorDigestPayload;
};

type BusinessOwnerSendInput = {
  recipientType: "business_owner";
  payload: BusinessOwnerDigestPayload;
};

export type SendMatchDigestInput = InvestorSendInput | BusinessOwnerSendInput;

function hasEmail(email?: string | null): email is string {
  return typeof email === "string" && email.trim().length > 0;
}

export async function sendMatchDigestEmail(
  input: SendMatchDigestInput
): Promise<SendMatchDigestResult> {
  const resend = getResendClient();
  const from = getEmailFrom();

  if (input.recipientType === "investor") {
    const { payload } = input;

    if (!hasEmail(payload.recipient.email)) {
      return {
        success: false,
        error: "Missing investor recipient email.",
      };
    }

    try {
      const response = await resend.emails.send({
        from,
        to: payload.recipient.email,
        subject: payload.subject,
        react: React.createElement(InvestorMatchDigestEmail, {
          firstName: payload.recipient.firstName,
          reviewMatchesUrl: payload.primaryCtaHref,
          previewText: payload.preheader,
          matches: payload.matches,
        }),
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        messageId: response.data?.id ?? null,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown investor digest send error.",
      };
    }
  }

  const { payload } = input;

  if (!hasEmail(payload.recipient.email)) {
    return {
      success: false,
      error: "Missing business owner recipient email.",
    };
  }

  try {
    const response = await resend.emails.send({
      from,
      to: payload.recipient.email,
      subject: payload.subject,
      react: React.createElement(BusinessOwnerMatchDigestEmail, {
        firstName: payload.recipient.firstName,
        reviewMatchesUrl: payload.primaryCtaHref,
        previewText: payload.preheader,
        matches: payload.matches,
      }),
    });

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      };
    }

    return {
      success: true,
      messageId: response.data?.id ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown business owner digest send error.",
    };
  }
}