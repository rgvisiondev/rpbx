// app/investor-listing/page.tsx (Server Component)
import NavGate from "@/app/components/NavGate";
import Button from "@/app/components/Button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import SearchBar from "./components/SearchBar";
import FiltersBar from "./components/FiltersBar";
import type { Database } from "@/types/database.types";

export const metadata: Metadata = {
  title: "Investor Listings | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

const PAGE_SIZE = 8;

type InvestorProfileRow = Database["public"]["Tables"]["investor_profiles"]["Row"];

type InvestorCard = Pick<
  InvestorProfileRow,
  | "id"
  | "first_name"
  | "last_name"
  | "organization_entity"
  | "primary_industry"
  | "target_ebitda"
  | "target_cash_flow"
  | "avatar_path"
  | "full_name_lc"
  | "org_name_lc"
  | "updated_at"
>;


// small pretty-printer so we don't duplicate constants
function formatRangeLabel(v?: string | null) {
  if (!v) return "—";
  // e.g. "<250k" -> "< 250K", "250k-500k" -> "250K - 500K"
  return v
    .replace(/</, "< ")
    .replace(/>/, "> ")
    .replace(/-/g, " - ")
    .replace(/k/g, "K");
}

export default async function Investors({ searchParams }: PageProps) {
  const supabase = await createClientRSC();
  const params = await searchParams;

  const q = (params.q ?? "").trim();
  const sort = (params.sort ?? "date").toLowerCase();
  const page = Math.max(1, Number(params.page ?? "1"));

  // filters come straight from URL; industry values live only in FiltersBar
  const industry = params.industry ?? "";
  const ebitda = params.ebitda ?? "";
  const cash = params.cash ?? "";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/investor-listing");

  // ---------- COUNT FIRST ----------
  let countQ = supabase
    .from("investor_profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  if (industry) countQ = countQ.eq("primary_industry", industry);
  if (ebitda) countQ = countQ.eq("target_ebitda", ebitda);
  if (cash) countQ = countQ.eq("target_cash_flow", cash);

  if (q) {
    const needle = `%${q.toLowerCase().replace(/[%_]/g, (m) => `\\${m}`)}%`;
    countQ = countQ.or(`full_name_lc.ilike.${needle},org_name_lc.ilike.${needle}`);
  }

  const { count: total, error: countErr } = await countQ;
  if (countErr) console.error("Count failed:", countErr.message);

  const totalRows = total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // ---------- DATA QUERY ----------
  let dataQ = supabase
    .from("investor_profiles")
    .select(`
      id,
      first_name,
      last_name,
      organization_entity,
      primary_industry,
      target_ebitda,
      target_cash_flow,
      avatar_path,
      full_name_lc,
      org_name_lc,
      updated_at
    `)
    .eq("status", "published");

  if (industry) dataQ = dataQ.eq("primary_industry", industry);
  if (ebitda) dataQ = dataQ.eq("target_ebitda", ebitda);
  if (cash) dataQ = dataQ.eq("target_cash_flow", cash);

  if (q) {
    const needle = `%${q.toLowerCase().replace(/[%_]/g, (m) => `\\${m}`)}%`;
    dataQ = dataQ.or(`full_name_lc.ilike.${needle},org_name_lc.ilike.${needle}`);
  }

  dataQ = (sort === "name")
    ? dataQ.order("full_name_lc", { ascending: true })
    : dataQ.order("updated_at", { ascending: false });

  let rows: InvestorCard[] = [];
  if (totalRows > 0) {
    const { data, error } = await dataQ.range(from, to);
    if (error) console.error("Listings query failed:", error.message);
    rows = data ?? [];
  }

  // ---------- SIGNED AVATAR URLS (kept your pattern/variable name) ----------
  const investors: Record<string, string | null> = {};
  if (rows.length) {
    for (const r of rows) {
      if (r.avatar_path) {
        const { data: signed } = await supabase.storage
          .from("investors")
          .createSignedUrl(r.avatar_path, 60);
        investors[r.id] = signed?.signedUrl ?? null;
      } else {
        investors[r.id] = null;
      }
    }
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <NavGate />

      <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
        <h1 className="text-center">Investors</h1>

        {/* Search + Filters (client components) */}
        <div className="flex flex-col gap-4 mt-4">
          <SearchBar />
          <FiltersBar />
        </div>

        {/* Results / Empty state */}
        {rows.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            No investors found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-5 pt-5">
            {rows.map((r) => {
              const imgSrc = investors[r.id] ?? "/images/svg/def-inv.svg";
              return (
                <div key={r.id} className="flex-1 rounded-lg overflow-hidden">
                  <Image
                    src={imgSrc}
                    alt={`${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "Investor Avatar"}
                    className="bg-gray-200 rounded-t-lg w-full shadow-lg border-x-2 border-t-2 object-cover h-[250px]"
                    width={640}
                    height={250}
                    unoptimized
                  />
                  <div className="bg-white p-5 rounded-b-lg shadow-lg border-x-2 border-b-2">
                    <h4 className="large">
                      {r.first_name} {r.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {r.organization_entity ?? "—"}
                    </p>
                    <p className="mt-2 font-semibold">Industry Interest:</p>
                    <p className="text-sm text-gray-500 italic">{r.primary_industry ?? "—"}</p>
                    <p className="mt-2 font-semibold">EBITDA • Cash Flow</p>
                    <p className="text-sm text-gray-500 italic">
                      {[formatRangeLabel(r.target_ebitda), formatRangeLabel(r.target_cash_flow)]
                        .filter((x) => x && x !== "—")
                        .join(" • ") || "—"}
                    </p>

                    <Link href={`/investor-listing/${r.id}`}>
                      <Button className="mt-4 w-full">View Profile</Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {safePage > 1 && (
            <Link
              href={`?page=${safePage - 1}`}
              className="px-4 py-2 border rounded-xl bg-white shadow-lg hover:bg-[#60BC9B] hover:text-white"
            >
              Previous
            </Link>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`?page=${p}`}
              className={`px-4 py-2 border rounded-xl shadow-lg ${safePage === p
                  ? "bg-[#60BC9B] text-white"
                  : "hover:bg-[#60BC9B] hover:text-white bg-white"
                }`}
            >
              {p}
            </Link>
          ))}

          {safePage < totalPages && (
            <Link
              href={`?page=${safePage + 1}`}
              className="px-4 py-2 border rounded-xl bg-white shadow-lg hover:bg-[#60BC9B] hover:text-white"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
