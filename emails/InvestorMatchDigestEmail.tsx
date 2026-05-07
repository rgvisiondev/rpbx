// emails/InvestorMatchDigestEmail.tsx
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

type InvestorBusinessMatch = {
  isFeatured: boolean;
  rank: number;
  reasons: string[];
  entity: {
    listing: {
      id: string;
      title: string;
      industry: string | null;
      city: string | null;
      county?: string | null;
      state_code?: string | null;
      annual_revenue_range?: string | null;
      ebitda_range?: string | null;
      cash_flow_range?: string | null;
    };
    teaser: string | null;
    displayLocation: string | null;
  };
};

interface InvestorMatchDigestEmailProps {
  firstName?: string | null;
  reviewMatchesUrl: string;
  previewText?: string;
  matches: InvestorBusinessMatch[];
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
  match: InvestorBusinessMatch;
  reviewMatchesUrl: string;
}) {
  const listing = match.entity.listing;

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
          Featured match
        </Text>
      ) : null}

      <Text className="m-0 text-[20px] font-semibold leading-[28px] text-gray-900">
        {listing.title}
      </Text>

      <Text className="m-0 mt-2 text-[14px] leading-[22px] text-gray-600">
        {[listing.industry, match.entity.displayLocation].filter(Boolean).join(" • ")}
      </Text>

      <Section className="mt-4">
        <StatPill label="Revenue" value={listing.annual_revenue_range} />
        <StatPill label="EBITDA" value={listing.ebitda_range} />
        <StatPill label="Cash Flow" value={listing.cash_flow_range} />
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
          Review Opportunity
        </Button>
      </Section>
    </Section>
  );
}

export function InvestorMatchDigestEmail({
  firstName,
  reviewMatchesUrl,
  previewText,
  matches,
}: InvestorMatchDigestEmailProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const featured = matches.find((m) => m.isFeatured) ?? matches[0];
  const others = matches.filter((m) => m !== featured);

  return (
    <Html>
      <Head />
      <Preview>
        {previewText ??
          "New business matches aligned with your investment criteria are ready to review."}
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
                New business matches for your criteria
              </Text>

              <Text className="mt-4 mb-0 text-[15px] leading-[24px] text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-3 mb-0 text-[15px] leading-[24px] text-gray-700">
                We found business opportunities on RioPlex that align with your
                profile and target criteria. These matches were selected based on
                relevance, fit, and profile quality — not just recency.
              </Text>

              <Section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <Text className="m-0 text-[13px] font-medium leading-[22px] text-gray-700">
                  This week’s digest includes up to <span className="font-semibold text-gray-900">3 curated matches</span> selected
                  for quality and fit.
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
                    key={`${match.entity.listing.id}-${match.rank}`}
                    match={match}
                    reviewMatchesUrl={reviewMatchesUrl}
                  />
                ))}
              </Section>
            ) : null}

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] leading-[20px] text-gray-500">
                You are receiving this email because your investor profile is
                active on RioPlex Business Exchange and we identified relevant
                marketplace matches for your criteria.
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

export default InvestorMatchDigestEmail;