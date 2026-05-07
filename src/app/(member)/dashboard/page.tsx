export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import RecentActivityList from "./_components/RecentActivity";
import UpcomingEventsList from "./_components/UpcomingEvents";
import MatchedBusinesses from "./_components/MatchedBusinesses";
import MatchedInvestors from "./_components/MatchedInvestors";
import ListingTrafficChart from "./_components/ListingTrafficChart";
import NavGate from "@/app/components/NavGate";
import AlwaysVisibleScrollbar from "./_components/AlwaysVisibleScrollbar";

import {
  getBusinessDashboardData,
  type BusinessDashboardData,
} from "@/lib/dashboard/getBusinessDashboardData";
import {
  getInvestorDashboardData,
  type InvestorDashboardData,
} from "@/lib/dashboard/getInvestorDashboardData";

import { requireEntitlementOrNull } from "@/lib/serverGuard";

import { Experts } from "@/app/components/popups/Experts";

import Modal from "@/app/components/Modal";

import Image from "next/image";

import { experts } from "@/lib/advisors/advisors";
import { Mail } from "lucide-react";

import BillingStatusBanner from "./_components/BillingStatusBanner";
import OnboardingStatusBanner from "./_components/OnboardingStatusBanner";

export const metadata: Metadata = {
  title: "Dashboard | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

type DashboardData = BusinessDashboardData | InvestorDashboardData;

export default async function Dashboard() {
  const gate = await requireEntitlementOrNull();
  if (gate.block) {
    return null;
  }

  const { needsBillingFix, status } = gate;

  const userType: "business" | "investor" =
    gate.role === "investor" ? "investor" : "business";

  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  let onboardingBanner:
    | {
        show: boolean;
        label: string;
        message: string;
        href: string;
        ctaLabel: string;
      }
    | undefined;

  // Post-payment onboarding nudges
  if (userType === "investor") {
    const { data: inv } = await supabase
      .from("investor_profiles")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!inv) {
      redirect("/onboarding/investor/contact");
    }

    if (inv.status !== "published") {
      onboardingBanner = {
        show: true,
        label: "Profile Incomplete",
        message:
          "Finish onboarding to publish your investor profile and appear in business matches.",
        href: "/onboarding/investor/contact",
        ctaLabel: "Continue Onboarding",
      };
    }
  } else {
    const { data: draftListing } = await supabase
      .from("business_listings")
      .select("id, title, status, updated_at")
      .eq("owner_id", user.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftListing) {
      onboardingBanner = {
        show: true,
        label: "Listing Incomplete",
        message:
          "You have a draft listing that still needs onboarding before it can be published.",
        href: `/onboarding/business/${draftListing.id}/set-up`,
        ctaLabel: "Continue Listing Setup",
      };
    }
  }

  let dashboardData: DashboardData | null = null;
  let pagePaths: string[] = [];
  let labels: Record<string, string> = {};
  let chartTitle = "";
  let chartDescription = "";

  if (userType === "business") {
    const { data: owned } = await supabase
      .from("business_listings")
      .select("id, title, is_active")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(50);

    pagePaths = (owned ?? []).map((l) => `/business-listing/${l.id}`);
    labels = Object.fromEntries(
      (owned ?? []).map((l) => [`/business-listing/${l.id}`, l.title ?? l.id]),
    );

    chartTitle = "Listing Page Views";
    chartDescription = "GA4 page views for your listings (last 6 months)";
    dashboardData = await getBusinessDashboardData(supabase, user.id);
  } else {
    const { data: inv } = await supabase
      .from("investor_profiles")
      .select("id, first_name, last_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (inv) {
      const path = `/investor-listing/${inv.id}`;
      pagePaths = [path];
      const display =
        `${inv.first_name ?? ""} ${inv.last_name ?? ""}`.trim() ||
        "Your Profile";
      labels = { [path]: display };
    }

    chartTitle = "Profile Views";
    chartDescription =
      "GA4 page views for your investor profile (last 6 months)";
    dashboardData = await getInvestorDashboardData(supabase, user.id);
  }

  const { data: profRow } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle<{ first_name: string | null }>();

  const displayName =
    profRow?.first_name ??
    (user.user_metadata?.first_name as string | undefined) ??
    user.email ??
    "User";

  return (
    <div className="relative">
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
        <NavGate />
        <div className="w-full lg:max-w-[1140px] mx-auto px-5 lg:px-2 pt-4">
          <BillingStatusBanner show={needsBillingFix} status={status} />
          <OnboardingStatusBanner
            show={!!onboardingBanner?.show}
            label={onboardingBanner?.label ?? ""}
            message={onboardingBanner?.message ?? ""}
            href={onboardingBanner?.href ?? "#"}
            ctaLabel={onboardingBanner?.ctaLabel ?? "Continue"}
          />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2 pb-40 md:pb-52">
          <h1 className="mb-4">Welcome back, {displayName}</h1>
          <p className="text-sm text-gray-600 mb-6">
            {userType === "business"
              ? "Here’s what’s happening in your business today."
              : "Here’s what’s happening across your investment opportunities today."}
          </p>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col md:flex-row gap-5">
              <Link
                href={
                  userType === "business"
                    ? "/dashboard/listings"
                    : "/dashboard/profile/edit"
                }
                className="flex-1 flex flex-col items-center p-5 bg-[#60A1BC] rounded-2xl hover:opacity-90 transition"
              >
                <p className="text-white">
                  {userType === "business"
                    ? "View Listings"
                    : "Update Profile Info"}
                </p>
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex-1 flex flex-col items-center p-5 bg-[#60BC9B] rounded-2xl hover:opacity-90 transition"
              >
                <p className="text-white">Manage Subscription</p>
              </Link>
            </div>

            {dashboardData && (
              <>
                <div className="flex flex-col md:flex-row gap-5 w-full">
                  <div className="w-full md:w-1/2 lg:w-[60%] rounded-2xl flex flex-col bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center p-5">
                    <h3 className="text-white pb-5">Recent Activity</h3>
                    <RecentActivityList items={dashboardData.activities} />
                  </div>

                  <div className="w-full md:w-1/2 lg:w-[40%] bg-white rounded-2xl p-5">
                    <h3 className="pb-5">Upcoming Events</h3>
                    <UpcomingEventsList events={dashboardData.events} />
                  </div>
                </div>

                <div className="w-full lg:max-w-[1140px] mx-auto pb-80 md:pb-30">
                  <AlwaysVisibleScrollbar className="h-full">
                    <div className="min-w-[600px]">
                      <ListingTrafficChart
                        title={chartTitle}
                        description={chartDescription}
                        pagePaths={pagePaths}
                        seriesLabels={labels}
                        months={6}
                        emptyNote={
                          userType === "business"
                            ? "No listing traffic yet — once your listings get views, lines will appear here."
                            : "No profile views yet — share your profile and check back soon."
                        }
                      />
                    </div>
                  </AlwaysVisibleScrollbar>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {dashboardData && (
        <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center md:bg-fixed py-10 px-5 lg:px-2">
          <div className="relative -mt-120 md:-mt-82 -mb-18 z-10 w-full">
            <div className="bg-white flex flex-col w-full lg:max-w-[1140px] mx-auto rounded-2xl p-5 shadow-xl">
              <h2 className="pb-5">
                {dashboardData.kind === "business"
                  ? "Investor Matches"
                  : "Business Matches"}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-5">
                {dashboardData.kind === "business" ? (
                  <MatchedInvestors matches={dashboardData.matches} />
                ) : (
                  <MatchedBusinesses matches={dashboardData.matches} />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white flex flex-col w-full lg:max-w-[1140px] mx-auto rounded-2xl p-5 mt-30">
            <h2 className="pb-5">Trusted Advisors</h2>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">
                Need help reviewing an offer?
              </span>{" "}
              Talk to an expert about LOIs, purchase agreements, due diligence,
              and tax strategy.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5 pb-5">
              {experts.map((expert) => (
                <div
                  key={expert.index}
                  className="rounded-2xl border overflow-hidden bg-white"
                >
                  <div className="relative bg-[#272727] w-full h-[120px]">
                    <Modal
                      trigger={
                        <button
                          type="button"
                          className="cursor-pointer absolute top-3 right-3 text-white hover:text-[#9ed3c3] transition-colors"
                          aria-label={`Contact ${expert.name}`}
                        >
                          <Mail size={22} />
                        </button>
                      }
                    >
                      <Experts
                        image={expert.img}
                        name={expert.name}
                        description={expert.description}
                        title={expert.title}
                        email={expert.email}
                        defaultSection="contact"
                        contactHeadline={expert.contactHeadline}
                      />
                    </Modal>
                  </div>

                  <div className="p-5 flex flex-col items-center">
                    <div className="w-[144px] h-[144px] bg-white rounded-full border-4 border-[#272727] flex justify-center items-center -mt-[96px] relative z-10">
                      <Image
                        src={expert.img}
                        alt={expert.name}
                        width={136}
                        height={136}
                        className="w-[136px] h-[136px] rounded-full object-cover p-1"
                      />
                    </div>

                    <h4 className="mt-4 mb-2 large">{expert.name}</h4>
                    <p className="mt-1 text-[15px] text-[#4b4b4b] text-center">
                      {expert.shortDescription}
                    </p>

                    <div className="w-full mt-4 flex justify-end">
                      <Modal
                        trigger={
                          <button
                            type="button"
                            className="hover:cursor-pointer group inline-flex items-center gap-2 text-[14px] font-semibold text-[#272727] transition-colors hover:text-[#9ed3c3] focus:outline-none"
                          >
                            <span className="relative">
                              Read More
                              <span className="absolute left-0 -bottom-[2px] h-[2px] w-0 bg-[#9ed3c3] transition-all duration-300 group-hover:w-full" />
                            </span>
                            <span className="transition-transform duration-300 group-hover:translate-x-1">
                              →
                            </span>
                          </button>
                        }
                      >
                        <Experts
                          image={expert.img}
                          name={expert.name}
                          description={expert.description}
                          title={expert.title}
                          email={expert.email}
                          contactHeadline={expert.contactHeadline}
                        />
                      </Modal>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}