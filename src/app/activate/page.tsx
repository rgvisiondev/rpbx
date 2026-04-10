import NavBarActivate from "../components/NavBarActivate";
import type { Metadata } from "next";

// Utils
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";

import { ActivateForm } from "./activateform";
import ValuateCta from "../components/valuate-cta";
import ActivateOnboardingPreview from "./ActivateOnboardingPreview";

// Icons
import { BadgeCheck, Network, Map, Goal } from "lucide-react";

export const metadata: Metadata = {
  title: "Start 30 Days Free | RioPlex Business Exchange",
  description:
    "Start your 30-day free trial on RioPlex Business Exchange and connect with local investors through a guided business listing experience.",
};

export default async function Activate() {
  const supabase = await createClientRSC();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (
    error &&
    error.message !== "Auth session missing!" &&
    error.status !== 400
  ) {
    console.error("Unexpected auth error:", error);
  }

  if (session?.user) {
    return redirect("/dashboard");
  }

  const points = [
    {
      icon: <Network color="#60BC9B" size={32} />,
      title: "Direct Access",
      description:
        "Get in front of investors without relying on cold outreach or scattered connections.",
    },
    {
      icon: <Map color="#60BC9B" size={32} />,
      title: "Local Investors",
      description:
        "Connect with investors who understand the Rio Grande Valley and the businesses growing here.",
    },
    {
      icon: <Goal color="#60BC9B" size={32} />,
      title: "Focused Exposure",
      description:
        "Show your business to investors actively looking for opportunities like yours.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-slate-800 antialiased">
      <style>{`
        :root {
          --color-primary: #60BC9B;
          --color-primary-dark: #4da685;
        }

        .hero-bg {
          background-image:
            linear-gradient(to bottom right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.85)),
            url('/images/header/building2.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
      `}</style>

      <nav>
        <NavBarActivate />
      </nav>

      <header className="hero-bg relative overflow-hidden pt-32 pb-24 lg:pt-40 lg:pb-32">
        <div className="container mx-auto grid max-w-[1140px] items-center gap-14 px-6 pb-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-10 w-full">
            <div className="inline-block rounded-full border border-[#60BC9B]/50 bg-[#60BC9B]/20 px-3 py-1 text-sm font-bold uppercase tracking-wide text-[#60BC9B] shadow-sm">
              Start with 30 days free
            </div>

            <h1 className="activatepage mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Start Your Business Listing Free for 30 Days
            </h1>

            <div className="pb-4 pt-6 text-lg font-medium text-slate-200">
              Create your listing, get in front of local investors, and manage
              everything through one guided dashboard built for business owners.
            </div>

            <div className="pb-8 text-base font-medium text-slate-300">
              Members also receive <span className="font-semibold text-white">50% off</span> a professional business valuation.
            </div>

            <div className="flex flex-col gap-4 text-base font-medium text-slate-300 sm:flex-row sm:flex-wrap sm:gap-6 lg:text-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Guided setup
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Local investor access
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Secure account creation
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full lg:ml-auto">
            <div className="absolute -inset-1 rounded-2xl bg-[#60BC9B] opacity-20 blur" />

            <div
              id="activate-form"
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-2xl md:p-8"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Start Your Free Trial
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  30 days free for Business Owner Legacy.
                </p>
              </div>

              <ActivateForm />
            </div>
          </div>
        </div>

        <div
          className="absolute bottom-0 z-10 h-[60px] w-full leading-[0] md:h-[120px]"
          style={{
            backgroundImage: "url('/images/backgrounds/white-bg.png')",
            backgroundRepeat: "repeat",
            backgroundPosition: "bottom",
            maskImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z' fill='black'/%3E%3C/svg%3E\")",
            WebkitMaskImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 1200 120' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z' fill='black'/%3E%3C/svg%3E\")",
            maskSize: "100% 100%",
            WebkitMaskSize: "100% 100%",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      </header>

      <main className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
        <ActivateOnboardingPreview />

        <section className="px-4 pb-16 pt-4 sm:pb-20">
          <div className="mx-auto max-w-[1140px]">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Your Gateway to Local Investors
              </h2>
              <p className="mt-4 text-slate-600">
                RPBX gives your business direct access, local credibility, and
                focused exposure to investors who are ready to engage.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {points.map((point, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#60BC9B]/20 shadow-sm">
                    {point.icon}
                  </div>
                  <h4 className="mb-3 text-slate-900">{point.title}</h4>
                  <p className="leading-relaxed text-slate-600">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:pb-20">
          <div className="mx-auto max-w-[1140px]">
            <ValuateCta sourcePage="activate-page"/>
          </div>
        </section>
      </main>
    </div>
  );
}