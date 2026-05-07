// lib/matching/buildBusinessOwnerDigest.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  scoreInvestorForBusiness,
  type ListingForInvestorScoring,
  type InvestorForBusinessScoring,
} from "@/lib/matching/email/scoreInvestorForBusiness";
import {
  selectDigestMatches,
  type DigestSelectionResult,
} from "@/lib/matching/email/selectDigestMatches";

type OwnerProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "display_name" | "user_type"
>;

type OwnerListing = Pick<
  Database["public"]["Tables"]["business_listings"]["Row"],
  | "id"
  | "owner_id"
  | "title"
  | "industry"
  | "city"
  | "county"
  | "state_code"
  | "status"
  | "is_active"
  | "is_hidden"
  | "contact_email"
  | "ebitda_range"
  | "cash_flow_range"
  | "annual_revenue_range"
  | "updated_at"
  | "created_at"
>;

type InvestorCandidate = Pick<
  Database["public"]["Views"]["v_investor_profiles_public"]["Row"],
  | "id"
  | "user_id"
  | "first_name"
  | "last_name"
  | "contact_email"
  | "primary_industry"
  | "additional_industries"
  | "target_ebitda"
  | "target_cash_flow"
  | "city"
  | "bio"
  | "organization_entity"
  | "ownership_min"
  | "ownership_max"
  | "status"
  | "is_hidden"
  | "has_paid_access"
  | "updated_at"
  | "created_at"
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

export type BusinessOwnerDigestMatchEntity = {
  investor: InvestorCandidate;
  matchedListing: OwnerListing;
  investorDisplayName: string;
  displayLocation: string | null;
  teaser: string | null;
};

export type BusinessOwnerDigestRecipient = {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  listingIds: string[];
};

export type BusinessOwnerDigestPayload = {
  shouldSend: boolean;
  recipient: BusinessOwnerDigestRecipient;
  subject: string;
  preheader: string;
  headline: string;
  intro: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  featuredMatch: DigestSelectionResult<BusinessOwnerDigestMatchEntity>["featuredMatch"];
  matches: DigestSelectionResult<BusinessOwnerDigestMatchEntity>["matches"];
  totalQualified: number;
  debug?: {
    ownerUserId: string;
    listingCount: number;
    investorCandidateCount: number;
  };
};

