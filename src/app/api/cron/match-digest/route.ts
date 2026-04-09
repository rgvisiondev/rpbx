// app/api/cron/match-digest/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

import { getDigestRecipients } from "@/lib/matching/email/getDigestRecipients";
import {
  runInvestorDigestForRecipient,
  runBusinessOwnerDigestForRecipient,
} from "@/lib/matching/email/runDigestForRecipient";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isAuthorizedCron(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    throw new Error("Missing CRON_SECRET.");
  }

  return authHeader === `Bearer ${expected}`;
}

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function parseBooleanFlag(value: string | null): boolean {
  if (!value) return false;
  return value === "1" || value.toLowerCase() === "true";
}

function getOnlyFilter(value: string | null): "all" | "investors" | "business_owners" {
  if (value === "investors") return "investors";
  if (value === "business_owners") return "business_owners";
  return "all";
}

export async function GET(req: NextRequest) {
  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminSupabase();

    const url = new URL(req.url);
    const limit = parsePositiveInt(url.searchParams.get("limit"));
    const dryRun = parseBooleanFlag(url.searchParams.get("dryRun"));
    const only = getOnlyFilter(url.searchParams.get("only"));
    const appBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const recipients = await getDigestRecipients(supabase, { limit });

    const summary = {
      dryRun,
      only,
      investors: {
        considered: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      },
      businessOwners: {
        considered: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
      },
      errors: [] as Array<{
        recipientType: "investor" | "business_owner";
        recipientUserId: string;
        error: string;
      }>,
    };

    if (only === "all" || only === "investors") {
      for (const recipient of recipients.investors) {
        summary.investors.considered += 1;

        const result = await runInvestorDigestForRecipient(supabase, recipient, {
          appBaseUrl,
          dryRun,
        });

        if (result.outcome === "sent") summary.investors.sent += 1;
        if (result.outcome === "skipped") summary.investors.skipped += 1;
        if (result.outcome === "failed") {
          summary.investors.failed += 1;
          summary.errors.push({
            recipientType: "investor",
            recipientUserId: result.recipientUserId,
            error: result.reason ?? "Unknown investor failure",
          });
        }
      }
    }

    if (only === "all" || only === "business_owners") {
      for (const recipient of recipients.businessOwners) {
        summary.businessOwners.considered += 1;

        const result = await runBusinessOwnerDigestForRecipient(supabase, recipient, {
          appBaseUrl,
          dryRun,
        });

        if (result.outcome === "sent") summary.businessOwners.sent += 1;
        if (result.outcome === "skipped") summary.businessOwners.skipped += 1;
        if (result.outcome === "failed") {
          summary.businessOwners.failed += 1;
          summary.errors.push({
            recipientType: "business_owner",
            recipientUserId: result.recipientUserId,
            error: result.reason ?? "Unknown business owner failure",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown cron route error",
      },
      { status: 500 }
    );
  }
}