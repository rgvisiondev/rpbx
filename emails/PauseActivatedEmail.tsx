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

interface PauseActivatedEmailProps {
  billingUrl: string;
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

export function PauseActivatedEmail({
  billingUrl,
  name,
  userType,
  listingTitle,
  hasDependentBoost = false,
}: PauseActivatedEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const membershipLabel = getMembershipLabel(userType, listingTitle);

  return (
    <Html>
      <Head />
      <Preview>
        Your membership is now paused. You can resume anytime from billing.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
                Membership paused
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your membership is now paused
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                {membershipLabel.charAt(0).toUpperCase() + membershipLabel.slice(1)}{" "}
                has now entered a paused state.
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                Whenever you’re ready to come back, you can resume from your
                billing page and restart access from there.
              </Text>

              <Section className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-gray-900">
                  Need access again later?
                </Text>
                <Text className="mt-2 mb-0 text-sm leading-relaxed text-gray-700">
                  No problem. Your billing page is the place to manage or resume
                  this membership whenever the timing is right.
                </Text>
              </Section>

              {hasDependentBoost ? (
                <Section className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4">
                  <Text className="m-0 text-sm font-semibold text-amber-900">
                    Boosted listing add-on
                  </Text>
                  <Text className="mt-2 mb-0 text-sm leading-relaxed text-amber-900">
                    Any boosted listing tied to this membership was paused along
                    with it.
                  </Text>
                </Section>
              ) : null}

              <Section className="my-6 text-center">
                <Button
                  href={billingUrl}
                  className="rounded-xl px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Resume from Billing
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={billingUrl} className="underline">
                    {billingUrl}
                  </a>
                </Text>
              </Section>

              <Text className="text-xs leading-relaxed text-gray-500">
                If you have any questions about resuming or choosing the right
                path back, contact us at{" "}
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