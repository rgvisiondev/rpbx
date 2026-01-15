// app/checkout/success/page.tsx
import Stripe from "stripe";
import NavGate from "@/app/components/NavGate";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCustomerEmail(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!customer || typeof customer === "string") return null;
  if ("deleted" in customer && customer.deleted) return null;
  return customer.email ?? null;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ match your original pattern: searchParams is a Promise
  const params = await searchParams;

  const stripe = getStripe();

  const raw = params?.session_id;
  const type = params?.type;

  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  const typeValue = Array.isArray(type) ? type[0] : type;

  let buyerEmail: string | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "customer_details"],
      });

      buyerEmail =
        session.customer_details?.email ?? getCustomerEmail(session.customer);

      // 🔹 No email sending here anymore – webhook handles initial send.
      console.log("Success page loaded for session:", sessionId, {
        type: typeValue,
        buyerEmail,
      });
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
            <>
              {" "}
              to <strong>{buyerEmail}</strong>
            </>
          ) : (
            ""
          )}
          .
        </p>

        <p className="mt-6 text-sm text-gray-600">
          Didn’t get the email? Check your spam folder, or click the button below
          to resend it.
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
