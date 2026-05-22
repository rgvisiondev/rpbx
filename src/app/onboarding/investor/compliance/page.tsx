import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress";

export default async function Compliance() {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding/investor/compliance");

  const { data: profile } = await supabase
    .from("investor_profiles")
    .select("user_id, willing_to_sign_nda, is_accredited_investor, status")
    .eq("user_id", user.id)
    .maybeSingle();

  async function save(formData: FormData) {
    "use server";

    const { createClientRSC } = await import("@/../utils/supabase/server");

    const sb = await createClientRSC();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) redirect("/login?next=/onboarding/investor/compliance");

    const ndaRaw = String(formData.get("willing_to_sign_nda") ?? "");
    const accRaw = String(formData.get("is_accredited_investor") ?? "");

    const willing_to_sign_nda =
      ndaRaw === "yes" ? true : ndaRaw === "no" ? false : null;

    const is_accredited_investor =
      accRaw === "yes" ? true : accRaw === "no" ? false : null;

    const payload = {
      user_id: user.id,
      willing_to_sign_nda,
      is_accredited_investor,
      status: (profile?.status ?? "incomplete") as
        | "incomplete"
        | "pending_review"
        | "published"
        | "archived"
        | "suspended",
    };

    const { error } = await sb
      .from("investor_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      console.error("Compliance upsert failed:", error);
      return;
    }

    redirect("/onboarding/investor/review");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center p-5">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">
            Profile 60% Complete
          </p>
          <p className="text-xs text-neutral-500">Step 3 of 4</p>
        </div>
        <Progress value={60} />
      </div>

      <div className="mx-auto my-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Link
          href="/onboarding/investor/preferences"
          className="text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-[#4f9f88]"
        >
          &larr; Define Your Investment Style
        </Link>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#9ed3c3]/25 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4f9f88]">
            Compliance & confidentiality
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
            Keep the Process Secure
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            A few quick questions help us protect business owner confidentiality
            and present matches responsibly. You can update these answers later.
          </p>
        </div>

        <form action={save} className="mt-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Confidentiality
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Some business owners may require an NDA before sharing sensitive
                details such as financials, customer information, or ownership
                discussions.
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-neutral-800">
                Are you willing to sign an NDA when appropriate?
              </legend>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                  <input
                    type="radio"
                    name="willing_to_sign_nda"
                    value="yes"
                    defaultChecked={profile?.willing_to_sign_nda === true}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      Yes
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                      I am open to signing an NDA before reviewing confidential
                      details.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                  <input
                    type="radio"
                    name="willing_to_sign_nda"
                    value="no"
                    defaultChecked={profile?.willing_to_sign_nda === false}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      No
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                      I prefer to review only non-confidential information first.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Investor Status
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                This helps guide matching and future opportunity access. Formal
                verification can happen later if needed.
              </p>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-neutral-800">
                Are you an accredited investor?
              </legend>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                  <input
                    type="radio"
                    name="is_accredited_investor"
                    value="yes"
                    defaultChecked={profile?.is_accredited_investor === true}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      Yes
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                      I currently meet accredited investor requirements.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                  <input
                    type="radio"
                    name="is_accredited_investor"
                    value="no"
                    defaultChecked={profile?.is_accredited_investor === false}
                    className="mt-1 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-neutral-900">
                      No / Not sure
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                      I can still browse and connect where appropriate.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            <div className="mt-4 rounded-xl border border-[#9ed3c3]/40 bg-[#9ed3c3]/10 p-3">
              <p className="text-xs leading-relaxed text-neutral-600">
                This does not replace legal, financial, or accreditation
                verification. It simply helps RioPlex tailor your experience.
              </p>
            </div>
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