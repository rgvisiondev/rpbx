// app/(member)/dashboard/page.tsx
export const revalidate = 0;

import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { blogClient } from "@/sanity/client";
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

export const metadata: Metadata = {
  title: "User Dashboard | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

type DashboardData = BusinessDashboardData | InvestorDashboardData;

export default async function Dashboard() {
  // Let the (member)/layout handle the paywall/verification UX.
  // If blocked, don't fetch anything private here.
  const gate = await requireEntitlementOrNull();
  if (gate.block) {
    // Layout will show the overlay + blur or redirect; render nothing here.
    return null;
  }

  // From here down, user is entitled & verified.
  const userType: "business" | "investor" = (gate.role ?? "business") as
    | "business"
    | "investor";

  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Post-payment onboarding nudges
  if (userType === "investor") {
    const { data: inv } = await supabase
      .from("investor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!inv) {
      redirect("/onboarding/investor/contact");
    }
  } else {
    const { count } = await supabase
      .from("business_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("is_active", true);
    if (!count) {
      redirect("/onboarding/business/set-up");
    }
  }

  // Fetch private dashboard data now that we know it's safe
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
      (owned ?? []).map((l) => [`/business-listing/${l.id}`, l.title ?? l.id])
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
        `${inv.first_name ?? ""} ${inv.last_name ?? ""}`.trim() || "Your Profile";
      labels = { [path]: display };
    }

    chartTitle = "Profile Views";
    chartDescription = "GA4 page views for your investor profile (last 6 months)";
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

const posts = await blogClient.fetch(
        `*[_type == "post"] | order(publishedAt desc)[0...4]{
          _id,
          title,
          slug,
          publishedAt,
          read,
        }`
      );


  return (
    <div className="relative">
      {/* Header / Hero */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <NavGate />
        <div className="flex flex-col w-full lg:w-[1140px] mx-auto py-10 px-5 lg:px-0 pb-40 md:pb-52">
          <h1 className="mb-4">Welcome back, {displayName}</h1>
          <p className="text-sm text-gray-600 mb-6">
            {userType === "business" ? "Here’s what’s happening in your business today." : "Here’s what’s happening across your investment opportunities today."  }
          </p>

        <div className="flex flex-col gap-10">
          {/* Action buttons */}
          <div className="flex flex-col lg:flex-row gap-5">
            <Link
              href={userType === "business" ? "/dashboard/listings" : "dashboard/profile/edit"}
              className="flex-1 flex flex-col items-center p-5 bg-[#60A1BC] rounded-2xl hover:opacity-90 transition"
            >
              <p className="text-white">
                {userType === "business" ? "View Listings" : "Update Profile Info"}
              </p>
            </Link>
            <Link
              href= "/dashboard/billing"
              className= "flex-1 flex flex-col items-center p-5 bg-[#60BC9B] rounded-2xl hover:opacity-90 transition"
            >
              <p className="text-white">
                Manage Subscription
              </p>
            </Link>
          </div>

          {/* Data widgets */}
          {dashboardData && (
            <>
              <div className="flex flex-col lg:flex-row gap-5 w-full">
                <div className="w-full lg:w-[60%] rounded-2xl flex flex-col bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center p-5">
                  <h3 className="text-white pb-5">Recent Activity</h3>
                  <RecentActivityList items={dashboardData.activities} />
                </div>

                <div className="w-full lg:w-[40%] bg-white rounded-2xl p-5">
                  <h3 className="pb-5">Upcoming Events</h3>
                  <UpcomingEventsList events={dashboardData.events} />
                </div>
              </div>

<div className="w-full lg:w-[1140px] mx-auto pb-80 md:pb-30">
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

      {/* Matches + Resources */}
      {dashboardData && (
        <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center md:bg-fixed py-10 px-5 lg:px-0">
          <div className="relative -mt-120 md:-mt-82 -mb-18 z-10 w-full">
            <div className="bg-white flex flex-col w-full lg:w-[1140px] mx-auto rounded-2xl p-5 shadow-xl">
              <h2 className="pb-5">
                {dashboardData.kind === "business" ? "Investor Matches" : "Business Matches"}
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

          <div className="bg-white flex flex-col w-full lg:w-[1140px] mx-auto rounded-2xl p-5 mt-30">
            <h2 className="pb-5">Resources</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-5">
              {(() => {
                interface PostSlug {
                  current: string;
                }
                interface BlogPost {
                  _id: string;
                  title: string;
                  excerpt?: string;
                  slug: PostSlug;
                  publishedAt?: string;
                  read?: boolean;
                }
                return (posts as BlogPost[]).map((post) => (
                  <div key={post.slug.current} className="bg-[#F3F3F3] rounded-2xl p-5">
                    <h4 className="pb-1">{post.title}</h4>
                      <span className="flex flex-row gap-3">
                        <p className="flex">
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Unknown date"}
                        </p>
                        <p>•</p>
                        <p className="flex">{post.read} min read</p>
                      </span>
                    <Link href={`/blog/${post.slug.current}`} className="green-link">
                      Read Blog
                    </Link>
                  </div>
                ));
              })()}
            </div>

            <button className="px-6 py-2 rounded-full font-medium transition inline-flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white mt-5">
              View More Resources
            </button>
          </div>



        </div>
      )}
    </div>
  );
}
