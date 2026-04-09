// lib/matching/buildInvestorDigest.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  scoreBusinessForInvestor,
  type InvestorForScoring,
  type ListingForScoring,
} from "@/lib/matching/email/scoreBusinessForInvestor";
import {
  selectDigestMatches,
  type DigestSelectionResult,
} from "@/lib/matching/email/selectDigestMatches";

type InvestorProfile = Pick<
  Database["public"]["Tables"]["investor_profiles"]["Row"],
  | "id"
  | "user_id"
  | "contact_email"
  | "first_name"
  | "last_name"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "city"
  | "status"
  | "is_hidden"
  | "updated_at"
  | "created_at"
>;

type ListingCandidate = Pick<
  Database["public"]["Tables"]["business_listings"]["Row"],
  | "id"
  | "owner_id"
  | "title"
  | "industry"
  | "city"
  | "county"
  | "state_code"
  | "description"
  | "status"
  | "is_active"
  | "is_hidden"
  | "ebitda_range"
  | "cash_flow_range"
  | "annual_revenue_range"
  | "listing_image_choice"
  | "listing_image_path"
  | "listing_image_alt"
  | "created_at"
  | "updated_at"
>;

export type InvestorDigestMatchEntity = {
  listing: ListingCandidate;
  teaser: string | null;
  displayLocation: string | null;
};

export type InvestorDigestRecipient = {
  userId: string;
  profileId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

export type InvestorDigestPayload = {
  shouldSend: boolean;
  recipient: InvestorDigestRecipient;
  subject: string;
  preheader: string;
  headline: string;
  intro: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  featuredMatch: DigestSelectionResult<InvestorDigestMatchEntity>["featuredMatch"];
  matches: DigestSelectionResult<InvestorDigestMatchEntity>["matches"];
  totalQualified: number;
  debug?: {
    investorUserId: string;
    candidateCount: number;
  };
};

function formatLocation(
  city?: string | null,
  county?: string | null,
  stateCode?: string | null
): string | null {
  const parts = [city, county, stateCode].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function buildListingTeaser(description?: string | null): string | null {
  if (!description) return null;
  const cleaned = description.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 160) return cleaned;
  return `${cleaned.slice(0, 157)}...`;
}

function buildInvestorSubject(firstName?: string | null): string {
  return firstName
    ? `${firstName}, new business matches for your criteria`
    : "New business matches for your criteria";
}

function buildInvestorIntro(firstName?: string | null): string {
  return firstName
    ? `Hi ${firstName}, we found business opportunities on RPBX that align with your profile and target criteria.`
    : "We found business opportunities on RPBX that align with your profile and target criteria.";
}

export async function buildInvestorDigest(
  supabase: SupabaseClient<Database>,
  investorUserId: string,
  options?: {
    appBaseUrl?: string;
  }
): Promise<InvestorDigestPayload> {
  const appBaseUrl = options?.appBaseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // 1) Load investor profile
  const { data: investor, error: investorErr } = await supabase
    .from("investor_profiles")
    .select(
      `
        id,
        user_id,
        contact_email,
        first_name,
        last_name,
        primary_industry,
        additional_industries,
        target_ebitda,
        target_cash_flow,
        city,
        status,
        is_hidden,
        updated_at,
        created_at
      `
    )
    .eq("user_id", investorUserId)
    .maybeSingle<InvestorProfile>();

  if (investorErr) throw investorErr;

  if (!investor) {
    return {
      shouldSend: false,
      recipient: {
        userId: investorUserId,
        profileId: "",
        email: null,
        firstName: null,
        lastName: null,
      },
      subject: "New business matches for your criteria",
      preheader: "No eligible investor profile found.",
      headline: "New business matches on RioPlex",
      intro: "No eligible investor profile found.",
      primaryCtaLabel: "Review Matches",
      primaryCtaHref: `${appBaseUrl}/member/matches`,
      featuredMatch: null,
      matches: [],
      totalQualified: 0,
      debug: {
        investorUserId,
        candidateCount: 0,
      },
    };
  }

  // Phase 1 guardrails
  if (investor.is_hidden || investor.status !== "published") {
    return {
      shouldSend: false,
      recipient: {
        userId: investor.user_id,
        profileId: investor.id,
        email: investor.contact_email,
        firstName: investor.first_name,
        lastName: investor.last_name,
      },
      subject: buildInvestorSubject(investor.first_name),
      preheader: "Investor profile is not eligible for match emails.",
      headline: "New business matches on RioPlex",
      intro: "Investor profile is not eligible for match emails.",
      primaryCtaLabel: "Review Matches",
      primaryCtaHref: `${appBaseUrl}/member/matches`,
      featuredMatch: null,
      matches: [],
      totalQualified: 0,
      debug: {
        investorUserId,
        candidateCount: 0,
      },
    };
  }

  // 2) Pull active/published listings
  const { data: listingsRaw, error: listingsErr } = await supabase
    .from("business_listings")
    .select(
      `
        id,
        owner_id,
        title,
        industry,
        city,
        county,
        state_code,
        description,
        status,
        is_active,
        is_hidden,
        ebitda_range,
        cash_flow_range,
        annual_revenue_range,
        listing_image_choice,
        listing_image_path,
        listing_image_alt,
        created_at,
        updated_at
      `
    )
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  if (listingsErr) throw listingsErr;

  const listings = (listingsRaw ?? []) as ListingCandidate[];

  const investorForScoring: InvestorForScoring = {
    user_id: investor.user_id,
    primary_industry: investor.primary_industry,
    additional_industries: investor.additional_industries,
    target_ebitda: investor.target_ebitda,
    target_cash_flow: investor.target_cash_flow,
    city: investor.city,
    status: investor.status,
    updated_at: investor.updated_at,
    created_at: investor.created_at,
  };

  // 3) Score candidates
  const scoredCandidates = listings.map((listing) => {
    const matchMeta = scoreBusinessForInvestor(
      listing as ListingForScoring,
      investorForScoring
    );

    const entity: InvestorDigestMatchEntity = {
      listing,
      teaser: buildListingTeaser(listing.description),
      displayLocation: formatLocation(listing.city, listing.county, listing.state_code),
    };

    return {
      entity,
      score: matchMeta.score,
      tier: matchMeta.tier,
      reasons: matchMeta.reasons,
      reasonCodes: matchMeta.reasonCodes,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      dedupeKey: listing.id,
      isPreviouslySeen: false, // Phase 2 will replace this with exposure logic
    };
  });

  // 4) Select digest set
  const digest = selectDigestMatches(scoredCandidates, {
    maxMatches: 3,
    preferUnseen: true,
  });

  return {
    shouldSend: digest.shouldSend,
    recipient: {
      userId: investor.user_id,
      profileId: investor.id,
      email: investor.contact_email,
      firstName: investor.first_name,
      lastName: investor.last_name,
    },
    subject: buildInvestorSubject(investor.first_name),
    preheader: "Curated business opportunities aligned with your profile.",
    headline: "New business matches on RioPlex",
    intro: buildInvestorIntro(investor.first_name),
    primaryCtaLabel: "Review Matches",
    primaryCtaHref: `${appBaseUrl}/member/matches`,
    featuredMatch: digest.featuredMatch,
    matches: digest.matches,
    totalQualified: digest.totalQualified,
    debug: {
      investorUserId,
      candidateCount: listings.length,
    },
  };
}