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

interface FinalBillingWarningEmailProps {
  updateBillingUrl: string;
  name?: string;
}

export function FinalBillingWarningEmail({
  updateBillingUrl,
  name,
}: FinalBillingWarningEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>
        Final reminder: update your payment method soon to avoid cancellation of
        your RPBX membership.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-600">
                Final billing warning
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your membership may be canceled soon
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We’re reaching out one more time because we still have not been
                able to successfully process your subscription payment for
                RioPlex Business Exchange.
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                If your payment method is not updated soon, your membership may
                be canceled after Stripe completes its retry schedule.
              </Text>

              <Section className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-red-900">
                  Action needed now
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-red-900">
                  Update your billing information as soon as possible to help
                  prevent cancellation and loss of paid membership access.
                </Text>
              </Section>

              <Section className="my-6 text-center">
                <Button
                  href={updateBillingUrl}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Update Billing Information
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={updateBillingUrl} className="underline">
                    {updateBillingUrl}
                  </a>
                </Text>
              </Section>

              <Text className="text-xs leading-relaxed text-gray-500">
                If you’ve already updated your payment method recently, no
                further action may be needed. If you need support, please reach
                out to{" "}
                <a href="mailto:info@rioplexbizx.com" className="underline">
                  info@rioplexbizx.com
                </a>.
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