import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import OwnershipRange from "./OwnershipRange";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress"

export default async function Preferences() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/investor/preferences");

  const { data: draft, error } = await supabase
    .from("investor_profiles")
    .select(`
      user_id,
      ownership_min,
      ownership_max,
      industry_experience,
      primary_industry,
      additional_industries,
      target_ebitda,
      target_cash_flow,
      net_worth,
      status
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) console.error("Fetch investor profile failed:", error);

  async function save(formData: FormData) {
    "use server";
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const sb = await createClientRSC();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect("/login?next=/onboarding/investor/preferences");

    // Ownership (clamped + ordered)
    const oMin = Math.max(0, Math.min(100, Number(formData.get("ownership_min") ?? 0)));
    const oMax = Math.max(0, Math.min(100, Number(formData.get("ownership_max") ?? 100)));
    const ownership_min = Math.min(oMin, oMax);
    const ownership_max = Math.max(oMin, oMax);
    const industry_experience = String(formData.get("industry_experience") ?? "").trim() || null;
    const net_worth = String(formData.get("net_worth") ?? "").trim() || null;

    // Industries
    const primary_industry = String(formData.get("primary_industry") ?? "").trim() || null;
    const additional_industries = formData.getAll("additional_industries")
      .map((x) => String(x).trim())
      .filter(Boolean);

    // Buckets
    const target_ebitda = String(formData.get("ebitda_bucket") ?? "").trim() || null;
    const target_cash_flow = String(formData.get("cashflow_bucket") ?? "").trim() || null;

    const payload = {
      user_id: user.id,
      ownership_min,
      ownership_max,
      industry_experience,
      primary_industry,
      additional_industries: additional_industries.length ? additional_industries : null,
      target_ebitda,
      target_cash_flow,
      net_worth,
      status: (draft?.status ?? "incomplete") as
        | "incomplete"
        | "pending_review"
        | "published"
        | "archived"
        | "suspended",
    };

    const { error: upsertErr } = await sb
      .from("investor_profiles")
      .upsert(payload, { onConflict: "user_id" });
    if (upsertErr) {
      console.error("Upsert preferences failed:", upsertErr);
      return;
    }

    redirect("/onboarding/investor/compliance");
  }

  const INDUSTRY_OPTIONS = [
    "Healthcare","Technology","Finance","Real Estate","Education","Manufacturing","Retail","Hospitality",
    "Transportation","Agriculture","Energy","Entertainment","Construction","Telecommunications","Insurance",
    "Legal","Automotive","Food and Beverage","Media and Advertising","Pharmaceutical","Tourism","Fashion",
    "Logistics","Non-profit","Environmental Services","Biotechnology","Aerospace","E-commerce","Consulting",
    "Sports and Recreation","Other"
  ];

  const INDUSTRY_EXPERIENCE_OPTIONS = [
    { label: "0–2 years",  value: "0-2" },
    { label: "3–5 years",  value: "3-5" },
    { label: "6–10 years", value: "6-10" },
    { label: "11–15 years", value: "11-15" },
    { label: "16–20 years", value: "16-20" },
    { label: "20+ years",   value: "20+" },
  ] as const;

  const NET_WORTH_OPTIONS = [
    { label: "< $250k",        value: "<250k" },
    { label: "$250k – $500k",  value: "250k-500k" },
    { label: "$500k – $1M",    value: "500k-1M" },
    { label: "$1M – $5M",      value: "1M-5M" },  
    { label: "$5M – $30M",     value: "5M-30M" },  
    { label: "$30M+",          value: ">30M" },
  ] as const;


  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 30% Complete</p>
        <Progress value={30} />
      </div>

    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <Link href="/onboarding/investor/contact" className="text-sm underline hover:text-[#60BC9B]">&larr; Introduce Yourself</Link>
    <form action={save}>
      <h1 className="text-2xl font-semibold  mt-2">Define Your Investment Style</h1>
      <p className="mt-2">Tell us what kind of opportunities you’re looking for. Set your target ownership range, preferred industries, and ideal financial profile so we can connect you with the right businesses.</p>
      <hr className="mb-1 mt-4" />

      {/* Ownership % range */}
      <div>
        <label className="block mb-2  pt-4">
          <span>Target ownership %</span>
        </label>
        <OwnershipRange
          defaultMin={draft?.ownership_min ?? 20}
          defaultMax={draft?.ownership_max ?? 40}
          nameMin="ownership_min"
          nameMax="ownership_max"
        />
      </div>

      {/* Net Worth */}
      <div>
        <label className="block mb-2 pt-4">
          <span>Current Net Worth</span>
        </label>
        <select
          name="net_worth"
          required
          defaultValue={draft?.net_worth ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="" disabled>Choose one…</option>
          {NET_WORTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Years of Experience */}
      <label className="block  pt-4">
        <span>Years of Experience</span>
        <select
          name="industry_experience"
          required
          defaultValue={draft?.industry_experience ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="" disabled>Choose one…</option>
          {INDUSTRY_EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {/* Primary industry */}
      <label className="block  py-4">
        <span>Primary industry</span>
        <select
          name="primary_industry"
          required
          defaultValue={draft?.primary_industry ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="" disabled>Choose an industry…</option>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>

      {/* Additional industries */}
      <fieldset className="block">
        <legend className="block">Additional industries (optional)</legend>

        <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2 border rounded p-3">
          {INDUSTRY_OPTIONS.map((opt) => {
            const checked =
              Array.isArray(draft?.additional_industries) &&
              draft!.additional_industries.includes(opt);

            return (
              <label
                key={opt}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  name="additional_industries"
                  value={opt}
                  defaultChecked={checked}
                  className="h-4 w-4"
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>

        {/* (Optional) small hint */}
        <p className="text-grey small mt-1">
          Pick any that apply. You can change these later.
        </p>
      </fieldset>

      {/* EBITDA bucket */}
      <label className="block  pt-4">
        <span>Company EBITDA target</span>
        <select
          name="ebitda_bucket"
          defaultValue={draft?.target_ebitda ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="">No preference</option>
          <option value="<250k">Under $250k</option>
          <option value="250k-500k">$250k – $500k</option>
          <option value="500k-1M">$500k – $1M</option>
          <option value="1M-2M">$1M – $2M</option>
          <option value="2M-5M">$2M – $5M</option>
          <option value=">5M">Over $5M</option>
        </select>
      </label>

      {/* Cash Flow bucket */}
      <label className="block  pt-4">
        <span>Cash flow (SDE) target (optional)</span>
        <select
          name="cashflow_bucket"
          defaultValue={draft?.target_cash_flow ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="">No preference</option>
          <option value="<50k">Under $50k</option>
          <option value="50k-100k">$50k – $100k</option>
          <option value="100k-250k">$100k – $250k</option>
          <option value="250k-500k">$250k – $500k</option>
          <option value=">500k">Over $500k</option>
        </select>
      </label>

      <div className="mt-4 flex gap-3">
        <Button type="submit" className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>
    </div>
  );
}
