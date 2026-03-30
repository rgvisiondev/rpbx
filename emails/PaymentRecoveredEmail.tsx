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

interface PaymentRecoveredEmailProps {
  dashboardUrl: string;
  billingUrl?: string;
  name?: string;
}

export function PaymentRecoveredEmail({
  dashboardUrl,
  billingUrl,
  name,
}: PaymentRecoveredEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>
        Your payment was successful and your RPBX membership is back in good standing.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                Payment successful
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your membership is back in good standing
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We’re happy to let you know that your recent subscription payment
                was processed successfully. Your RioPlex Business Exchange
                membership remains active, and no further action is needed at
                this time.
              </Text>

              <Section className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-emerald-900">
                  What this means
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-emerald-900">
                  Your access is secure, and your account is now in a healthy
                  billing state again.
                </Text>
              </Section>

              <Section className="my-6 text-center">
                <Button
                  href={dashboardUrl}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Go to Dashboard
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={dashboardUrl} className="underline">
                    {dashboardUrl}
                  </a>
                </Text>
              </Section>

              {billingUrl ? (
                <Text className="text-xs leading-relaxed text-gray-500">
                  You can still review your billing details here:{" "}
                  <a href={billingUrl} className="underline">
                    {billingUrl}
                  </a>
                </Text>
              ) : null}

              <Text className="mt-4 text-xs leading-relaxed text-gray-500">
                If you have any questions about your membership or billing,
                please contact us at info@rioplexbizx.com.
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