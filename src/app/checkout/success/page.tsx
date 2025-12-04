// app/checkout/success/page.tsx
import Stripe from "stripe";
import { Resend } from "resend";
import ValuationEmail from "@/emails/ValuationEmail";
import NavGate from "@/app/components/NavGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY);

function getCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer || typeof customer === "string") return null;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.email ?? null;
}

async function sendValuationEmail(email: string, sessionId: string) {
  try {
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const valuationLink = `${origin}/checkout/success?type=evaluation&session_id=${sessionId}`;
    const calendlyLink = "https://calendly.com/rioplex";

    await resend.emails.send({
      from: "RioPlex <noreply@rioplex.com>",
      to: email,
      subject: "Your RioPlex Business Valuation is Ready",
      react: ValuationEmail({
        link: valuationLink,
        calendlyLink: calendlyLink,
      }),
    });

    console.log("Valuation email sent successfully to:", email);
    return true;
  } catch (err) {
    console.error("Failed to send valuation email:", err);
    return false;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params?.session_id;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  const type = params?.type;

  let buyerEmail: string | null = null;
  if (sessionId) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "customer_details"],
      });
      buyerEmail = s.customer_details?.email ?? getCustomerEmail(s.customer);

      // Send valuation email for public evaluations
      if (type === "evaluation" && buyerEmail) {
        await sendValuationEmail(buyerEmail, sessionId);
      }
    } catch (e) {
      console.warn("Could not retrieve session", e);
    }
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />
    <div className="w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="mt-3">
        Your purchase was successful. We’ve emailed your valuation link
        {buyerEmail ? (
          <> to <strong>{buyerEmail}</strong></>
        ) : (
          ""
        )}
        .
      </p>

      <p className="mt-6 text-sm text-gray-600">
        Didn’t get the email? Check your spam folder, or click the button below to resend.
      </p>

      <form action="/api/evaluations/resend" method="post" className="mt-4">
        <input type="hidden" name="session_id" value={sessionId ?? ""} />
        <button
          type="submit"
          className="rounded-md px-4 py-2 border"
          aria-disabled={!sessionId}
          disabled={!sessionId}
        >
          Resend valuation email
        </button>
      </form>

      <a href="/dashboard" className="mt-8 inline-block underline">
        Go to dashboard
      </a>
    </div>
        </div>
  );
}
