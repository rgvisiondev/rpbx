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

interface SubscriptionCanceledForNonpaymentEmailProps {
  pricingUrl: string;
  billingUrl?: string;
  name?: string;
}

export function SubscriptionCanceledForNonpaymentEmail({
  pricingUrl,
  billingUrl,
  name,
}: SubscriptionCanceledForNonpaymentEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>
        Your RPBX membership has been canceled after multiple unsuccessful payment attempts.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-600">
                Membership canceled
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your membership has been canceled
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We were unable to successfully process your subscription payment
                after multiple retry attempts, so your RioPlex Business Exchange
                membership has now been canceled.
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                As a result, paid access to membership features may no longer be
                available until a new subscription is started.
              </Text>

              <Section className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-red-900">
                  Next step
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-red-900">
                  You can reactivate access at any time by choosing a plan and
                  completing checkout again.
                </Text>
              </Section>

              <Section className="my-6 text-center">
                <Button
                  href={pricingUrl}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  View Membership Plans
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={pricingUrl} className="underline">
                    {pricingUrl}
                  </a>
                </Text>
              </Section>

              {billingUrl ? (
                <Text className="text-xs leading-relaxed text-gray-500">
                  If you’d like to review your billing details first, you can do
                  so here:{" "}
                  <a href={billingUrl} className="underline">
                    {billingUrl}
                  </a>
                </Text>
              ) : null}

              <Text className="mt-4 text-xs leading-relaxed text-gray-500">
                Need help getting back up and running? Reach out to
                info@rioplexbizx.com and our team will be happy to assist.
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