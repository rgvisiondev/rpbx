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
  investorName?: string;
  businessName?: string;
  industry?: string;
  location?: string;
  businessDescription?: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
};

export default function ContactInvestor({
  investorName = "Investor",
  businessName = "A Business Owner",
  industry,
  location,
  businessDescription,
  contactEmail,
  contactPhone,
  message,
}: Props) {
  return (
    <Html>
      <Head />

      <Preview>
        You Have a New Business Inquiry!
      </Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
            <RPBXHeader />

            <Hr className="m-0 border-gray-200" />

            <Section className="px-[24px] py-[24px]">
              <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                Hi {investorName},
              </Text>

              <Text className="mt-0 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                A business listed on RioPlex Business Exchange has reached out to introduce their company and explore a potential investment opportunity.
                <br /><br />
                They believe their business aligns with your stated investment interests and would like to start an initial conversation.
              </Text>

              {(businessName || industry || location || businessDescription) && (
                <>
                  <Text className="mt-[8px] text-[18px] font-medium text-gray-900">
                    Business Details
                  </Text>
                  <Text className="-mt-3 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                    {businessName && (
                      <>
                        <strong>Business Name:</strong> {businessName}
                        <br />
                      </>
                    )}
                    {industry && (
                      <>
                        <strong>Industry:</strong> {industry}
                        <br />
                      </>
                    )}
                    {location && (
                      <>
                        <strong>Location:</strong> {location}
                        <br />
                      </>
                    )}
                    {businessDescription && (
                      <>
                        <strong>Description:</strong> {businessDescription}
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
