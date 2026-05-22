export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClientWritable } from "@/../utils/supabase/server";
import { getInvestorBioFromProfile } from "@/lib/openai-query";

function createLimit() {
  const redis = Redis.fromEnv();

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "5 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });

  return ratelimit;
}

function cleanString(value: unknown, maxLength = 3000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems = 10) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems);
  }

  return [];
}

export async function POST(req: Request) {
  try {
    const ratelimit = createLimit();
    const supabase = await createClientWritable();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();

    const firstName = cleanString(body?.firstName, 80);
    const lastName = cleanString(body?.lastName, 80);
    const organizationEntity = cleanString(body?.organizationEntity, 120);
    const city = cleanString(body?.city, 80);
    const stateCode = cleanString(body?.stateCode, 20);

    const professionalSummary = cleanString(body?.professionalSummary, 4000);
    const investmentFocus = cleanString(body?.investmentFocus, 2000);
    const experienceLevel = cleanString(body?.experienceLevel, 500);
    const goals = cleanString(body?.goals, 1200);

    const preferredIndustries = cleanStringArray(body?.preferredIndustries);
    const willingToSignNda =
      typeof body?.willingToSignNda === "boolean"
        ? body.willingToSignNda
        : null;

    const hasEnoughInput =
      professionalSummary.length >= 40 ||
      investmentFocus.length >= 30 ||
      goals.length >= 30 ||
      organizationEntity.length > 0 ||
      preferredIndustries.length > 0;

    if (!hasEnoughInput) {
      return NextResponse.json(
        {
          error:
            "Add a short professional summary, investment focus, organization, or preferred industries before generating a bio.",
        },
        { status: 400 },
      );
    }

    const identifier =
      user?.id ||
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      "anonymous";

    const { success, reset, limit, remaining } =
      await ratelimit.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Rate limit reached, try again later",
          reset,
          remaining,
          limit,
        },
        { status: 429 },
      );
    }

    const bio = await getInvestorBioFromProfile({
      firstName,
      lastName,
      organizationEntity,
      city,
      stateCode,
      professionalSummary,
      investmentFocus,
      preferredIndustries,
      experienceLevel,
      goals,
      willingToSignNda,
    });

    return NextResponse.json({ bio });
  } catch (err) {
    console.error("API /ai/investor-bio error", err);

    return NextResponse.json(
      { error: "Failed to generate investor bio" },
      { status: 500 },
    );
  }
}