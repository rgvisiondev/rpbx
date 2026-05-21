"use client";

import Link from "next/link";

const steps = [
  "Choose your investor plan and create your account",
  "Set up your investor profile and investment preferences",
  "Browse private business listings by industry, location, and fit",
  "Connect with owners and evaluate opportunities on your terms",
];

const statCards = [
  {
    label: "Local deal flow",
    text: "Find opportunities across local and regional Texas markets.",
  },
  {
    label: "Private listings",
    text: "Review structured owner-submitted listing details.",
  },
  {
    label: "Direct connection",
    text: "Move from interest to conversation faster with business owners.",
  },
];

export default function InvestorOnboardingPreview() {
  return (
    <section
      aria-labelledby="investor-onboarding-heading"
      className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top px-4 py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1140px]">
        <div className="mx-auto text-center">
          <span className="inline-flex items-center rounded-full bg-[#EAF8F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f7f67] sm:text-xs">
            See How Investor Access Works
          </span>

          <h2
            id="investor-onboarding-heading"
            className="mt-4 text-[1.9rem] leading-[1.15] text-slate-950 sm:text-[2.2rem]"
          >
            Build Your Investor Profile in a Few Simple Steps
          </h2>

          <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:text-base">
            Set your preferences, review local business opportunities, and
            connect with owners through a guided investor experience.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:mt-10 sm:rounded-[28px] lg:mt-12 lg:rounded-[32px]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.18fr]">
            <div className="p-5 sm:p-7 md:p-8 lg:p-10">
              <p className="text-sm font-semibold text-[#2f7f67]">
                For investors
              </p>

              <h3 className="mt-2 text-[1.6rem] font-semibold leading-[1.18] text-slate-950 sm:text-[1.8rem] lg:text-[1.95rem]">
                Go from account creation to local deal discovery
              </h3>

              <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-700 sm:text-base">
                RPBX helps investors create a focused profile, discover
                owner-submitted business opportunities, and start conversations
                with the right local business owners.
              </p>

              <div className="mt-7 space-y-3.5 sm:mt-8">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#60BC9B] text-sm font-semibold text-white">
                      {index + 1}
                    </div>

                    <p className="pt-0.5 text-[15px] leading-7 text-slate-800 sm:text-base">
                      {step}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:mt-8 sm:flex sm:flex-wrap">
                <a
                  href="#investor-access-form"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#60BC9B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#4da685] sm:w-auto"
                >
                  Create Investor Account
                </a>

                <Link
                  href="/investors"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-[#60BC9B] hover:text-[#2f7f67] sm:w-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 md:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Preview of the investor process
              </p>

              <div className="rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:rounded-[24px] sm:p-2.5 md:p-3 lg:rounded-[28px]">
                <div
                  className="mb-2.5 flex items-center gap-2 px-2 pt-1 sm:mb-3"
                  aria-hidden="true"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="ml-2 h-7 flex-1 rounded-full bg-slate-100 sm:ml-3 sm:h-8" />
                </div>

                <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100 sm:rounded-[20px] lg:rounded-[22px]">
                  <video
                    className="block h-auto w-full"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/images/onboarding/investor-onboarding-final.png"
                    aria-label="Preview of creating an investor profile on RPBX"
                  >
                    <source
                      src="/videos/RPBX-Investor-Onboarding.webm"
                      type="video/webm"
                    />
                    <source
                      src="/videos/RPBX-Investor-Onboarding.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 md:grid-cols-3">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                      {card.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}