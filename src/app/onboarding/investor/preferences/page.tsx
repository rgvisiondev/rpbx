import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import OwnershipRange from "./OwnershipRange";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress";
import { INDUSTRY_OPTIONS } from "@/lib/industryImages";
import { EBITDA_BUCKETS, CASH_FLOW_BUCKETS } from "@/lib/ranges";

export default async function Preferences() {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) redirect("/login?next=/onboarding/investor/preferences");

    const oMin = Math.max(
      0,
      Math.min(100, Number(formData.get("ownership_min") ?? 0)),
    );

    const oMax = Math.max(
      0,
      Math.min(100, Number(formData.get("ownership_max") ?? 100)),
    );

    const ownership_min = Math.min(oMin, oMax);
    const ownership_max = Math.max(oMin, oMax);

    const industry_experience =
      String(formData.get("industry_experience") ?? "").trim() || null;

    const net_worth =
      String(formData.get("net_worth") ?? "").trim() || null;

    const primary_industry =
      String(formData.get("primary_industry") ?? "").trim() || null;

    const additional_industries = formData
      .getAll("additional_industries")
      .map((x) => String(x).trim())
      .filter(Boolean);

    const target_ebitda =
      String(formData.get("ebitda_bucket") ?? "").trim() || null;

    const target_cash_flow =
      String(formData.get("cashflow_bucket") ?? "").trim() || null;

    const payload = {
      user_id: user.id,
      ownership_min,
      ownership_max,
      industry_experience,
      primary_industry,
      additional_industries: additional_industries.length
        ? additional_industries
        : null,
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

  const INDUSTRY_EXPERIENCE_OPTIONS = [
    { label: "0–2 years", value: "0-2" },
    { label: "3–5 years", value: "3-5" },
    { label: "6–10 years", value: "6-10" },
    { label: "11–15 years", value: "11-15" },
    { label: "16–20 years", value: "16-20" },
    { label: "20+ years", value: "20+" },
  ] as const;

  const NET_WORTH_OPTIONS = [
    { label: "< $250k", value: "<250k" },
    { label: "$250k – $500k", value: "250k-500k" },
    { label: "$500k – $1M", value: "500k-1M" },
    { label: "$1M – $5M", value: "1M-5M" },
    { label: "$5M – $30M", value: "5M-30M" },
    { label: "$30M+", value: ">30M" },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center p-5">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">
            Profile 30% Complete
          </p>
          <p className="text-xs text-neutral-500">Step 2 of 4</p>
        </div>
        <Progress value={30} />
      </div>

      <div className="mx-auto my-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Link
          href="/onboarding/investor/contact"
          className="text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-[#4f9f88]"
        >
          &larr; Introduce Yourself
        </Link>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#9ed3c3]/25 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4f9f88]">
            Investment preferences
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
            Define Your Investment Style
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Tell us what kind of opportunities you are looking for. These
            details help RioPlex surface businesses that better align with your
            goals, preferred industries, and target financial profile.
          </p>
        </div>

        <form action={save} className="mt-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Ownership Goals
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Set the range of ownership you are generally open to exploring.
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-neutral-800">
              Target ownership %
            </label>

            <OwnershipRange
              defaultMin={draft?.ownership_min ?? 20}
              defaultMax={draft?.ownership_max ?? 40}
              nameMin="ownership_min"
              nameMax="ownership_max"
            />
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Investor Profile
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                These details help us understand your investor background and
                general capacity.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Current Net Worth
              </span>

              <select
                name="net_worth"
                required
                defaultValue={draft?.net_worth ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="" disabled>
                  Choose one…
                </option>

                {NET_WORTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-neutral-800">
                Years of Experience
              </span>

              <select
                name="industry_experience"
                required
                defaultValue={draft?.industry_experience ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="" disabled>
                  Choose one…
                </option>

                {INDUSTRY_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Industry Focus
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Choose the business categories you are most interested in
                reviewing.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Primary industry
              </span>

              <select
                name="primary_industry"
                required
                defaultValue={draft?.primary_industry ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="" disabled>
                  Choose an industry…
                </option>

                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="mt-4 block">
              <legend className="text-sm font-medium text-neutral-800">
                Additional industries
                <span className="font-normal text-neutral-500"> optional</span>
              </legend>

              <div className="mt-2 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 sm:grid-cols-2 md:grid-cols-3">
                {INDUSTRY_OPTIONS.map((opt) => {
                  const checked =
                    Array.isArray(draft?.additional_industries) &&
                    draft.additional_industries.includes(opt);

                  return (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-transparent bg-white px-2.5 py-2 text-sm text-neutral-700 transition hover:border-[#9ed3c3]/50 hover:bg-[#9ed3c3]/10"
                    >
                      <input
                        type="checkbox"
                        name="additional_industries"
                        value={opt}
                        defaultChecked={checked}
                        className="mt-0.5 h-4 w-4"
                      />

                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-1.5 text-xs text-neutral-500">
                Pick any that apply. You can change these later.
              </p>
            </fieldset>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Financial Targets
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                These are not strict requirements. They simply help improve
                match quality.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Company EBITDA target
              </span>

              <select
                name="ebitda_bucket"
                defaultValue={draft?.target_ebitda ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="">No preference</option>

                {EBITDA_BUCKETS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-medium text-neutral-800">
                Cash flow / SDE target
                <span className="font-normal text-neutral-500"> optional</span>
              </span>

              <select
                name="cashflow_bucket"
                defaultValue={draft?.target_cash_flow ?? ""}
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="">No preference</option>

                {CASH_FLOW_BUCKETS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <div className="mt-5 flex gap-3">
            <Button type="submit" className="w-full">
              Save & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}