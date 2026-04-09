// emails/BusinessOwnerMatchDigestEmail.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Tailwind,
  Hr,
  Button,
} from "@react-email/components";
import { RPBXHeader } from "./components/RPBXHeader";
import { RPBXFooter } from "./components/RPBXFooter";

type BusinessOwnerInvestorMatch = {
  isFeatured: boolean;
  rank: number;
  reasons: string[];
  entity: {
    investor: {
      id: string | null;
      first_name?: string | null;
      last_name?: string | null;
      organization_entity?: string | null;
      primary_industry?: string | null;
      additional_industries?: string[] | null;
      city?: string | null;
      state_code?: string | null;
      target_ebitda?: string | null;
      target_cash_flow?: string | null;
      ownership_min?: number | null;
      ownership_max?: number | null;
    };
    matchedListing: {
      id: string;
      title: string;
      industry?: string | null;
    };
    investorDisplayName: string;
    displayLocation: string | null;
    teaser: string | null;
  };
};

interface BusinessOwnerMatchDigestEmailProps {
  firstName?: string | null;
  reviewMatchesUrl: string;
  previewText?: string;
  matches: BusinessOwnerInvestorMatch[];
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <Section
      className="mr-2 mb-2 inline-block rounded-full border border-gray-200 px-3 py-2"
      style={{ display: "inline-block" }}
    >
      <Text className="m-0 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
        {label}
      </Text>
      <Text className="m-0 mt-1 text-[13px] font-semibold text-gray-900">
        {value}
      </Text>
    </Section>
  );
}

function OwnershipPill({
  min,
  max,
}: {
  min?: number | null;
  max?: number | null;
}) {
  if (min == null && max == null) return null;

  let value = "";
  if (min != null && max != null) value = `${min}%–${max}%`;
  else if (min != null) value = `${min}%+`;
  else if (max != null) value = `Up to ${max}%`;

  return <StatPill label="Ownership" value={value} />;
}

function ReasonList({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;

  return (
    <Section className="mt-4">
      <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        Why this matches
      </Text>

      {reasons.slice(0, 4).map((reason, index) => (
        <Text
          key={`${reason}-${index}`}
          className="m-0 mt-2 text-[14px] leading-[22px] text-gray-700"
        >
          • {reason}
        </Text>
      ))}
    </Section>
  );
}

function MatchCard({
  match,
  reviewMatchesUrl,
}: {
  match: BusinessOwnerInvestorMatch;
  reviewMatchesUrl: string;
}) {
  const investor = match.entity.investor;
  const listing = match.entity.matchedListing;

  const focusLine = [
    investor.primary_industry,
    match.entity.displayLocation,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <Section
      className={`mt-6 rounded-2xl border px-5 py-5 ${
        match.isFeatured
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {match.isFeatured ? (
        <Text className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
          Featured investor match
        </Text>
      ) : null}

      <Text className="m-0 text-[20px] font-semibold leading-[28px] text-gray-900">
        {match.entity.investorDisplayName}
      </Text>

      {focusLine ? (
        <Text className="m-0 mt-2 text-[14px] leading-[22px] text-gray-600">
          {focusLine}
        </Text>
      ) : null}

      <Section className="mt-4">
        <StatPill label="Target EBITDA" value={investor.target_ebitda} />
        <StatPill label="Target Cash Flow" value={investor.target_cash_flow} />
        <OwnershipPill min={investor.ownership_min} max={investor.ownership_max} />
      </Section>

      <Section className="mt-4 rounded-xl border border-white/40 bg-white px-4 py-3">
        <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          Matched to listing
        </Text>
        <Text className="m-0 mt-2 text-[14px] font-medium leading-[22px] text-gray-900">
          {listing.title}
        </Text>
        {listing.industry ? (
          <Text className="m-0 mt-1 text-[13px] leading-[20px] text-gray-600">
            {listing.industry}
          </Text>
        ) : null}
      </Section>

      {match.entity.teaser ? (
        <Text className="m-0 mt-4 text-[14px] leading-[24px] text-gray-700">
          {match.entity.teaser}
        </Text>
      ) : null}

      <ReasonList reasons={match.reasons} />

      <Section className="mt-6">
        <Button
          href={reviewMatchesUrl}
          className="rounded-xl px-5 py-3 text-[14px] font-medium text-white"
          style={{ backgroundColor: "#9ed3c3" }}
        >
          Review Investor Match
        </Button>
      </Section>
    </Section>
  );
}

export function BusinessOwnerMatchDigestEmail({
  firstName,
  reviewMatchesUrl,
  previewText,
  matches,
}: BusinessOwnerMatchDigestEmailProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const featured = matches.find((m) => m.isFeatured) ?? matches[0];
  const others = matches.filter((m) => m !== featured);

  return (
    <Html>
      <Head />
      <Preview>
        {previewText ??
          "New investor matches aligned with your active listings are ready to review."}
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[640px] rounded-2xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Weekly match digest
              </Text>

              <Text className="m-0 mt-3 text-[28px] font-semibold leading-[36px] text-gray-900">
                New investor matches for your business
              </Text>

              <Text className="mt-4 mb-0 text-[15px] leading-[24px] text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-3 mb-0 text-[15px] leading-[24px] text-gray-700">
                We found investor profiles on RioPlex that align with one or more
                of your active listings. These matches are prioritized for fit,
                profile quality, and marketplace relevance.
              </Text>

              <Section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <Text className="m-0 text-[13px] font-medium leading-[22px] text-gray-700">
                  This digest surfaces up to <span className="font-semibold text-gray-900">3 curated investor matches</span> connected
                  to your current listing criteria.
                </Text>
              </Section>

              <Section className="mt-6 text-center">
                <Button
                  href={reviewMatchesUrl}
                  className="rounded-xl px-6 py-3 text-[14px] font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Review All Matches
                </Button>

                <Text className="mt-4 text-[12px] text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={reviewMatchesUrl} className="underline">
                    {reviewMatchesUrl}
                  </a>
                </Text>
              </Section>
            </Section>

            {featured ? <MatchCard match={featured} reviewMatchesUrl={reviewMatchesUrl} /> : null}

            {others.length ? (
              <Section className="mt-8">
                <Text className="m-0 text-[16px] font-semibold text-gray-900">
                  Additional matches
                </Text>

                {others.map((match) => (
                  <MatchCard
                    key={`${match.entity.investor.id ?? "investor"}-${match.rank}`}
                    match={match}
                    reviewMatchesUrl={reviewMatchesUrl}
                  />
                ))}
              </Section>
            ) : null}

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] leading-[20px] text-gray-500">
                You are receiving this email because you have an active business
                listing on RioPlex Business Exchange and relevant investor matches
                were identified for your profile.
              </Text>
            </Section>

            <Hr className="my-6 border-gray-200" />

            <RPBXFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BusinessOwnerMatchDigestEmail;