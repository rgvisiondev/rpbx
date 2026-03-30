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

interface PauseScheduledEmailProps {
  billingUrl: string;
  name?: string;
  userType?: string | null;
  listingTitle?: string | null;
  effectiveDateLabel?: string | null;
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

export function PauseScheduledEmail({
  billingUrl,
  name,
  userType,
  listingTitle,
  effectiveDateLabel,
  hasDependentBoost = false,
}: PauseScheduledEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const membershipLabel = getMembershipLabel(userType, listingTitle);

  return (
    <Html>
      <Head />
      <Preview>
        Your membership pause is scheduled and will take effect at the end of
        your current billing period.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
                Pause scheduled
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                Your pause is set
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                We’ve scheduled a pause for {membershipLabel}. Your access will
                remain active through the rest of your current billing period.
              </Text>

              <Section className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-teal-900">
                  What happens next
                </Text>

                <Text className="mt-2 mb-0 text-sm leading-relaxed text-teal-900">
                  {effectiveDateLabel
                    ? `Your membership will move into a paused state on ${effectiveDateLabel}.`
                    : "Your membership will move into a paused state at the end of your current billing period."}
                </Text>

                <Text className="mt-3 mb-0 text-sm leading-relaxed text-teal-900">
                  Until then, your current access stays in place as usual.
                </Text>
              </Section>

              {hasDependentBoost ? (
                <Section className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                  <Text className="m-0 text-sm font-semibold text-gray-900">
                    About your boosted listing
                  </Text>
                  <Text className="mt-2 mb-0 text-sm leading-relaxed text-gray-700">
                    Any boosted listing add-on connected to this membership will
                    pause with it as part of the same lifecycle.
                  </Text>
                </Section>
              ) : null}

              <Section className="my-6 text-center">
                <Button
                  href={billingUrl}
                  className="rounded-xl px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  Manage Billing
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={billingUrl} className="underline">
                    {billingUrl}
                  </a>
                </Text>
              </Section>

              <Text className="text-xs leading-relaxed text-gray-500">
                Changed your mind before the pause begins? You can keep your
                membership active anytime from your billing page.
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