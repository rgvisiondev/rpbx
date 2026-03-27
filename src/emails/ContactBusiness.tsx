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
} from "@react-email/components";

import { RPBXHeader } from "./components/RPBXHeader";
import { RPBXFooter } from "./components/RPBXFooter";

type Props = {
  businessName?: string;
  investorName?: string;
  investorOrganization?: string;
  investorIndustry?: string;
  investorLocation?: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
};

export default function ContactBusiness({
  businessName = "Business Owner",
  investorName,
  investorOrganization,
  investorIndustry,
  investorLocation,
  contactEmail,
  contactPhone,
  message,
}: Props) {
  return (
    <Html>
      <Head />

      <Preview>
        You Have a New Investor Inquiry!
      </Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
            <RPBXHeader />

            <Hr className="m-0 border-gray-200" />

            <Section className="px-[24px] py-[24px]">
              <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                Hi {businessName},
              </Text>

              <Text className="mt-0 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                An investor on RioPlex Business Exchange has reached out to inquire about your business and explore potential investment opportunities.
                <br /><br />
                They are interested in learning more about your company and would like to start a conversation.
              </Text>

              {(investorName || investorOrganization || investorIndustry || investorLocation) && (
                <>
                  <Text className="mt-[8px] text-[18px] font-medium text-gray-900">
                    Investor Details
                  </Text>
                  <Text className="-mt-3 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                    {investorName && (
                      <>
                        <strong>Investor Name:</strong> {investorName}
                        <br />
                      </>
                    )}
                    {investorOrganization && (
                      <>
                        <strong>Organization:</strong> {investorOrganization}
                        <br />
                      </>
                    )}
                    {investorIndustry && (
                      <>
                        <strong>Investment Focus:</strong> {investorIndustry}
                        <br />
                      </>
                    )}
                    {investorLocation && (
                      <>
                        <strong>Location:</strong> {investorLocation}
                        <br />
                      </>
                    )}
                  </Text>
                </>
              )}

              <Text className="mt-[8px] text-[18px] font-medium text-gray-900">
                Contact Information
              </Text>
              <Text className="-mt-3 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                <strong>Email:</strong> {contactEmail}
                <br />
                {contactPhone && (
                  <>
                    <strong>Phone:</strong> {contactPhone}
                    <br />
                  </>
                )}
              </Text>

              <Text className="mt-[8px] text-[14px] font-medium text-gray-900">
                Message
              </Text>
              <Text className="-mt-3 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                {message}
              </Text>

            </Section>

            <Hr className="m-0 border-gray-200" />

            <RPBXFooter />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
