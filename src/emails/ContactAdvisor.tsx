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
  advisorName?: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
};

export default function ContactAdvisor({
  advisorName = "Advisor",
  contactEmail,
  contactPhone,
  message,
}: Props) {
  return (
    <Html>
      <Head />

      <Preview>
        You Have an RPBX Advisory Inquiry!
      </Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
            <RPBXHeader />

            <Hr className="m-0 border-gray-200" />

            <Section className="px-[24px] py-[24px]">
              <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                Hi {advisorName},
              </Text>

              <Text className="mt-0 mb-[16px] text-[14px] leading-[22px] text-gray-700">
                A member of RioPlex Business Exchange has reached out to connect
                with you for professional guidance and advice.
              </Text>

              <Text className="mt-[8px] text-[14px] font-medium text-gray-900">
                Contact Information
              </Text>
              <Text className="-mt-3 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                Email: {contactEmail}<br />
                {contactPhone && <>Phone: {contactPhone}<br /></>}
                Message: {message}
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
