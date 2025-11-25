import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Text,
  Button,
  Link,
  Tailwind,
  Hr
} from "@react-email/components";

type Props = { link: string; calendlyLink: string };

export default function ValuationEmail({ link, calendlyLink }: Props) {
  return (
    <Html>
      <Head />
      {/* This text shows as the email preview in most inboxes */}
      <Preview>
        Your RioPlex valuation is ready to begin — start your valuation or book
        a consultation.
      </Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
            {/* Header */}
            <Section className="px-[24px] pt-[24px] pb-[16px]">
              <Row>
                <Column className="w-[70%]">
                  {/* Replace src with your real logo URL (must be absolute) */}
                  <Img
                    alt="RioPlex"
                    height="40"
                    src="https://rioplexbusinessexchange.com/wp-content/uploads/2024/11/RPBX.png"
                    className="mb-1"
                  />
                  <Text className="m-0 text-[14px] font-medium text-gray-500">
                    RioPlex Business Exchange
                  </Text>
                </Column>
                <Column align="right" className="align-middle">
                  {/* If you want socials later, you can add them here, for now keep it minimal */}
                  <Text className="m-0 text-right text-[12px] text-gray-400">
                    Valuation Confirmation
                  </Text>
                </Column>
              </Row>
            </Section>

            <Hr className="m-0 border-gray-200" />

            {/* Main content */}
            <Section className="px-[24px] py-[24px]">
              <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                Thanks for your purchase!
              </Text>

              <Text className="mt-0 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                Your business valuation is ready to begin. We’ve partnered with{" "}
                <span className="font-medium">BizEquity</span> to provide your
                valuation. You can start your valuation now or schedule a call
                with a RioPlex consultant to walk through the process together.
              </Text>

              {/* Step list */}
              <Text className="mt-[8px] mb-[12px] text-[14px] font-medium text-gray-900">
                Next steps:
              </Text>
              <ol className="mt-0 mb-[16px] list-decimal pl-[18px] text-[14px] leading-[22px] text-gray-700">
                <li>Start your valuation through BizEquity.</li>
                <li>
                  Schedule a consultation to review your results and next
                  options.
                </li>
                <li>
                  Come back to your RioPlex dashboard anytime to manage your
                  listing.
                </li>
              </ol>

              {/* Primary & secondary CTA buttons */}
              <Section className="mt-[16px] mb-[12px]">
                <Row>
                  <Column className="pr-[4px]">
                    <Button
                      href={link}
                      className="inline-block rounded-md bg-[#0f766e] px-[16px] py-[10px] text-[14px] font-semibold text-white no-underline"
                    >
                      Start your valuation
                    </Button>
                  </Column>
                  <Column className="pl-[4px]">
                    <Button
                      href={calendlyLink}
                      className="inline-block rounded-md border border-[#0f766e] px-[16px] py-[10px] text-[14px] font-semibold text-[#0f766e] no-underline"
                    >
                      Schedule a consultation
                    </Button>
                  </Column>
                </Row>
              </Section>

              {/* Fallback URLs */}
              <Text className="mt-[12px] mb-[8px] text-[13px] leading-[20px] text-gray-600">
                If the buttons above don’t work, you can copy and paste these
                links into your browser:
              </Text>

              <Text className="mt-0 mb-[4px] text-[13px] leading-[20px] text-gray-600">
                <span className="font-semibold">BizEquity valuation:</span>
                <br />
                <Link href={link} className="text-[#0f766e] underline">
                  {link}
                </Link>
              </Text>

              <Text className="mt-[4px] mb-[0px] text-[13px] leading-[20px] text-gray-600">
                <span className="font-semibold">Consultation booking:</span>
                <br />
                <Link
                  href={calendlyLink}
                  className="text-[#0f766e] underline"
                >
                  {calendlyLink}
                </Link>
              </Text>

              <Text className="mt-[16px] mb-[0px] text-[13px] leading-[20px] text-gray-600">
                You can also access your valuation entry point anytime from your
                RioPlex dashboard under your listing.
              </Text>
            </Section>

            <Hr className="m-0 border-gray-200" />

            {/* Footer (simplified, inspired by your snippet) */}
            <Section className="px-[24px] py-[16px]">
              <Row>
                <Column>
                  <Text className="mt-0 mb-[4px] text-[12px] font-semibold text-gray-700">
                    RioPlex Business Exchange
                  </Text>
                  <Text className="mt-0 mb-[2px] text-[12px] text-gray-500">
                    Helping investors and business owners connect in the Rio
                    Grande Valley.
                  </Text>
                  <Text className="mt-[4px] mb-0 text-[12px] text-gray-500">
                    Need help? Email{" "}
                    <Link
                      href="mailto:info@rioplexbizx.com"
                      className="text-[#0f766e] underline"
                    >
                      info@rioplexbizx.com
                    </Link>
                    .
                  </Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
