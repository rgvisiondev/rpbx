// app/investor-listing/[id]/page.tsx
import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Image from "next/image";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { notFound } from "next/navigation";
import Modal from "@/app/components/Modal";
import ContactInvestor from "@/app/components/popups/ContactInvestor";
import { BadgeCheckIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


function formatRangeLabel(v?: string | null) {
  if (!v) return "—";
  return v
    .replace(/</, "< ")
    .replace(/>/, "> ")
    .replace(/-/g, " - ")
    .replace(/k\b/gi, "K")
    .replace(/m\b/gi, "M");
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientRSC();

  const { data } = await supabase
    .from("investor_profiles")
    .select("first_name, last_name, organization_entity, status")
    .eq("id", id)
    .maybeSingle();

  const fullName =
    [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() || "Investor";
  const org = data?.organization_entity ?? "";
  const nameAndOrg = org ? `${fullName} — ${org}` : fullName;
  const published = data?.status === "published";

  return {
    title: `${nameAndOrg} | RioPlex Business Exchange`,
    description: published
      ? `View details for ${fullName}${org ? ` at ${org}` : ""}`
      : "Investor profile",
  };
}

export default async function InvestorPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClientRSC();

  // Fetch the current logged-in user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch business owner information if logged in
  let businessName: string | undefined;
  let industry: string | undefined;
  let location: string | undefined;
  let businessDescription: string | undefined;

  if (user) {
    const { data: listing } = await supabase
      .from("business_listings")
      .select("title, industry, city, county, description")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listing) {
      businessName = listing.title || undefined;
      industry = listing.industry || undefined;
      location = [listing.city, listing.county].filter(Boolean).join(", ") || undefined;
      businessDescription = listing.description || undefined;
    }
  }

  // Fetch the investor (note: includes user_id now)
  const { data: inv, error } = await supabase
    .from("investor_profiles")
    .select(`
      id,
      user_id,
      status,
      first_name,
      last_name,
      organization_entity,
      industry_experience,
      city,
      primary_industry,
      additional_industries,
      ownership_min,
      ownership_max,
      target_ebitda,
      target_cash_flow,
      net_worth,
      avatar_path,
      bio,
      contact_email,
      industry_experience,
      is_accredited_investor,
      updated_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("Investor fetch failed:", error.message);
  if (!inv || inv.status !== "published") notFound();

  // Sign avatar URL if present
  let avatarUrl: string | null = null;
  if (inv.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("investors")
      .createSignedUrl(inv.avatar_path, 60);
    avatarUrl = signed?.signedUrl ?? null;
  }

  // Derived fields
  const fullName = [inv.first_name, inv.last_name].filter(Boolean).join(" ") || "Investor";
  const org = inv.organization_entity ?? "—";
  const email = inv.contact_email ?? "-"
  const city = inv.city ?? "—";
  const primary = inv.primary_industry ?? "—";
  const additional =
    Array.isArray(inv.additional_industries) && inv.additional_industries.length
      ? inv.additional_industries.join(", ")
      : (typeof inv.additional_industries === "string" && inv.additional_industries.length
        ? inv.additional_industries
        : "—");
  const ownership =
    inv.ownership_min != null && inv.ownership_max != null
      ? `${inv.ownership_min}% - ${inv.ownership_max}%`
      : "—";
  const ebitda = formatRangeLabel(inv.target_ebitda);
  const cash = formatRangeLabel(inv.target_cash_flow);
  const about = inv.bio ?? "—";
  const net_worth = inv.net_worth ?? "-";
  const industry_experience = formatRangeLabel(inv.industry_experience);
  const exp =
    typeof inv.industry_experience === "number" && inv.industry_experience > 0
      ? `${inv.industry_experience}+ years of experience`
      : null;

  return (
    <div>
      {/* Background and Navbar */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <NavGate />

        {/* Content Wrapper */}
        <div className="w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2 flex flex-col md:flex-row gap-5">

          {/* LEFT COLUMN - Sticky Logic Applied Here */}
          <div className="w-full lg:w-1/3 md:sticky md:top-30 md:h-fit">
            <div className="flex flex-col bg-gray-200 rounded-t-lg overflow-hidden">
              <Image
                src={avatarUrl ?? "/images/svg/def-inv.svg"}
                alt={fullName}
                className="w-full object-cover rounded-t-lg shadow-lg"
                width={300}
                height={200}
                unoptimized
              />
            </div>
            <div className="bg-[#272827] p-5 rounded-b-lg shadow-lg">
              <p className="font-semibold text-white">Organization/Entity</p>
              <p className="text-white">{org}</p>

              <div className="border-t-1 border-grey-500 my-5"></div>

              <p className="font-semibold text-white">Email</p>
              <p className="text-white">{email}</p>
              <Modal
                trigger={
                  <Button className="w-full mt-5">Contact</Button>
                }
              >
                <ContactInvestor
                  name={fullName}
                  email={email}
                  businessName={businessName}
                  industry={industry}
                  location={location}
                  businessDescription={businessDescription}
                />

              </Modal>

            </div>
          </div>

          <div className="w-full lg:w-2/3 gap-5 flex flex-col">
            <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden border p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row gap-5">
                <div className="flex flex-col">
                  <h1 className="pb-2">{fullName}</h1>
                  <p>
                    {[
                      primary !== "—" ? primary : null,
                      exp ? exp : null,
                    ]
                      .filter(Boolean)
                      .join(" | ") || "—"}
                  </p>
                </div>
                <div className="flex">
                  {inv.is_accredited_investor && (
                    <div className="flex mb-0 lg:mb-8">
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="min-w-[130px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-black px-3 py-1 gap-3 flex rounded-full items-center justify-center ">
                            <BadgeCheckIcon size={20} strokeWidth={2.5} className="text-white" />
                            <p className="text-white">Accredited</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {`Accredited Investor`}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t-1 border-gray-400 my-5"></div>
              <p>
                {about}
              </p>
            </div>
            <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden border p-6 lg:p-8">
              <h2 className="pb-4">Capital Criteria</h2>
              <h4 className="large">Investor Overview</h4>
              <p>City: {city}</p>
              <p>Years of Experience: {industry_experience} years</p>
              <br />
              <h4 className="large">Investment Focus</h4>
              <p>Investment Interest: {primary}</p>
              <p>Additional Investment Interests: {additional}</p>
              <p>% Of Ownership Looking For: {ownership}</p>
              <br />
              <h4 className="large">Financial Criteria</h4>
              <p>Company EBITDA Looking For: {ebitda}</p>
              <p>Business Cash Flow: {cash}</p>
              <p>Annual Net Worth: {net_worth}</p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}