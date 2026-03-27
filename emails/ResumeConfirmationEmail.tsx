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

interface ResumeConfirmationEmailProps {
  billingUrl: string;
  dashboardUrl?: string;
  name?: string;
  userType?: string | null;
  listingTitle?: string | null;
  hasDependentBoost?: boolean;
}

function getMembershipLabel(
  userType?: string | null,
  listingTitle?: string | null
) {
  const normalized = userType?.toLowerCase();

  if (listingTitle?.trim()) {
    return `your listing membership for ${listingTitle.trim()}`;
  }

  if (normalized === "business") {
    return "your business membership";
  }

  if (normalized === "investor") {
    return "your investor membership";
  }

  return "your membership";
}

export function ResumeConfirmationEmail({
  billingUrl,
  dashboardUrl,
  name,
  userType,
  listingTitle,
  hasDependentBoost = false,
}: ResumeConfirmationEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const membershipLabel = getMembershipLabel(userType, listingTitle);

  return (
    <Html>
      <Head />
      <Preview>
        Welcome back. Your membership is active again.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                Welcome back
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your membership is active again
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We’ve confirmed that {membershipLabel} is active again.
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                You can now continue using your membership and manage everything
                from your billing page whenever needed.
              </Text>

              <Section className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-teal-900">
                  You’re back in
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-teal-900">
                  Your subscription is active and your account can continue
                  moving forward from here.
                </Text>
              </Section>

              {hasDependentBoost ? (
                <Section className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <Text className="m-0 text-sm font-semibold text-gray-900">
                    About boosted listings
                  </Text>
                  <Text className="mt-2 mb-0 text-sm leading-relaxed text-gray-700">
                    If this membership previously had a boosted listing attached,
                    boost restoration may still be managed separately based on
                    your current billing setup.
                  </Text>
                </Section>
              ) : null}

              <Section className="my-6 text-center">
                <Button
                  href={billingUrl}
                  className="rounded-xl px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  View Billing
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={billingUrl} className="underline">
                    {billingUrl}
                  </a>
                </Text>
              </Section>

              {dashboardUrl ? (
                <Text className="text-xs leading-relaxed text-gray-500">
                  You can also head back to your dashboard here:{" "}
                  <a href={dashboardUrl} className="underline">
                    {dashboardUrl}
                  </a>
                </Text>
              ) : null}

              <Text className="mt-4 text-xs leading-relaxed text-gray-500">
                Need help with anything as you get back up and running? Contact{" "}
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