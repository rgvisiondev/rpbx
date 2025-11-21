// src/app/subscribe/[lookup]/page.tsx  (adjust path to yours)
import { notFound } from "next/navigation"
import { stripe } from "@/lib/stripe"
import Stripe from "stripe"
import Link from "next/link"
import Button from "../../components/Button"

export const revalidate = 300

function priceLabel(p: Stripe.Price) {
  const amt = p.unit_amount ?? 0
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: p.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amt / 100)
  const r = p.recurring
  const cadence =
    r?.interval_count && r.interval_count > 1
      ? `per ${r.interval_count} ${r.interval}s`
      : `per ${r?.interval ?? "period"}`
  return `${money} ${r ? cadence : ""}`
}

// helper to normalize ?error=... or ?error[]=...
function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = params[key]
  return Array.isArray(v) ? v[0] : v
}

export default async function SubscribePage({
  params,
  searchParams, // Next 15 passes a Promise here
}: {
  params: Promise<{ lookup: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { lookup } = await params
  const q = await searchParams
  const rawErr = readParam(q, "error")

  const { data } = await stripe.prices.list({
    active: true,
    type: "recurring",
    lookup_keys: [lookup],
    expand: ["data.product"],
    limit: 1,
  })
  const price = data[0]
  if (!price) return notFound()

  const product = price.product as Stripe.Product
  if (!product?.active) return notFound()

  // Map known error codes/messages to friendly copy
  let friendlyError: string | null = null
  if (rawErr) {
    const e = rawErr.toLowerCase()
    if (e === "account_exists" || e.includes("user already registered")) {
      friendlyError =
        "An account with this email already exists. Try logging in instead, or reset your password."
    } else if (e.includes("rate") || e.includes("too many")) {
      friendlyError = "Too many attempts. Please wait a moment and try again."
    } else {
      friendlyError = "We couldn’t create your account. Please double-check your info and try again."
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
          You’re subscribing to <strong>{product.name}</strong>
        </p>
        <p className="text-neutral-600">Price: {priceLabel(price)}</p>
        <hr className="mb-1 mt-4" />

        {/* Small inline error (top of form) */}
        {friendlyError && (
          <p className="mt-4 text-sm text-red-600" role="alert" aria-live="polite">
            {friendlyError}{" "}
            {friendlyError.includes("exists") && (
              <>
                {" "}
                <Link href="/login" className="underline">
                  Log in
                </Link>{" "}
                or{" "}
                <Link href="/forgot-password" className="underline">
                  reset your password
                </Link>
                .
              </>
            )}
          </p>
        )}

        <form method="post" action="/api/subscribe" className="mt-6 space-y-3">
          <input name="lookup" type="hidden" value={lookup} />

          <label className="block">
            <span>First name</span>
            <input
              name="first_name"
              required
              className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
            />
          </label>

          <label className="block">
            <span>Last name</span>
            <input
              name="last_name"
              required
              className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
            />
          </label>

          <label className="block">
            <span>Username</span>
            <input
              name="username"
              required
              className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
            />
          </label>

          <label className="block">
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
            />
          </label>

          <label className="block">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
            />
          </label>

          <Button className="w-full">Continue to secure checkout</Button>
        </form>

        <p className="mt-4 text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
