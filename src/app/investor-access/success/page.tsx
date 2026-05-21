// app/investor-access/success/page.tsx

import Image from "next/image";
import Link from "next/link";
import Stripe from "stripe";
import {
  CircleCheckBig,
  MailCheck,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

import { createClientRSC } from "@/../utils/supabase/server";
import EmailVerifiedCTA from "@/components/EmailVerifiedCTA";
import { AdsSubscribeConversion } from "@/components/analytics/AdsSubscribeConversion";
import { getStripe } from "@/lib/stripe";

type Role = "business" | "investor" | "admin" | "member" | null;

function asRole(v?: string | null): Exclude<Role, null> | null {
  return v === "investor" || v === "business" || v === "admin" ? v : null;
}

function nextPathForRole(role: Role) {
  if (role === "investor") return "/onboarding/investor/contact";
  if (role === "business") return "/dashboard/listings";
  if (role === "admin") return "/admin";

  return "/dashboard";
}

async function getCheckoutContext(sessionId?: string): Promise<{
  intendedRole: Role;
  isVerified: boolean;
}> {
  if (!sessionId) {
    return { intendedRole: null, isVerified: false };
  }

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const subscription =
      typeof session.subscription === "object" && session.subscription !== null
        ? (session.subscription as Stripe.Subscription)
        : null;

    const intendedFromSub = asRole(
      subscription?.metadata?.intended_user_type ??
        subscription?.metadata?.user_type_intended,
    );

    const intendedFromSession = asRole(
      session.metadata?.intended_user_type ??
        session.metadata?.user_type_intended,
    );

    const intendedRole = intendedFromSub ?? intendedFromSession ?? null;

    const isVerified =
      session.status === "complete" &&
      Boolean(subscription) &&
      subscription?.status === "active";

    return { intendedRole, isVerified };
  } catch (error) {
    console.error("[InvestorAccessSuccess] Invalid checkout session:", error);
    return { intendedRole: null, isVerified: false };
  }
}

export const metadata = {
  title: "Investor Account Created | RioPlex Business Exchange",
  description:
    "Your RioPlex Business Exchange investor account has been created. Verify your email to continue onboarding.",
};

export default async function InvestorAccessSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const sp = await searchParams;

  const sessionId = Array.isArray(sp.session_id)
    ? sp.session_id[0]
    : sp.session_id;

  const { intendedRole, isVerified } = await getCheckoutContext(sessionId);

  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role = intendedRole;
  let continuePath = nextPathForRole(intendedRole);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle<{ user_type: Role }>();

    role = profile?.user_type ?? intendedRole ?? "member";
    continuePath = nextPathForRole(role);
  }

  const loginNext = encodeURIComponent(continuePath || "/onboarding/investor/contact");

  return (
    <div className="min-h-screen bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center px-4 py-10">
      {isVerified && sessionId ? (
        <AdsSubscribeConversion sessionId={sessionId} />
      ) : null}

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-gradient-to-br from-[#9ed3c3]/35 via-white to-white p-8 text-center sm:p-10 lg:text-left">
              <Image
                src="/images/logos/Rio-Plex-Logo-Main-Mint-&-Charcoal.png"
                alt="RioPlex Business Exchange"
                width={2000}
                height={450}
                className="mx-auto h-auto w-64 lg:mx-0"
                priority
              />

              <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[#9ed3c3]/60 bg-white/80 px-4 py-2 text-sm font-semibold text-neutral-800 shadow-sm">
                <CircleCheckBig className="h-4 w-4 text-[#60BC9B]" />
                Investor access activated
              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                Your investor account is ready
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">
                Your investor subscription has been saved successfully. To
                protect your account, please verify your email before continuing
                into your investor onboarding.
              </p>

              <div className="mt-8 grid gap-3 text-left sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-neutral-200">
                  <MailCheck className="mb-3 h-5 w-5 text-[#60BC9B]" />
                  <p className="font-semibold text-neutral-900">Verify email</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Confirm your account securely.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-neutral-200">
                  <ShieldCheck className="mb-3 h-5 w-5 text-[#60BC9B]" />
                  <p className="font-semibold text-neutral-900">
                    Build profile
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Set your investor preferences.
                  </p>
                </div>

                <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-neutral-200">
                  <SearchCheck className="mb-3 h-5 w-5 text-[#60BC9B]" />
                  <p className="font-semibold text-neutral-900">
                    Review listings
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Explore local opportunities.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 sm:p-10">
              {isVerified ? (
                <>
                  <div className="rounded-2xl border border-[#9ed3c3]/50 bg-[#9ed3c3]/10 p-5">
                    <p className="text-sm font-semibold text-neutral-950">
                      Next step
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      We sent a verification link to the email used during
                      checkout. After verifying, continue to your investor
                      onboarding flow.
                    </p>
                  </div>

                  <div className="mt-6">
                    {user ? (
                      <Link
                        href={continuePath}
                        className="inline-flex w-full items-center justify-center rounded-full bg-[#60BC9B] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#4da685]"
                      >
                        Continue to investor onboarding
                      </Link>
                    ) : (
                      <EmailVerifiedCTA loginNext={loginNext} />
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-950">
                    We could not verify this checkout session
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    If you just completed checkout, please check your email for
                    next steps or contact our team for help.
                  </p>

                  <Link
                    href="/investor-access"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-neutral-800"
                  >
                    Return to investor access page
                  </Link>
                </div>
              )}

              <p className="mt-8 text-center text-xs leading-5 text-neutral-500">
                Need help? Contact us at{" "}
                <a className="underline" href="tel:9563225942">
                  956-322-5942
                </a>{" "}
                or{" "}
                <a className="underline" href="mailto:info@rioplexbizx.com">
                  info@rioplexbizx.com
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}