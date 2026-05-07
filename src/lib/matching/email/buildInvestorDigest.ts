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

type MatchExposureRow = {
  recipient_user_id: string;
  recipient_type: "investor" | "business_owner";
  entity_type: "listing" | "investor";
  entity_id: string;
  matched_listing_id: string | null;
  first_seen_at: string | null;
  last_seen_at: string | null;
  last_emailed_at: string | null;
  dismissed_at: string | null;
  contacted_at: string | null;
};

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
  const cleanCity = city?.trim();
  const cleanCounty = county?.trim();
  const cleanState = stateCode?.trim();

  if (cleanCity && cleanState) return `${cleanCity}, ${cleanState}`;
  if (cleanCity) return cleanCity;

  if (cleanCounty && cleanState) return `${cleanCounty} County, ${cleanState}`;
  if (cleanCounty) return `${cleanCounty} County`;

  if (cleanState) return cleanState;

  return null;
}

function cleanText(value?: string | null): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function truncateText(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3).trim()}...`;
}

function buildListingTeaser(listing: ListingCandidate): string | null {
  const cleanedDescription = cleanText(listing.description);

  if (cleanedDescription.length >= 40) {
    return truncateText(cleanedDescription, 160);
  }

  const parts: string[] = [];

  if (listing.industry) {
    parts.push(`${listing.industry} business`);
  } else {
    parts.push("Business opportunity");
  }

  const location = formatLocation(listing.city, listing.county, listing.state_code);
  if (location) {
    parts.push(`located in ${location}`);
  }

  if (listing.annual_revenue_range) {
    parts.push(`with revenue profile in the ${listing.annual_revenue_range} range`);
  } else if (listing.ebitda_range) {
    parts.push(`with EBITDA in the ${listing.ebitda_range} range`);
  } else if (listing.cash_flow_range) {
    parts.push(`with cash flow in the ${listing.cash_flow_range} range`);
  }

  return truncateText(`${parts.join(" ")}.`, 160);
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
  const reviewMatchesHref = `${appBaseUrl}/member/match-digest`;

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
      primaryCtaHref: reviewMatchesHref,
      featuredMatch: null,
      matches: [],
      totalQualified: 0,
      debug: {
        investorUserId,
        candidateCount: 0,
      },
    };
  }

  // Phase 1/2 guardrails
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
      primaryCtaHref: reviewMatchesHref,
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
  const listingIds = listings.map((listing) => listing.id).filter(Boolean);

  // 3) Pull exposure history for this investor -> listing relationship
  const exposureByListingId = new Map<string, MatchExposureRow>();

  if (listingIds.length > 0) {
    const { data: exposuresRaw, error: exposuresErr } = await supabase
      .from("match_exposures")
      .select(
        `
          recipient_user_id,
          recipient_type,
          entity_type,
          entity_id,
          matched_listing_id,
          first_seen_at,
          last_seen_at,
          last_emailed_at,
          dismissed_at,
          contacted_at
        `
      )
      .eq("recipient_user_id", investor.user_id)
      .eq("recipient_type", "investor")
      .eq("entity_type", "listing")
      .in("entity_id", listingIds);

    if (exposuresErr) throw exposuresErr;

    const exposures = (exposuresRaw ?? []) as MatchExposureRow[];

    for (const exposure of exposures) {
      if (!exposure.entity_id) continue;
      exposureByListingId.set(exposure.entity_id, exposure);
    }
  }

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

  // 4) Score candidates + attach exposure state
  const scoredCandidates = listings.map((listing) => {
    const matchMeta = scoreBusinessForInvestor(
      listing as ListingForScoring,
      investorForScoring
    );

    const exposure = exposureByListingId.get(listing.id);

    const entity: InvestorDigestMatchEntity = {
      listing,
      teaser: buildListingTeaser(listing),
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
      isPreviouslySeen: Boolean(exposure?.last_seen_at || exposure?.first_seen_at),
      exposure: exposure
        ? {
            firstSeenAt: exposure.first_seen_at,
            lastSeenAt: exposure.last_seen_at,
            lastEmailedAt: exposure.last_emailed_at,
            dismissedAt: exposure.dismissed_at,
            contactedAt: exposure.contacted_at,
          }
        : undefined,
    };
  });

  // 5) Select digest set using Phase 2 exposure-aware selector
  const digest = selectDigestMatches(scoredCandidates, {
    maxMatches: 3,
    preferUnseen: true,
    reemailCooldownDays: 7,
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
    primaryCtaHref: reviewMatchesHref,
    featuredMatch: digest.featuredMatch,
    matches: digest.matches,
    totalQualified: digest.totalQualified,
    debug: {
      investorUserId,
      candidateCount: listings.length,
    },
  };
}