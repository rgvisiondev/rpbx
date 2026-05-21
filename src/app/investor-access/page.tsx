import Link from "next/link";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Handshake,
  LockKeyhole,
  MapPin,
  WalletCards,
} from "lucide-react";

import NavBarActivate from "../components/NavBarActivate";
import { InvestorAccessForm } from "./InvestorAccessForm";
import InvestorOnboardingPreview from "./InvestorOnboardingPreview";
import { createClientRSC } from "../../../utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Investor Access | RioPlex Business Exchange",
  description:
    "Create your investor account to discover local business opportunities, review owner-submitted listings, and connect directly with business owners through RioPlex Business Exchange.",
};

const accessFeatures = [
  {
    icon: <MapPin className="h-5 w-5 text-[#60BC9B]" />,
    title: "Local Market Focus",
    description:
      "Find opportunities across local and regional Texas markets where relationships still matter.",
  },
  {
    icon: <WalletCards className="h-5 w-5 text-[#60BC9B]" />,
    title: "Financial Ranges",
    description:
      "Review key owner-submitted ranges like revenue, cash flow, EBITDA, and asking context when available.",
  },
  {
    icon: <Handshake className="h-5 w-5 text-[#60BC9B]" />,
    title: "Direct Owner Connection",
    description:
      "Move from interest to conversation faster by connecting with business owners through one platform.",
  },
  {
    icon: <LockKeyhole className="h-5 w-5 text-[#60BC9B]" />,
    title: "Confidential by Design",
    description:
      "Listings are structured to help business owners share useful details while keeping sensitive information controlled.",
  },
];

const faqs = [
  {
    question: "Is this only for buying a business?",
    answer:
      "No. Investors can use RPBX to explore full acquisitions, partial investment opportunities, growth capital conversations, or strategic partnerships.",
  },
  {
    question: "What happens after I create an investor account?",
    answer:
      "You can set up your investor profile, access the investor dashboard, review available business listings, and connect with business owners when there is a fit.",
  },
  {
    question: "Are the listings verified?",
    answer:
      "RPBX gives investors structured, owner-submitted listing information. Investors should still perform their own due diligence before making investment or acquisition decisions.",
  },
  {
    question: "Can I contact business owners directly?",
    answer:
      "Yes. Investor access is designed to help serious investors connect with business owners when an opportunity matches their goals.",
  },
];

export default async function InvestorAccessPage() {
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
        <NavBarActivate 
        ctaText="Get Investor Access"
        ctaHref="/subscribe/investor_monthly"
        />
      </nav>

      <header className="hero-bg relative overflow-hidden pb-24 pt-32 lg:pb-32 lg:pt-40">
        <div className="container mx-auto grid max-w-[1140px] items-center gap-14 px-6 pb-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative z-10 w-full">
            <div className="inline-block rounded-full border border-[#60BC9B]/50 bg-[#60BC9B]/20 px-3 py-1 text-sm font-bold uppercase tracking-wide text-[#60BC9B] shadow-sm">
              Investor access
            </div>

            <h1 className="activatepage mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              Find Local Businesses Looking for the Right Investor.
            </h1>

            <div className="pb-4 pt-6 text-lg font-medium text-slate-200">
              Create your investor account to browse private business
              opportunities, review owner-submitted details, and connect with
              local business owners through RioPlex Business Exchange.
            </div>

            <div className="pb-8 text-base font-medium text-slate-300">
              Build a private local deal pipeline with listings, matches, and
              direct owner connection paths in one platform.
            </div>

            <div className="flex flex-col gap-4 text-base font-medium text-slate-300 sm:flex-row sm:flex-wrap sm:gap-6 lg:text-sm">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Private listings
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Local deal flow
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} /> Direct owner access
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto w-full lg:ml-auto">
            <div className="absolute -inset-1 rounded-2xl bg-[#60BC9B] opacity-20 blur" />

            <div
              id="investor-access-form"
              className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-2xl md:p-8"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">
                  Create Your Investor Account
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Get access to local business opportunities and start building
                  your private deal pipeline.
                </p>
              </div>

              <InvestorAccessForm />
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
        <section className="px-4 pb-16 pt-4 sm:pb-20">
          <div className="mx-auto max-w-[1140px]">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Evaluate Fit Before You Start the Conversation.
              </h2>
              <p className="mt-4 text-slate-600">
                Investor access gives you a clearer view of available business
                opportunities, so you can focus on owners and listings that
                match your goals.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {accessFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#60BC9B]/20 shadow-sm">
                    {feature.icon}
                  </div>
                  <h4 className="mb-3 text-slate-900">{feature.title}</h4>
                  <p className="leading-relaxed text-slate-600">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <InvestorOnboardingPreview />

        <section className="px-4 pb-16 lg:pb-20">
          <div className="mx-auto max-w-[900px]">
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-[#EAF8F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#2f7f67] sm:text-xs">
                Investor questions
              </span>

              <h2 className="mt-4 text-slate-950">Common Questions</h2>
            </div>

            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold text-slate-950">
                    <div className="flex items-center justify-between gap-4">
                      <span>{faq.question}</span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF8F3] text-[#2f7f67] transition group-open:rotate-45">
                        +
                      </span>
                    </div>
                  </summary>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 lg:pb-24">
          <div className="mx-auto max-w-[1140px]">
            <div className="relative grid items-center gap-8 overflow-hidden rounded-[40px] bg-[url('/images/backgrounds/footer-bg.png')] bg-center bg-fixed p-8 text-white shadow-[0_18px_60px_rgba(15,23,42,0.16)] lg:grid-cols-2 lg:gap-12">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#4da685]/20 blur-3xl" />

              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full bg-[#60BC9B]/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8BE3C3]">
                  Ready to start?
                </span>

                <h2 className="mb-6 mt-4 text-white">
                  Find Local Deal Flow Through RPBX.
                </h2>

                <ul className="mb-8 space-y-4">
                  {[
                    "Browse private business opportunities",
                    "Review financial and location range previews",
                    "Connect directly with business owners",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-slate-300"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#60BC9B] text-slate-900">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-[#60BC9B]">
                        Recommended
                      </span>
                      <h4 className="text-xl font-bold text-white">
                        Investor Access
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-bold">$76/mo</span>
                      <p className="text-[10px] uppercase text-white">
                        Deal flow access
                      </p>
                    </div>
                  </div>

                  <a href="#investor-access-form" className="block w-full">
                    <button className="w-full rounded-2xl bg-[#60BC9B] py-4 font-bold text-white transition hover:cursor-pointer hover:bg-[#4da685]">
                      Create Investor Account
                    </button>
                  </a>
                </div>

                <div className="rounded-3xl border border-white/5 bg-white/5 p-5 text-center transition hover:bg-white/10 lg:text-left">
                  <h4 className="pb-3 font-bold text-white">
                    Still exploring?
                  </h4>

                  <Link href="/investor" className="block w-full">
                    <button className="w-full rounded-2xl border border-white/15 bg-white/10 py-4 font-bold text-white transition hover:cursor-pointer hover:bg-white/15">
                      Learn More First
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
