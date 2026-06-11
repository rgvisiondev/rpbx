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

type MissingListingField = {
  label: string;
  description?: string | null;
  isImportant?: boolean;
};

interface BusinessListingIncompleteEmailProps {
  firstName?: string | null;
  listingTitle?: string | null;
  editListingUrl: string;
  dashboardUrl?: string;
  completionPercentage?: number | null;
  missingFields?: MissingListingField[];
  previewText?: string;
}

function MissingFieldItem({ field }: { field: MissingListingField }) {
  return (
    <Section
      className={`mt-3 rounded-xl border px-4 py-4 ${
        field.isImportant
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <Text className="m-0 text-[14px] font-semibold leading-[22px] text-gray-900">
        {field.label}
      </Text>

      {field.description ? (
        <Text className="m-0 mt-1 text-[13px] leading-[21px] text-gray-600">
          {field.description}
        </Text>
      ) : null}
    </Section>
  );
}

export function BusinessListingIncompleteEmail({
  firstName,
  listingTitle,
  editListingUrl,
  dashboardUrl,
  completionPercentage,
  missingFields = [],
  previewText,
}: BusinessListingIncompleteEmailProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const displayTitle = listingTitle?.trim() || "your business listing";

  const hasCompletionScore =
    typeof completionPercentage === "number" &&
    !Number.isNaN(completionPercentage);

  const safeCompletionPercentage = hasCompletionScore
    ? Math.max(0, Math.min(100, Math.round(completionPercentage)))
    : null;

  const missingFieldCount = missingFields.length;
  const isMissingOneField = missingFieldCount === 1;

  const listingStrengthText =
    safeCompletionPercentage !== null
      ? `${safeCompletionPercentage}% complete`
      : isMissingOneField
        ? "One update could strengthen your listing"
        : "A few updates could strengthen your listing";

  const missingSummaryText =
    missingFieldCount > 0
      ? `${missingFieldCount} section${
          missingFieldCount === 1 ? "" : "s"
        } ${missingFieldCount === 1 ? "may need" : "may need"} attention.`
      : "Completing each section helps investors review your business with stronger context.";

  const introText = isMissingOneField
    ? `We noticed that ${displayTitle} may be missing one important detail. Adding it can give investors more context as they evaluate your business.`
    : `We noticed that ${displayTitle} may still be missing a few important details. Adding this information can give investors more context as they evaluate your business.`;

  return (
    <Html>
      <Head />

      <Preview>
        {previewText ??
          "Update your RioPlex listing to give investors more context."}
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[640px] rounded-2xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Listing profile reminder
              </Text>

              <Text className="m-0 mt-3 text-[28px] font-semibold leading-[36px] text-gray-900">
                Strengthen your business listing
              </Text>

              <Text className="mt-4 mb-0 text-[15px] leading-[24px] text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-3 mb-0 text-[15px] leading-[24px] text-gray-700">
                {introText}
              </Text>

              <Section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                  Listing strength
                </Text>

                <Text className="m-0 mt-2 text-[22px] font-semibold leading-[30px] text-gray-900">
                  {listingStrengthText}
                </Text>

                <Text className="m-0 mt-2 text-[14px] leading-[22px] text-gray-600">
                  {missingSummaryText}
                </Text>
              </Section>

              <Section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                <Text className="m-0 text-[14px] font-semibold leading-[22px] text-gray-900">
                  Why this matters
                </Text>

                <Text className="m-0 mt-2 text-[14px] leading-[23px] text-gray-700">
                  Investors are more likely to engage when they can quickly
                  understand what your business does, where it operates, and what
                  type of opportunity it represents. A more complete listing can
                  reduce back-and-forth and make your business easier to evaluate.
                </Text>
              </Section>

              {missingFields.length ? (
                <Section className="mt-6">
                  <Text className="m-0 text-[16px] font-semibold text-gray-900">
                    {isMissingOneField ? "Suggested update" : "Suggested updates"}
                  </Text>

                  {missingFields.slice(0, 6).map((field, index) => (
                    <MissingFieldItem
                      key={`${field.label}-${index}`}
                      field={field}
                    />
                  ))}

                  {missingFields.length > 6 ? (
                    <Text className="mt-3 mb-0 text-[13px] leading-[21px] text-gray-500">
                      There may be a few additional fields to review inside your
                      dashboard.
                    </Text>
                  ) : null}
                </Section>
              ) : (
                <Section className="mt-6">
                  <Text className="m-0 text-[16px] font-semibold text-gray-900">
                    Areas worth reviewing
                  </Text>

                  <MissingFieldItem
                    field={{
                      label: "Business overview",
                      description:
                        "Add a clear summary explaining what your business does, who it serves, and what makes it valuable.",
                      isImportant: true,
                    }}
                  />

                  <MissingFieldItem
                    field={{
                      label: "Financial ranges",
                      description:
                        "Revenue, EBITDA, or cash flow ranges can help investors evaluate fit faster.",
                      isImportant: true,
                    }}
                  />

                  <MissingFieldItem
                    field={{
                      label: "City and state",
                      description:
                        "Accurate location details help investors understand where your business operates.",
                    }}
                  />
                </Section>
              )}

              <Section className="mt-7 text-center">
                <Button
                  href={editListingUrl}
                  className="rounded-xl px-6 py-3 text-[14px] font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Update Listing Details
                </Button>

                <Text className="mt-4 text-[12px] leading-[20px] text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={editListingUrl} className="underline">
                    {editListingUrl}
                  </a>
                </Text>
              </Section>
            </Section>

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] leading-[20px] text-gray-500">
                You are receiving this email because your RioPlex Business
                Exchange listing appears to be missing information that may help
                investors better evaluate your business.
              </Text>

              {dashboardUrl ? (
                <Text className="m-0 mt-3 text-[12px] leading-[20px] text-gray-500">
                  You can update your listing anytime from your RioPlex dashboard.
                </Text>
              ) : null}
            </Section>

            <Hr className="my-6 border-gray-200" />

            <RPBXFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default BusinessListingIncompleteEmail;