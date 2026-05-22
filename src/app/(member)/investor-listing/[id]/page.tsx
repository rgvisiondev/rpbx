// app/investor-listing/[id]/page.tsx
import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Image from "next/image";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { notFound } from "next/navigation";
import Modal from "@/app/components/Modal";
import ContactInvestor from "@/app/components/popups/ContactInvestor";
import {
  BadgeCheckIcon,
  Building2,
  CalendarClock,
  DollarSign,
  Mail,
  MapPin,
  Percent,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function formatRangeLabel(v?: string | number | null) {
  if (v === null || v === undefined || v === "") return "—";

  if (typeof v === "number") return String(v);

  return v
    .replace(/</, "< ")
    .replace(/>/, "> ")
    .replace(/-/g, " - ")
    .replace(/k\b/gi, "K")
    .replace(/m\b/gi, "M");
}

function formatArrayLabel(value: unknown) {
  if (Array.isArray(value) && value.length) {
    return value.filter(Boolean).join(", ");
  }

  if (typeof value === "string" && value.trim().length) {
    return value;
  }

  return "—";
}

function DetailCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-2 flex items-center justify-center gap-2 text-sm font-semibold text-gray-950">
        <Icon className="h-4 w-4 text-[#5c9f8d]" />
        <span>{label}</span>
      </div>
      <p className="text-center text-sm leading-relaxed text-gray-700">
        {value || "—"}
      </p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#9ed3c3]/25 px-3 py-1 text-xs font-medium text-gray-800">
      {children}
    </span>
  );
}

function MutedChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {children}
    </span>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientRSC();

  const { data } = await supabase
    .from("investor_profiles")
    .select("first_name, last_name, organization_entity, status")
    .eq("id", id)
    .maybeSingle();

  const fullName =
    [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim() ||
    "Investor";

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

export default async function InvestorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      location =
        [listing.city, listing.county].filter(Boolean).join(", ") || undefined;
      businessDescription = listing.description || undefined;
    }
  }

  const { data: inv, error } = await supabase
    .from("investor_profiles")
    .select(
      `
      id,
      user_id,
      status,
      first_name,
      last_name,
      organization_entity,
      industry_experience,
      city,
      state_code,
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
      is_accredited_investor,
      updated_at
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) console.error("Investor fetch failed:", error.message);
  if (!inv || inv.status !== "published") notFound();

  let avatarUrl: string | null = null;

  if (inv.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("investors")
      .createSignedUrl(inv.avatar_path, 60);

    avatarUrl = signed?.signedUrl ?? null;
  }

  const fullName =
    [inv.first_name, inv.last_name].filter(Boolean).join(" ").trim() ||
    "Investor";

  const org = inv.organization_entity || "Independent Investor";
  const email = inv.contact_email || "";
  const city = inv.city || "—";
  const state = inv.state_code || "";
  const locationLabel = [city, state].filter(Boolean).join(", ") || "-";
  const primary = inv.primary_industry || "—";
  const additional = formatArrayLabel(inv.additional_industries);

  const ownership =
    inv.ownership_min != null && inv.ownership_max != null
      ? `${inv.ownership_min}% - ${inv.ownership_max}%`
      : inv.ownership_min != null
        ? `${inv.ownership_min}%+`
        : inv.ownership_max != null
          ? `Up to ${inv.ownership_max}%`
          : "—";

  const ebitda = formatRangeLabel(inv.target_ebitda);
  const cash = formatRangeLabel(inv.target_cash_flow);
  const netWorth = formatRangeLabel(inv.net_worth);
  const about = inv.bio || "No investor bio has been added yet.";

  const industryExperience =
    typeof inv.industry_experience === "number" && inv.industry_experience > 0
      ? `${inv.industry_experience}+ years`
      : formatRangeLabel(inv.industry_experience);

  const profileSummaryItems = [
    {
      label: "Location",
      value: locationLabel,
      icon: MapPin,
    },
    {
      label: "Primary Interest",
      value: primary,
      icon: Target,
    },
    {
      label: "Ownership Target",
      value: ownership,
      icon: Percent,
    },
    {
      label: "Experience",
      value: industryExperience,
      icon: CalendarClock,
    },
  ];

  const criteriaItems = [
    {
      label: "Target EBITDA",
      value: ebitda,
      icon: TrendingUp,
    },
    {
      label: "Target Cash Flow",
      value: cash,
      icon: DollarSign,
    },
    {
      label: "Annual Net Worth",
      value: netWorth,
      icon: Building2,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <NavGate />

      <div className="mx-auto w-full px-5 py-10 lg:max-w-[1140px] lg:px-2">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-100 p-6 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-gray-200">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={fullName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#f8fbfa]">
                      <UserRound className="h-20 w-20 text-[#5c9f8d]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h1 className="text-left text-2xl font-bold leading-tight text-gray-950 lg:text-3xl">
                    {fullName}
                  </h1>

                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {org}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {primary !== "—" && <Chip>{primary}</Chip>}

                    {locationLabel !== "—" && (
                      <MutedChip>
                        <MapPin className="mr-1.5 h-3.5 w-3.5" />
                        {locationLabel}
                      </MutedChip>
                    )}

                    {industryExperience !== "—" && (
                      <MutedChip>{industryExperience} YOE</MutedChip>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {inv.is_accredited_investor && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex min-w-[130px] items-center justify-center gap-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-black hover:bg-[var(--color-primary-hover)]">
                        <BadgeCheckIcon
                          size={20}
                          strokeWidth={2.5}
                          className="text-white"
                        />
                        <p className="text-white">Accredited</p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Accredited Investor</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="grid gap-8 p-6 lg:grid-cols-[2fr_1fr] lg:p-10">
            <div className="min-w-0 space-y-6">
              {/* About */}
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-950">
                    About this investor
                  </h2>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 lg:text-base">
                  {about}
                </p>
              </section>

              {/* Snapshot Cards */}
              <section className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-950">
                    Key investor details
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {profileSummaryItems.map((item) => (
                    <DetailCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </section>

              {/* Investment Focus */}
              <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-gray-950">
                    Industries and criteria
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Primary Investment Interest
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-700">
                      {primary}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Additional Investment Interests
                    </p>

                    {additional !== "—" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {additional.split(",").map((item) => (
                          <MutedChip key={item.trim()}>{item.trim()}</MutedChip>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-700">—</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="flex flex-col">
              <div className="rounded-2xl border border-gray-100 bg-[#f8fbfa] p-5 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-950">
                  Capital Criteria
                </h2>

                <div className="space-y-3">
                  {criteriaItems.map((item) => (
                    <DetailCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      icon={item.icon}
                    />
                  ))}
                </div>

                <div className="mt-5 rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100">
                  <p className="text-sm font-semibold text-gray-900">
                    Preferred Ownership
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{ownership}</p>
                </div>

                <div className="mt-5">
                  <Modal trigger={<Button className="w-full">Contact</Button>}>
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

                {email && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100">
                    <Mail className="h-4 w-4 text-[#5c9f8d]" />
                    <span className="truncate">{email}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5c9f8d]">
                  Before You Reach Out
                </p>

                <p className="mt-2 text-sm leading-relaxed text-gray-700">
                  Review this investor’s preferred industries, ownership range,
                  and capital criteria to determine whether they may be a good
                  fit for your business.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
