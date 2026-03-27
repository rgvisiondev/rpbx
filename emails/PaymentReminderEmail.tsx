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

interface PaymentReminderEmailProps {
  updateBillingUrl: string;
  name?: string;
}

export function PaymentReminderEmail({
  updateBillingUrl,
  name,
}: PaymentReminderEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>
        Your billing issue is still unresolved. Update your payment method to
        keep your membership active.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
                Billing reminder
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your payment issue still needs attention
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We’re following up because we still haven’t been able to process
                your subscription payment for RioPlex Business Exchange.
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                Your membership is still active for now, but to avoid any
                interruption to paid features, please update your payment method
                as soon as possible.
              </Text>

              <Section className="mt-6 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-amber-900">
                  Why this matters
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-amber-900">
                  If the payment issue remains unresolved, Stripe will continue
                  retrying the charge and your membership may eventually be
                  canceled.
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
                Once your billing information is updated, Stripe will continue
                its retry process automatically. If you need help, contact us at{" "}
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