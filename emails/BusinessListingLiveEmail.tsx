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

interface BusinessListingLiveEmailProps {
  firstName?: string | null;
  listingTitle?: string | null;
  listingIndustry?: string | null;
  listingUrl: string;
  dashboardUrl?: string;
  previewText?: string;
}

function NextStepCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Section className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
      <Text className="m-0 text-[14px] font-semibold leading-[22px] text-gray-900">
        {title}
      </Text>
      <Text className="m-0 mt-1 text-[13px] leading-[21px] text-gray-600">
        {description}
      </Text>
    </Section>
  );
}

export function BusinessListingLiveEmail({
  firstName,
  listingTitle,
  listingIndustry,
  listingUrl,
  dashboardUrl,
  previewText,
}: BusinessListingLiveEmailProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : "Hi there,";
  const displayTitle = listingTitle?.trim() || "Your business listing";
  const fallbackUrl = dashboardUrl || listingUrl;

  return (
    <Html>
      <Head />

      <Preview>
        {previewText ??
          "Your RioPlex Business Exchange listing is now live and ready for eligible investors to view."}
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[640px] rounded-2xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Listing now live
              </Text>

              <Text className="m-0 mt-3 text-[28px] font-semibold leading-[36px] text-gray-900">
                Your business listing is live on RioPlex
              </Text>

              <Text className="mt-4 mb-0 text-[15px] leading-[24px] text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-3 mb-0 text-[15px] leading-[24px] text-gray-700">
                Your listing has been published on RioPlex Business Exchange and
                is now available for eligible investors to review inside the
                platform.
              </Text>

              <Section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5">
                <Text className="m-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                  Active listing
                </Text>

                <Text className="m-0 mt-2 text-[20px] font-semibold leading-[28px] text-gray-900">
                  {displayTitle}
                </Text>

                {listingIndustry ? (
                  <Text className="m-0 mt-2 text-[14px] leading-[22px] text-gray-600">
                    {listingIndustry}
                  </Text>
                ) : null}
              </Section>

              <Text className="mt-6 mb-0 text-[15px] leading-[24px] text-gray-700">
                From here, we recommend reviewing your listing to make sure the
                information is accurate, current, and positioned clearly for
                investors who may be evaluating potential opportunities.
              </Text>

              <Section className="mt-6">
                <Text className="m-0 text-[16px] font-semibold text-gray-900">
                  Recommended next steps
                </Text>

                <NextStepCard
                  title="Review your live listing"
                  description="Confirm that your business overview, location, financial ranges, and contact details are accurate."
                />

                <NextStepCard
                  title="Keep your profile complete"
                  description="A complete listing gives investors stronger context before they decide to reach out."
                />

                <NextStepCard
                  title="Watch for investor interest"
                  description="You can return to your dashboard anytime to manage your listing and review platform activity."
                />
              </Section>

              <Section className="mt-7 text-center">
                <Button
                  href={listingUrl}
                  className="rounded-xl px-6 py-3 text-[14px] font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  View Live Listing
                </Button>

                <Text className="mt-4 text-[12px] leading-[20px] text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={listingUrl} className="underline">
                    {listingUrl}
                  </a>
                </Text>
              </Section>
            </Section>

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="m-0 text-[12px] leading-[20px] text-gray-500">
                You are receiving this email because your business listing was
                recently completed and published on RioPlex Business Exchange.
              </Text>

              {fallbackUrl ? (
                <Text className="m-0 mt-3 text-[12px] leading-[20px] text-gray-500">
                  You can manage your listing anytime from your RioPlex dashboard.
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

export default BusinessListingLiveEmail;