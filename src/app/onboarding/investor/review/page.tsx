import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress";
import { EBITDA_BUCKETS, CASH_FLOW_BUCKETS } from "@/lib/ranges";

export default async function Review() {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding/investor/review");

  const { data: p } = await supabase
    .from("investor_profiles")
    .select(`
      user_id,
      first_name,
      last_name,
      city,
      state_code,
      organization_entity,
      bio,
      ownership_min,
      ownership_max,
      primary_industry,
      additional_industries,
      target_ebitda,
      target_cash_flow,
      willing_to_sign_nda,
      is_accredited_investor,
      avatar_path,
      status
    `)
    .eq("user_id", user.id)
    .maybeSingle();

  let avatarUrl: string | null = null;

  if (p?.avatar_path) {
    const { data } = await supabase.storage
      .from("investors")
      .createSignedUrl(p.avatar_path, 60 * 60);

    avatarUrl = data?.signedUrl ?? null;
  }

  const locationLabel = [p?.city, p?.state_code].filter(Boolean).join(", ");
  const additionalIndustries = Array.isArray(p?.additional_industries)
    ? p.additional_industries
    : [];

  const ebitdaLabel =
    EBITDA_BUCKETS.find((b) => b.key === p?.target_ebitda)?.label ??
    p?.target_ebitda ??
    "No preference";

  const cashFlowLabel =
    CASH_FLOW_BUCKETS.find((c) => c.key === p?.target_cash_flow)?.label ??
    p?.target_cash_flow ??
    "No preference";

  const ndaLabel =
    p?.willing_to_sign_nda === true
      ? "Yes"
      : p?.willing_to_sign_nda === false
        ? "No"
        : "Not answered";

  const accreditedLabel =
    p?.is_accredited_investor === true
      ? "Yes"
      : p?.is_accredited_investor === false
        ? "No / Not sure"
        : "Not answered";

  // Minimal required set for publish
  const missing: string[] = [];

  if (!p?.first_name) missing.push("First name");
  if (!p?.last_name) missing.push("Last name");
  if (!p?.city) missing.push("City");
  if (!p?.state_code) missing.push("State");
  if (!p?.primary_industry) missing.push("Primary industry");

  if (p?.ownership_min == null || p?.ownership_max == null) {
    missing.push("Ownership % range");
  }

  async function publish() {
    "use server";

    const { createClientRSC } = await import("@/../utils/supabase/server");

    const sb = await createClientRSC();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) redirect("/login?next=/onboarding/investor/review");

    // Re-check required fields server-side
    const { data: curr } = await sb
      .from("investor_profiles")
      .select(
        "first_name,last_name,city,state_code,primary_industry,ownership_min,ownership_max",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const ok =
      !!curr?.first_name &&
      !!curr?.last_name &&
      !!curr?.city &&
      !!curr?.state_code &&
      !!curr?.primary_industry &&
      curr?.ownership_min != null &&
      curr?.ownership_max != null;

    if (!ok) {
      return;
    }

    const { error } = await sb
      .from("investor_profiles")
      .update({ status: "published" })
      .eq("user_id", user.id);

    if (error) {
      console.error("Publish failed:", error);
      return;
    }

    redirect("/dashboard?welcome=investor");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center p-5">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">
            Profile 90% Complete
          </p>
          <p className="text-xs text-neutral-500">Step 4 of 4</p>
        </div>
        <Progress value={90} />
      </div>

      <div className="mx-auto my-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Link
          href="/onboarding/investor/compliance"
          className="text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-[#4f9f88]"
        >
          &larr; Compliance & Confidentiality
        </Link>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#9ed3c3]/25 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4f9f88]">
            Final review
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
            Review & Go Live
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Take a moment to review your investor profile. Once published,
            eligible business owners can discover your profile and evaluate
            whether you may be a good fit.
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Investor profile avatar"
                className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-lg font-semibold text-neutral-500">
                {(p?.first_name?.[0] ?? "I").toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-base font-semibold text-neutral-950">
                {[p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
                  "Investor profile"}
              </p>

              <p className="mt-0.5 text-sm text-neutral-600">
                {locationLabel || "Location not provided"}
              </p>

              {p?.organization_entity && (
                <p className="mt-0.5 text-sm text-neutral-500">
                  {p.organization_entity}
                </p>
              )}
            </div>
          </div>

          {p?.bio && (
            <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Investor Description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                {p.bio}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">
              Investment Focus
            </p>

            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Primary industry
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {p?.primary_industry || "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Also interested in
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {additionalIndustries.length ? (
                    additionalIndustries.map((industry) => (
                      <span
                        key={industry}
                        className="rounded-full bg-[#9ed3c3]/15 px-2.5 py-1 text-xs font-medium text-[#3f8c77]"
                      >
                        {industry}
                      </span>
                    ))
                  ) : (
                    <span className="text-neutral-700">None selected</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <p className="text-sm font-semibold text-neutral-900">
              Ownership & Targets
            </p>

            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Ownership range
                </dt>
                <dd className="mt-0.5 text-neutral-800">
                  {p?.ownership_min != null && p?.ownership_max != null
                    ? `${p.ownership_min}% – ${p.ownership_max}%`
                    : "Not provided"}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  EBITDA target
                </dt>
                <dd className="mt-0.5 text-neutral-800">{ebitdaLabel}</dd>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Cash flow / SDE target
                </dt>
                <dd className="mt-0.5 text-neutral-800">{cashFlowLabel}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-sm font-semibold text-neutral-900">
            Compliance & Confidentiality
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Willing to sign NDA
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {ndaLabel}
              </p>
            </div>

            <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Accredited investor
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">
                {accreditedLabel}
              </p>
            </div>
          </div>
        </section>

        {missing.length > 0 && (
          <div className="mt-4 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm">
            <p className="font-semibold text-yellow-900">
              Missing required information
            </p>

            <ul className="mt-2 list-disc space-y-1 pl-5 text-yellow-800">
              {missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>

            <p className="mt-2 text-xs leading-relaxed text-yellow-800">
              Please complete the missing fields before publishing your
              investor profile.
            </p>
          </div>
        )}

        <div className="mt-5 flex w-full gap-3">
          <form action={publish} className="w-full">
            <Button
              type="submit"
              disabled={missing.length > 0}
              className="w-full"
            >
              Publish Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}