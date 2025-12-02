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
  Img,
} from "@react-email/components";

import { RPBXHeader } from "./components/RPBXHeader";
import { RPBXFooter } from "./components/RPBXFooter";

type Props = { dashboardUrl: string };

export default function SubscriptionConfirmationEmail({ dashboardUrl }: Props) {
  return (
    <Html>
      <Head />

      <Preview>
        Welcome to RioPlex Business Exchange — your subscription is now active!
      </Preview>

      <Tailwind>
        <Body className="bg-[#f3f4f6] font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white">
            <RPBXHeader />

            <Hr className="m-0 border-gray-200" />

            <Section className="px-[24px] py-[24px]">
              <Text className="mb-[8px] text-[20px] font-semibold text-gray-900">
                Welcome to RioPlex Business Exchange!
              </Text>

              <Text className="mt-0 mb-[12px] text-[14px] leading-[22px] text-gray-700">
                Your subscription is now active. We're excited to have you as part
                of our growing community of entrepreneurs and
                investors. Your membership gives you full access to the tools,
                insights, and opportunities available inside the RioPlex platform.
              </Text>

                <Text className="mt-[8px] mb-[12px] text-[14px] font-medium text-gray-900">
                Here&rsquo;s what you can do next:
                </Text>

              <Row className="mt-[12px]">
                <Column align="center" className="w-1/3 pr-[12px]">
                  <Img
                    alt="Dashboard Icon"
                    height="48"
                    width="48"
                    src="https://ivjjitljzagsnvwffcbm.supabase.co/storage/v1/object/public/Email/email-icons/dashboard.svg"
                  />
                  <Text className="mt-[12px] text-[14px] font-semibold text-gray-700 leading-[20px]">
                    Access your personalized dashboard
                  </Text>
                </Column>

                <Column align="center" className="w-1/3 pr-[12px]">
                  <Img
                    alt="Network Icon"
                    height="48"
                    width="48"
                    src="https://ivjjitljzagsnvwffcbm.supabase.co/storage/v1/object/public/Email/email-icons/network.svg"
                  />
                  <Text className="mt-[12px] text-[14px] font-semibold text-gray-700 leading-[20px]">
                    Connect with businesses or investors
                  </Text>
                </Column>

                <Column align="center" className="w-1/3">
                  <Img
                    alt="Tools Icon"
                    height="48"
                    width="48"
                    src="https://ivjjitljzagsnvwffcbm.supabase.co/storage/v1/object/public/Email/email-icons/tools.svg"
                  />
                  <Text className="mt-[12px] text-[14px] font-semibold text-gray-700 leading-[20px]">
                    Use platform tools to grow and explore
                  </Text>
                </Column>
              </Row>

              <Section className="mt-[24px] mb-[12px]">
                <Button
                  href={dashboardUrl}
                  className="inline-block rounded-md bg-[#60BC9B] px-[20px] py-[12px] text-[14px] font-semibold text-white no-underline"
                >
                  Go to your dashboard
                </Button>
              </Section>

              <Text className="mt-[16px] mb-[0px] text-[13px] leading-[20px] text-gray-600">
                If the button above doesn’t work, you can use this link:
              </Text>

              <Text className="mt-[4px] mb-[0px] text-[13px] leading-[20px]">
                <Link href={dashboardUrl} className="text-[#0f766e] underline">
                  {dashboardUrl}
                </Link>
              </Text>

              <Text className="mt-[16px] mb-[0px] text-[13px] leading-[20px] text-gray-600">
                Your membership automatically unlocks full platform access, and
                you can manage your account or subscription anytime from your
                dashboard.
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
