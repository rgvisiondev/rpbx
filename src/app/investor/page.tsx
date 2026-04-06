import Image from "next/image";
import Link from "next/link";
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import AuthForm from "../../components/AuthForm";
import VideoSection from "../components/VideoSection";
import type { Metadata } from "next";
import { BriefcaseBusiness, HandCoins, SearchCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About Investor Accounts | RioPlex Business Exchange",
  description:
    "Discover private investment opportunities, evaluate local businesses, and connect directly with owners through RioPlex Business Exchange.",
};

const investorUseCases = [
  {
    icon: <BriefcaseBusiness color="#60BC9B" size={28} />,
    title: "Acquire Established Businesses",
    description:
      "Explore established businesses with real operating history, local market presence, and long-term income potential.",
  },
  {
    icon: <HandCoins color="#60BC9B" size={28} />,
    title: "Invest in Growth Opportunities",
    description:
      "Find businesses seeking capital to expand, scale operations, or unlock their next phase of growth.",
  },
  {
    icon: <SearchCheck color="#60BC9B" size={28} />,
    title: "Back New & Emerging Ventures",
    description:
      "Discover newer opportunities and founder-led businesses early — your own private pipeline of local deal flow.",
  },
];

export default async function Investor() {
  return (
    <div>
      {/* SECTION 1 — HERO */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center">
        <NavGate />

        <div className="flex flex-col lg:flex-row py-10 lg:py-0">
          <div className="order-2 flex flex-1 items-center justify-center px-4 lg:order-1 lg:justify-end lg:p-[15px]">
            <div className="flex w-full max-w-lg flex-col items-center lg:w-[560px]">
              <h1 className="text-center leading-tight">
                Discover Opportunities.
                <br />
                Invest in Businesses <br />That Matter.
              </h1>

              <p className="mt-4 mb-6 text-center text-base leading-relaxed text-gray-600 lg:text-lg">
                Access a private marketplace of local businesses seeking
                acquisition, growth capital, or strategic investors — all in one
                place.
              </p>

              <AuthForm />
            </div>
          </div>

          <div className="hidden min-h-[450px] flex-1 bg-[url('/images/header/investor-header.png')] bg-cover bg-left bg-no-repeat lg:order-2 lg:block" />
        </div>
      </div>

      {/* SECTION 2 — BUILT FOR INVESTORS */}
      <section className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1140px]">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full bg-[#60BC9B]/15 px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#8BE3C3]">
              Built for investors like you
            </span>

            <h2 className="mt-4 text-white">
              One Platform. Multiple Ways to Invest.
            </h2>

            <p className="mt-4 text-[15px] leading-7 text-white sm:text-base">
              RPBX gives investors access to a private pipeline of businesses
              looking for full acquisition, growth capital, or strategic
              support.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {investorUseCases.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/95 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_50px_rgba(0,0,0,0.45)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#60BC9B]/15">
                  {item.icon}
                </div>

                <h4 className="mb-3 text-slate-900">{item.title}</h4>
                <p className="leading-7 text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — HOW IT WORKS */}
      <section className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1140px] px-0 lg:px-2">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
            {/* Left: heading + steps */}
            <div>
              <h2 className="text-slate-950">How It Works</h2>
              <p className="mt-2 mb-10 text-base text-slate-600 lg:text-lg">
                Access opportunities, evaluate fit, and connect directly with
                owners — all through one streamlined investor experience.
              </p>

              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4 transition-transform duration-300 lg:hover:translate-x-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#61BD9C]">
                    <h4 className="text-white">1</h4>
                  </div>
                  <div>
                    <h4 className="text-slate-900">Choose Your Plan</h4>
                    <p className="pt-2 text-sm leading-7 text-slate-600">
                      Select an investor plan that fits your goals and unlock
                      access to the investor dashboard and active listings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 transition-transform duration-300 lg:hover:translate-x-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#61BD9C]">
                    <h4 className="text-white">2</h4>
                  </div>
                  <div>
                    <h4 className="text-slate-900">Discover Opportunities</h4>
                    <p className="pt-2 text-sm leading-7 text-slate-600">
                      Browse private business listings and evaluate
                      opportunities by industry, location, and growth potential.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 transition-transform duration-300 lg:hover:translate-x-2">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#61BD9C]">
                    <h4 className="text-white">3</h4>
                  </div>
                  <div>
                    <h4 className="text-slate-900">Connect & Evaluate</h4>
                    <p className="pt-2 text-sm leading-7 text-slate-600">
                      Reach out directly to business owners, evaluate fit, and
                      explore investment opportunities on your terms.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: browser-framed carousel */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[620px] rounded-3xl border border-slate-200 bg-white p-4 shadow-xl lg:p-5">
                <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-[#60BC9B]/10 blur opacity-60" />

                <div className="relative rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] sm:p-3 md:p-4">
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
                      className="mx-auto block w-full max-h-[400px] h-auto object-cover"
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — AS AN INVESTOR */}
      <section className="bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-8 md:flex-row md:items-center md:gap-10">
          <div className="flex-1 flex flex-col items-center rounded-2xl">
            <Image
              src="/images/other/investor-mockup.png"
              alt="Investor dashboard"
              width={2000}
              height={450}
              className="w-full h-auto transition-transform duration-300 lg:hover:-translate-y-2"
              priority
            />
          </div>

          <div className="flex-1">
            <span className="inline-flex items-center rounded-full bg-[#EAF8F3] px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-[#2f7f67]">
              As an investor
            </span>

            <h3 className="mt-4">
              Access a Stronger Pipeline of Local Deal Flow
            </h3>

            <p className="py-5 text-[15px] leading-7 text-slate-700 sm:text-base">
              Gain access to a curated pipeline of businesses actively seeking
              investors. Filter opportunities, evaluate potential, and connect
              directly with owners — all from one streamlined dashboard designed
              for serious investors.
            </p>

            <ul className="mb-6 space-y-3 text-sm text-gray-600">
              <li>• Access real, local deal flow</li>
              <li>• Evaluate opportunities on your timeline</li>
              <li>• Connect directly with business owners</li>
            </ul>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/subscribe/investor_plan" className="sm:max-w-fit">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom video section for YouTube explainer */}
      <VideoSection videoUrl="https://youtube.com/embed/GLsAlbAw7og" />
    </div>
  );
}
