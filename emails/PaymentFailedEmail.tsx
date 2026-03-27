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

interface PaymentFailedEmailProps {
  updateBillingUrl: string;
  name?: string;
}

export function PaymentFailedEmail({
  name,
  updateBillingUrl,
}: PaymentFailedEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  return (
    <Html>
      <Head />
      <Preview>
        We couldn’t process your recent payment. Please update your billing
        information.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="text-lg font-semibold text-gray-900">
                We couldn’t process your recent payment
              </Text>

              <Text className="mt-4 text-sm text-gray-700 leading-relaxed">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm text-gray-700 leading-relaxed">
                We attempted to process your subscription payment, but it was
                unsuccessful. This can happen for a variety of reasons, such as
                an expired card or insufficient funds.
              </Text>

              <Text className="mt-4 text-sm text-gray-700 leading-relaxed">
                To avoid any interruption to your RioPlex Business Exchange
                membership, please update your payment method as soon as
                possible.
              </Text>

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

              <Text className="text-xs text-gray-500 leading-relaxed">
                We’ll automatically retry the payment after your billing
                information is updated. If you need assistance, please contact
                our support team at info@rioplexbizx.com.
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
