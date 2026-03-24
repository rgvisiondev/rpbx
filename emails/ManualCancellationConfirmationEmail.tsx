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

interface ManualCancellationConfirmationEmailProps {
  dashboardUrl: string;
  pricingUrl?: string;
  accessEndsOn?: string;
  name?: string;
  userType?: string | null;
  reason?: string | null;
}

function getEmailContent(userType?: string | null, reason?: string | null) {
  const normalizedUserType = userType?.toLowerCase() ?? null;
  const normalizedReason = reason?.toLowerCase() ?? null;

  const defaultContent = {
    eyebrow: "Subscription canceled",
    title: "Your subscription will end at the close of your billing period",
    intro:
      "We’ve confirmed your cancellation request. Your RioPlex Business Exchange subscription will remain active until the end of your current billing period.",
    highlightTitle: "What happens next",
    highlightBody:
      "You’ll continue to have access until your billing period ends. After that, paid membership features will no longer be available unless you reactivate.",
    closing:
      "If your plans change, you’re always welcome to come back and reactivate your membership.",
  };

  if (normalizedUserType === "business" && normalizedReason === "sold_business") {
    return {
      eyebrow: "Cancellation confirmed",
      title: "Congratulations on your next chapter",
      intro:
        "We’ve confirmed your cancellation request. If you’ve successfully sold all or part of your business, congratulations — that’s a meaningful milestone, and we’re glad RioPlex Business Exchange could be part of the journey.",
      highlightTitle: "What happens next",
      highlightBody:
        "Your membership will remain active through the end of your current billing period. After that, your paid access will end unless you choose to return in the future.",
      closing:
        "Thank you for being part of RPBX. If you ever re-enter the market or need support again down the road, we’d be glad to welcome you back.",
    };
  }

  if (normalizedUserType === "business" && normalizedReason === "low_traction") {
    return {
      eyebrow: "Cancellation confirmed",
      title: "Your cancellation request has been received",
      intro:
        "We’ve confirmed your cancellation request. We understand that sometimes the level of traction or outreach you hoped for may take longer than expected.",
      highlightTitle: "What happens next",
      highlightBody:
        "Your membership will remain active until the end of your current billing period. You can continue using your access during that time.",
      closing:
        "We appreciate you giving RPBX a try. Your feedback helps us continue improving the platform for business owners.",
    };
  }

  if (normalizedUserType === "investor" && normalizedReason === "not_investing") {
    return {
      eyebrow: "Cancellation confirmed",
      title: "Your subscription has been set to end",
      intro:
        "We’ve confirmed your cancellation request. We understand there are times when you may step back from actively reviewing opportunities.",
      highlightTitle: "What happens next",
      highlightBody:
        "Your subscription will remain active until the end of your current billing period. After that, investor access features will no longer be available unless you reactivate.",
      closing:
        "Whenever you’re ready to explore opportunities again, you’ll be welcome back on RPBX.",
    };
  }

  if (normalizedReason === "too_expensive") {
    return {
      eyebrow: "Cancellation confirmed",
      title: "Your subscription has been set to end",
      intro:
        "We’ve confirmed your cancellation request. We understand that pricing and timing can both play a big role when deciding whether to continue a subscription.",
      highlightTitle: "What happens next",
      highlightBody:
        "Your membership will remain active until the end of your current billing period. After that, paid features will no longer be available unless you reactivate.",
      closing:
        "Thank you for being part of RPBX. If the timing becomes a better fit in the future, you can always return.",
    };
  }

  return defaultContent;
}

export function ManualCancellationConfirmationEmail({
  dashboardUrl,
  pricingUrl,
  accessEndsOn,
  name,
  userType,
  reason,
}: ManualCancellationConfirmationEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const content = getEmailContent(userType, reason);

  return (
    <Html>
      <Head />
      <Preview>
        Your RPBX subscription has been set to end at the close of your current billing period.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
                {content.eyebrow}
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                {content.title}
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                {content.intro}
              </Text>

              <Section className="mt-6 rounded-xl border border-[#d9eee8] bg-[#f4fbf8] px-4 py-4">
                <Text className="m-0 text-sm font-semibold text-gray-900">
                  {content.highlightTitle}
                </Text>

                <Text className="mt-2 mb-0 text-sm leading-relaxed text-gray-700">
                  {content.highlightBody}
                </Text>

                {accessEndsOn ? (
                  <Text className="mt-3 mb-0 text-sm font-medium leading-relaxed text-gray-900">
                    Access remains available through {accessEndsOn}.
                  </Text>
                ) : null}
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

              {pricingUrl ? (
                <Text className="text-sm leading-relaxed text-gray-700">
                  {content.closing} You can restart anytime by visiting our plans page.
                </Text>
              ) : (
                <Text className="text-sm leading-relaxed text-gray-700">
                  {content.closing}
                </Text>
              )}

              {pricingUrl ? (
                <Text className="mt-4 text-xs leading-relaxed text-gray-500">
                  View membership options here:{" "}
                  <a href={pricingUrl} className="underline">
                    {pricingUrl}
                  </a>
                </Text>
              ) : null}

              <Text className="mt-4 text-xs leading-relaxed text-gray-500">
                If you have any questions, feel free to reach out to
                {" "}info@rioplexbizx.com.
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