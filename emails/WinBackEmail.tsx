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

interface WinBackEmailProps {
  pricingUrl: string;
  name?: string;
  userType?: string | null;
  reason?: string | null;
}

function getWinBackContent(userType?: string | null, reason?: string | null) {
  const normalizedUserType = userType?.toLowerCase() ?? null;
  const normalizedReason = reason?.toLowerCase() ?? null;

  if (normalizedUserType === "business" && normalizedReason === "low_traction") {
    return {
      title: "Still exploring the right buyer or investor?",
      body:
        "If you’re still evaluating options, RioPlex Business Exchange remains a direct way to position your business in front of investors and decision-makers.",
      cta: "View Membership Plans",
    };
  }

  if (normalizedUserType === "investor" && normalizedReason === "not_investing") {
    return {
      title: "Whenever you’re ready, new opportunities will be waiting",
      body:
        "If you plan to get back into the market later, you can reactivate your membership anytime and continue reviewing businesses that match your interests.",
      cta: "View Membership Plans",
    };
  }

  if (normalizedReason === "too_expensive") {
    return {
      title: "You’re always welcome back",
      body:
        "If the timing becomes a better fit later on, you can restart your membership and pick back up whenever you’re ready.",
      cta: "View Membership Plans",
    };
  }

  return {
    title: "You’re always welcome back to RPBX",
    body:
      "If your goals change or the timing becomes right again, you can reactivate your membership anytime and continue where you left off.",
    cta: "View Membership Plans",
  };
}

export function WinBackEmail({
  pricingUrl,
  name,
  userType,
  reason,
}: WinBackEmailProps) {
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi there,";
  const content = getWinBackContent(userType, reason);

  return (
    <Html>
      <Head />
      <Preview>
        You’re always welcome back to RioPlex Business Exchange.
      </Preview>

      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto my-8 w-full max-w-[600px] rounded-xl border border-gray-200 bg-white p-6">
            <RPBXHeader />

            <Hr className="my-6 border-gray-200" />

            <Section>
              <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
                Membership follow-up
              </Text>

              <Text className="text-[24px] font-semibold leading-[32px] text-gray-900">
                {content.title}
              </Text>

              <Text className="mt-4 text-sm leading-relaxed text-gray-700">
                {greeting}
              </Text>

              <Text className="mt-2 text-sm leading-relaxed text-gray-700">
                {content.body}
              </Text>

              <Section className="my-6 text-center">
                <Button
                  href={pricingUrl}
                  className="rounded-lg px-6 py-3 text-sm font-medium text-white"
                  style={{ backgroundColor: "#9ed3c3" }}
                >
                  {content.cta}
                </Button>

                <Text className="mt-4 text-xs text-gray-500">
                  Or paste this link into your browser:{" "}
                  <a href={pricingUrl} className="underline">
                    {pricingUrl}
                  </a>
                </Text>
              </Section>

              <Text className="text-xs leading-relaxed text-gray-500">
                If you have questions about returning or choosing the right membership,
                contact us at info@rioplexbizx.com.
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