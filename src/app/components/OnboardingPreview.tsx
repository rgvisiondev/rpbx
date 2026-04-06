"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";

type PreviewTab = "business" | "investor";

const previewContent = {
  business: {
    tabLabel: "List a Business",
    eyebrow: "For business owners",
    headline: "Create your listing in a few simple steps",
    body: "Create a confidential business listing with a guided setup designed to help you get in front of the right investors faster.",
    steps: [
      "Add your basic business details",
      "Enter key financial and listing information",
      "Review your listing details",
      "Go live and manage your listing from your dashboard",
    ],
    ctaHref: "/business",
    ctaLabel: "Explore Business Owner Details",
    videoSrc: "/videos/RPBX-Business-Onboarding.mp4",
    posterSrc: "/images/onboarding/business-onboarding-final.png",
    alt: "Preview of creating a business listing on RPBX",
    statCards: [
      {
        label: "Guided setup",
        text: "A simple step-by-step flow to help you get started.",
      },
      {
        label: "Private by design",
        text: "Built for confidential business discovery and connection.",
      },
      {
        label: "Manage in one place",
        text: "Update details, visibility, and next steps from one dashboard.",
      },
    ],
  },
  investor: {
    tabLabel: "Create Investor Profile",
    eyebrow: "For investors",
    headline: "Set up your investor profile with a clear guided flow",
    body: "Create your investor profile, define your interests, and access relevant opportunities through one clear dashboard experience.",
    steps: [
      "Create your investor account",
      "Set your profile and investment preferences",
      "Browse relevant opportunities and insights",
      "Track activity and manage opportunities from your dashboard",
    ],
    ctaHref: "/investor",
    ctaLabel: "Explore Investor Details",
    videoSrc: "/videos/RPBX-Investor-Onboarding.mp4",
    posterSrc: "/images/onboarding/investor-onboarding-final.png",
    alt: "Preview of creating an investor profile on RPBX",
    statCards: [
      {
        label: "Fast setup",
        text: "Get through the core setup quickly without extra complexity.",
      },
      {
        label: "Relevant opportunities",
        text: "See listings and activity that match your interests.",
      },
      {
        label: "Clear next steps",
        text: "Use one dashboard to review activity and manage opportunities.",
      },
    ],
  },
} satisfies Record<
  PreviewTab,
  {
    tabLabel: string;
    eyebrow: string;
    headline: string;
    body: string;
    steps: string[];
    ctaHref: string;
    ctaLabel: string;
    videoSrc: string;
    posterSrc: string;
    alt: string;
    statCards: { label: string; text: string }[];
  }
>;

export default function OnboardingPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>("business");
  const active = useMemo(() => previewContent[activeTab], [activeTab]);

  const businessTabId = useId();
  const investorTabId = useId();
  const panelId = useId();

  return (
    <section
      aria-labelledby="onboarding-preview-heading"
      className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top px-4 py-14 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1140px]">

        <div className="mt-8 sm:mt-10 lg:mt-12 overflow-hidden rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-[0.98fr_1.12fr]">
            <div className="p-5 sm:p-7 md:p-8 lg:p-10">
              <div
                role="tablist"
                aria-label="Choose a preview type"
                className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:inline-flex sm:flex-wrap sm:gap-1.5"
              >
                <button
                  id={businessTabId}
                  role="tab"
                  aria-selected={activeTab === "business"}
                  aria-controls={panelId}
                  type="button"
                  onClick={() => setActiveTab("business")}
                  className={`cursor-pointer min-h-[48px] w-full rounded-xl px-5 py-3 text-sm font-medium text-left sm:w-auto sm:text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 ${
                    activeTab === "business"
                      ? "bg-[#60BC9B] text-white shadow-sm"
                      : "bg-white text-slate-700 hover:text-[#2f7f67]"
                  }`}
                >
                  List a Business
                </button>

                <button
                  id={investorTabId}
                  role="tab"
                  aria-selected={activeTab === "investor"}
                  aria-controls={panelId}
                  type="button"
                  onClick={() => setActiveTab("investor")}
                  className={`cursor-pointer min-h-[48px] w-full rounded-xl px-5 py-3 text-sm font-medium text-left sm:w-auto sm:text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 ${
                    activeTab === "investor"
                      ? "bg-[#60BC9B] text-white shadow-sm"
                      : "bg-white text-slate-700 hover:text-[#2f7f67]"
                  }`}
                >
                  Create Investor Profile
                </button>
              </div>

              <div
                id={panelId}
                role="tabpanel"
                aria-labelledby={
                  activeTab === "business" ? businessTabId : investorTabId
                }
                className="mt-7 sm:mt-8"
              >
                <p className="text-sm font-semibold text-[#2f7f67]">
                  {active.eyebrow}
                </p>

                <h3 className="mt-2 text-[1.6rem] leading-[1.18] font-semibold text-slate-950 sm:text-[1.8rem] lg:text-[1.95rem]">
                  {active.headline}
                </h3>

                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-700 sm:text-base">
                  {active.body}
                </p>

                <div className="mt-7 sm:mt-8 space-y-3.5">
                  {active.steps.map((step, index) => (
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
                  <Link
                    href={active.ctaHref}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-[#60BC9B] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    {active.ctaLabel}
                  </Link>

                  <Link
                    href="/faq"
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition-colors hover:border-[#60BC9B] hover:text-[#2f7f67] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7f67] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Common FAQ&apos;s
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7 md:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Preview of the process
              </p>

              <div className="rounded-[22px] sm:rounded-[24px] lg:rounded-[28px] border border-slate-200 bg-white p-2.5 sm:p-3 md:p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
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
                    key={active.videoSrc}
                    className="block w-full h-auto"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    poster={active.posterSrc}
                    aria-label={active.alt}
                  >
                    <source
                      src={active.videoSrc.replace(".mp4", ".webm")}
                      type="video/webm"
                    />
                    <source src={active.videoSrc} type="video/mp4" />
                  </video>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                {active.statCards.map((card) => (
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