function formatLocation(
  city?: string | null,
  county?: string | null,
  stateCode?: string | null,
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

function buildInvestorDisplayName(investor: InvestorCandidate): string {
  const fullName = [investor.first_name, investor.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (investor.organization_entity) return investor.organization_entity;
  return "Investor Profile";
}

function buildInvestorTeaser(investor: InvestorCandidate): string | null {
  const cleanedBio = cleanText(investor.bio);

  if (cleanedBio.length >= 40) {
    return truncateText(cleanedBio, 160);
  }

  const parts: string[] = ["Active investor profile"];

  const industryLabel =
    investor.primary_industry ?? investor.additional_industries?.[0] ?? null;

  if (industryLabel) {
    parts.push(`with interest in ${industryLabel.toLowerCase()} opportunities`);
  }

  if (investor.target_ebitda) {
    parts.push(`targeting EBITDA in the ${investor.target_ebitda} range`);
  } else if (investor.target_cash_flow) {
    parts.push(`targeting cash flow in the ${investor.target_cash_flow} range`);
  }

  if (investor.has_paid_access) {
    parts.push("with active paid access");
  }

  return truncateText(`${parts.join(" ")}.`, 160);
}

function buildBusinessOwnerSubject(firstName?: string | null): string {
  return firstName
    ? `${firstName}, investors are matching your business profile`
    : "Investors are matching your business profile";
}

function buildBusinessOwnerIntro(firstName?: string | null): string {
  return firstName
    ? `Hi ${firstName}, we found investor profiles on RPBX that align with one or more of your active listings.`
    : "We found investor profiles on RPBX that align with one or more of your active listings.";
}

function buildExposureKey(entityId: string, listingId: string): string {
  return `${entityId}::${listingId}`;
}

export async function buildBusinessOwnerDigest(
  supabase: SupabaseClient<Database>,
  ownerUserId: string,
  options?: {
    appBaseUrl?: string;
    defaultRecipientEmail?: string | null;
  },
): Promise<BusinessOwnerDigestPayload> {
  const appBaseUrl =
    options?.appBaseUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const reviewMatchesHref = `${appBaseUrl}/member/match-digest`;

  // 1) Load owner profile
  const { data: ownerProfile, error: ownerProfileErr } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, display_name, user_type")
    .eq("id", ownerUserId)
    .maybeSingle<OwnerProfile>();

  if (ownerProfileErr) throw ownerProfileErr;

  // 2) Load owner's eligible listings
  const { data: ownerListingsRaw, error: ownerListingsErr } = await supabase
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
        status,
        is_active,
        is_hidden,
        contact_email,
        ebitda_range,
        cash_flow_range,
        annual_revenue_range,
        updated_at,
        created_at
      `,
    )
    .eq("owner_id", ownerUserId)
    .eq("status", "published")
    .eq("is_active", true)
    .eq("is_hidden", false);

  if (ownerListingsErr) throw ownerListingsErr;

  const ownerListings = (ownerListingsRaw ?? []) as OwnerListing[];

  const recipientEmail =
    ownerListings.find((l) => l.contact_email)?.contact_email ??
    options?.defaultRecipientEmail ??
    null;

  if (ownerListings.length === 0) {
    return {
      shouldSend: false,
      recipient: {
        userId: ownerUserId,
        email: recipientEmail,
        firstName: ownerProfile?.first_name ?? null,
        lastName: ownerProfile?.last_name ?? null,
        listingIds: [],
      },
      subject: buildBusinessOwnerSubject(ownerProfile?.first_name),
      preheader: "No eligible active listings found.",
      headline: "New investor matches on RioPlex",
      intro: "No eligible active listings found.",
      primaryCtaLabel: "Review Matches",
      primaryCtaHref: reviewMatchesHref,
      featuredMatch: null,
      matches: [],
      totalQualified: 0,
      debug: {
        ownerUserId,
        listingCount: 0,
        investorCandidateCount: 0,
      },
    };
  }

  // 3) Load public investor candidates
  const { data: investorsRaw, error: investorsErr } = await supabase
    .from("v_investor_profiles_public")
    .select(
      `
        id,
        user_id,
        first_name,
        last_name,
        contact_email,
        primary_industry,
        additional_industries,
        target_ebitda,
        target_cash_flow,
        city,
        bio,
        organization_entity,
        ownership_min,
        ownership_max,
        status,
        is_hidden,
        has_paid_access,
        updated_at,
        created_at
      `,
    );

  if (investorsErr) throw investorsErr;

  const investors = ((investorsRaw ?? []) as InvestorCandidate[]).filter(
    (inv) =>
      inv.id &&
      inv.user_id &&
      inv.user_id !== ownerUserId &&
      inv.status === "published" &&
      inv.is_hidden === false,
  );

  const investorIds = investors
    .map((inv) => inv.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const ownerListingIds = ownerListings
    .map((listing) => listing.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // 4) Pull exposure history for this business owner -> investor + listing relationship
  const exposureByInvestorAndListing = new Map<string, MatchExposureRow>();

  if (investorIds.length > 0 && ownerListingIds.length > 0) {
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
        `,
      )
      .eq("recipient_user_id", ownerUserId)
      .eq("recipient_type", "business_owner")
      .eq("entity_type", "investor")
      .in("entity_id", investorIds)
      .in("matched_listing_id", ownerListingIds);

    if (exposuresErr) throw exposuresErr;

    const exposures = (exposuresRaw ?? []) as MatchExposureRow[];

    for (const exposure of exposures) {
      if (!exposure.entity_id || !exposure.matched_listing_id) continue;
      exposureByInvestorAndListing.set(
        buildExposureKey(exposure.entity_id, exposure.matched_listing_id),
        exposure,
      );
    }
  }

  // 5) Build flattened listing x investor candidates with exposure state attached
  const flattened = ownerListings.flatMap((listing) =>
    investors.map((investor) => {
      const matchMeta = scoreInvestorForBusiness(
        listing as ListingForInvestorScoring,
        investor as InvestorForBusinessScoring,
      );
      const investorId = investor.id ?? "";
      const listingId = listing.id ?? "";

      const exposure =
        investorId && listingId
          ? exposureByInvestorAndListing.get(
              buildExposureKey(investorId, listingId),
            )
          : undefined;

      const entity: BusinessOwnerDigestMatchEntity = {
        investor,
        matchedListing: listing,
        investorDisplayName: buildInvestorDisplayName(investor),
        displayLocation: formatLocation(investor.city, null, null),
        teaser: buildInvestorTeaser(investor),
      };

      return {
        entity,
        score: matchMeta.score,
        tier: matchMeta.tier,
        reasons: matchMeta.reasons,
        reasonCodes: matchMeta.reasonCodes,
        createdAt: investor.created_at,
        updatedAt: investor.updated_at,
        dedupeKey: investor.id || undefined, // display dedupe: one investor max in digest
        contextKey: listing.id || undefined, // preserve listing context that produced the match
        isPreviouslySeen: Boolean(
          exposure?.last_seen_at || exposure?.first_seen_at,
        ),
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
    }),
  );

  // 6) Select top digest matches
  const digest = selectDigestMatches(flattened, {
    maxMatches: 3,
    preferUnseen: true,
    reemailCooldownDays: 7,
  });

  return {
    shouldSend: digest.shouldSend,
    recipient: {
      userId: ownerUserId,
      email: recipientEmail,
      firstName: ownerProfile?.first_name ?? null,
      lastName: ownerProfile?.last_name ?? null,
      listingIds: ownerListings
        .map((l) => l.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    },
    subject: buildBusinessOwnerSubject(ownerProfile?.first_name),
    preheader: "Curated investor matches aligned with your active listings.",
    headline: "New investor matches on RioPlex",
    intro: buildBusinessOwnerIntro(ownerProfile?.first_name),
    primaryCtaLabel: "Review Matches",
    primaryCtaHref: reviewMatchesHref,
    featuredMatch: digest.featuredMatch,
    matches: digest.matches,
    totalQualified: digest.totalQualified,
    debug: {
      ownerUserId,
      listingCount: ownerListings.length,
      investorCandidateCount: investors.length,
    },
  };
}
