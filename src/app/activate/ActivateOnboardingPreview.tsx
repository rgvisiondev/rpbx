"use client";

import Link from "next/link";

const steps = [
  "Create your account and start your 30-day free trial",
  "Add your business and financial details",
  "Review your listing details",
  "Go live and manage interest from your dashboard",
];

const statCards = [
  {
    label: "Guided setup",
    text: "A simple step-by-step flow that helps you get started without extra complexity.",
  },
  {
    label: "Private by design",
    text: "Built for confidential business discovery and connection with local investors.",
  },
  {
    label: "Manage in one place",
    text: "Track your listing, visibility, and next steps from one dashboard.",
  },
];

export default function ActivateOnboardingPreview() {
  return (
    <section
      aria-labelledby="activate-onboarding-heading"
      className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top px-4 py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1140px]">
        <div className="mx-auto text-center">
          <span className="inline-flex items-center rounded-full bg-[#EAF8F3] px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#2f7f67]">
            See How It Works
          </span>

          <h2
            id="activate-onboarding-heading"
            className="mt-4 text-[1.9rem] leading-[1.15] sm:text-[2.2rem]"
          >
            Create Your Listing in a Few Simple Steps
          </h2>

          <p className="mt-3 text-[15px] leading-7 text-slate-700 sm:text-base">
            Start your free trial, add your business details, and get in front
            of local investors through a guided workflow built to feel simple.
          </p>
        </div>

        <div className="mt-8 sm:mt-10 lg:mt-12 overflow-hidden rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.18fr]">
            <div className="p-5 sm:p-7 md:p-8 lg:p-10">
              <p className="text-sm font-semibold text-[#2f7f67]">
                For business owners
              </p>

              <h3 className="mt-2 text-[1.6rem] leading-[1.18] font-semibold text-slate-950 sm:text-[1.8rem] lg:text-[1.95rem]">
                Go from signup to a live listing with less friction
              </h3>

              <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-700 sm:text-base">
                RPBX is designed to help business owners create a professional
                listing, connect with local investors, and manage everything
                from one place.
              </p>

              <div className="mt-7 sm:mt-8 space-y-3.5">
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

              <div className="mt-7 sm:mt-8 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                <a
                  href="#activate-form"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#60BC9B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Start Your Free Trial
                </a>

                <Link
                  href="/business"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-[#60BC9B] hover:text-[#2f7f67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Learn More
                </Link>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 md:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Preview of the process
              </p>

              <div className="rounded-[22px] sm:rounded-[24px] lg:rounded-[28px] border border-slate-200 bg-white p-2 sm:p-2.5 md:p-3 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
                <div
                  className="mb-2.5 sm:mb-3 flex items-center gap-2 px-2 pt-1"
                  aria-hidden="true"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <div className="ml-2 sm:ml-3 h-7 sm:h-8 flex-1 rounded-full bg-slate-100" />
                </div>

                <div className="overflow-hidden rounded-[18px] sm:rounded-[20px] lg:rounded-[22px] border border-slate-200 bg-slate-100">
                  <video
                    className="block h-auto w-full"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster="/images/previews/listing-preview-poster.jpg"
                    aria-label="Preview of creating a business listing on RPBX"
                  >
                    <source
                      src="/videos/RPBX-Business-Onboarding.webm"
                      type="video/webm"
                    />
                    <source
                      src="/videos/RPBX-Business-Onboarding.mp4"
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
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