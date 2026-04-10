// emails/ValuationEmail.tsx
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Button,
  Link,
  Tailwind,
  Hr,
} from "@react-email/components";

import { RPBXHeader } from "./components/RPBXHeader";
import { RPBXFooter } from "./components/RPBXFooter";

type Props = {
  link: string;
  calendlyLink: string;
  mode?: "paid" | "free";
  fullName?: string;
};

export default function ValuationEmail({
  link,
  calendlyLink,
  mode = "paid",
  fullName,
}: Props) {
  const isFree = mode === "free";

  const previewText = isFree
    ? "Your free RPBX valuation is ready — access the RPBX Valuation Tool or schedule a consultation."
    : "Your RPBX valuation is ready — access the RPBX Valuation Tool or schedule a consultation.";

  const heading = isFree
    ? `Thanks for requesting your free valuation${fullName ? `, ${fullName}` : ""}!`
    : "Thanks for your purchase!";

  const intro = isFree
    ? "Your free business valuation is ready to begin through the RPBX Valuation Tool. You can start now or schedule a consultation with the RioPlex team if you’d like help understanding the process and your next steps."
    : "Your business valuation is ready to begin through the RPBX Valuation Tool. You can start now or schedule a consultation with the RioPlex team if you’d like help walking through the process and understanding your next steps.";

  const stepThree = isFree
    ? "Schedule a consultation if you would like help reviewing your valuation and discussing next steps."
    : "Schedule a consultation if you would like help reviewing your valuation and discussing next steps.";

  const footerNote = isFree
    ? "You’ll also have this email as a backup anytime you want to return to the RPBX Valuation Tool."
    : "You’ll also have this email as a backup anytime you want to return to the RPBX Valuation Tool.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] overflow-hidden rounded-[20px] border border-gray-200 bg-white">
            <RPBXHeader />

            <Hr className="m-0 border-gray-200" />

            <Section className="px-[28px] py-[28px]">
              <Text className="mb-[8px] text-[22px] font-semibold leading-[30px] text-gray-900">
                {heading}
              </Text>

              <Text className="mt-0 mb-[18px] text-[14px] leading-[24px] text-gray-600">
                {intro}
              </Text>

              <Section className="mb-[20px] rounded-[16px] bg-[#f8fafc] px-[18px] py-[18px]">
                <Text className="mt-0 mb-[10px] text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0f766e]">
                  What to expect
                </Text>

                <ol className="mt-0 mb-0 list-decimal pl-[18px] text-[14px] leading-[24px] text-gray-700">
                  <li>Open the RPBX Valuation Tool.</li>
                  <li>Complete your valuation details.</li>
                  <li>Review your results once available.</li>
                  <li>{stepThree}</li>
                </ol>
              </Section>

              <Section className="mt-[8px] mb-[18px]">
                <Row>
                  <Column className="pr-[6px]">
                    <Button
                      href={link}
                      className="inline-block rounded-[12px] bg-[#60BC9B] px-[18px] py-[12px] text-[14px] font-semibold text-white no-underline"
                    >
                      Open RPBX Valuation Tool
                    </Button>
                  </Column>
                  <Column className="pl-[6px]">
                    <Button
                      href={calendlyLink}
                      className="inline-block rounded-[12px] border border-[#60BC9B] px-[18px] py-[12px] text-[14px] font-semibold text-[#60BC9B] no-underline"
                    >
                      Schedule a consultation
                    </Button>
                  </Column>
                </Row>
              </Section>

              <Text className="mt-[4px] mb-[10px] text-[13px] leading-[20px] text-gray-600">
                If the buttons above do not work, you can copy and paste these
                links into your browser:
              </Text>

              <Text className="mt-0 mb-[8px] text-[13px] leading-[20px] text-gray-600">
                <span className="font-semibold">RPBX Valuation Tool:</span>
                <br />
                <Link href={link} className="text-[#0f766e] underline">
                  {link}
                </Link>
              </Text>

              <Text className="mt-0 mb-[0px] text-[13px] leading-[20px] text-gray-600">
                <span className="font-semibold">Consultation booking:</span>
                <br />
                <Link href={calendlyLink} className="text-[#0f766e] underline">
                  {calendlyLink}
                </Link>
              </Text>

              <Text className="mt-[18px] mb-[0px] text-[13px] leading-[20px] text-gray-600">
                {footerNote}
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