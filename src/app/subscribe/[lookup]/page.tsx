// src/app/subscribe/[lookup]/page.tsx
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import Link from "next/link";
import { SubscribeForm } from "./subscribe-form";

export const revalidate = 300;

function priceLabel(p: Stripe.Price) {
  const amt = p.unit_amount ?? 0;
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amt / 100);
  const r = p.recurring;
  const cadence =
    r?.interval_count && r.interval_count > 1
      ? `per ${r.interval_count} ${r.interval}s`
      : `per ${r?.interval ?? "period"}`;
  return `${money} ${r ? cadence : ""}`;
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function SubscribePage({
  params,
  searchParams,
}: {
  params: Promise<{ lookup: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lookup } = await params;
  const q = await searchParams;
  const rawErr = readParam(q, "error");

  const { data } = await stripe.prices.list({
    active: true,
    type: "recurring",
    lookup_keys: [lookup],
    expand: ["data.product"],
    limit: 1,
  });

  const price = data[0];
  if (!price) return notFound();

  const product = price.product as Stripe.Product;
  if (!product?.active) return notFound();

  const baseLabel = priceLabel(price);
  const trialParam = readParam(q, "trial");
  const trialDays =
    trialParam && /^\d+$/.test(trialParam) ? parseInt(trialParam, 10) : 0;
  const displayPriceText =
    trialDays > 0
      ? `$0 for ${trialDays} days, then ${baseLabel}`
      : baseLabel;

  // Map known error codes/messages to friendly copy
  let friendlyError: string | null = null;
  if (rawErr) {
    const e = rawErr.toLowerCase();
    if (e === "account_exists" || e.includes("user already registered")) {
      friendlyError =
        "An account with this email already exists. Try logging in instead, or reset your password.";
    } else if (e.includes("rate") || e.includes("too many")) {
      friendlyError = "Too many attempts. Please wait a moment and try again.";
    } else {
      friendlyError =
        "Unknown error occurred. Please try again or contact support.";
    }
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center">
      <div className="bg-white mx-auto max-w-lg lg:min-w-[500px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link href="/pricing" className="text-sm underline hover:text-[#60BC9B]">
          &larr; All plans
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Create Your Account</h1>
        <p className="mt-2 text-neutral-600">
          You're subscribing to <strong>{product.name}</strong>
        </p>
        <p className="text-neutral-600">Price: {displayPriceText}</p>
        <hr className="mb-1 mt-4" />

        {/* Inline error display */}
        {friendlyError && (
          <div
            className="mt-4 bg-red-100 p-3 rounded-lg text-red-600 text-sm"
            role="alert"
            aria-live="polite"
          >
            {friendlyError}
            {friendlyError.includes("exists") && (
              <>
                {" "}
                <Link href="/login" className="underline font-medium">
                  Log in
                </Link>{" "}
                or{" "}
                <Link href="/forgot-password" className="underline font-medium">
                  reset your password
                </Link>
                .
              </>
            )}
          </div>
        )}

        <SubscribeForm lookup={lookup} />

        <p className="mt-4 text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}