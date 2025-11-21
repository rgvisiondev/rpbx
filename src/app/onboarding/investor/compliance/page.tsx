import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress"

export default async function Compliance() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await sb.auth.getUser();
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
        | "incomplete" | "pending_review" | "published" | "archived" | "suspended",
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
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 60% Complete</p>
        <Progress value={60} />
      </div>

    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <Link href="/onboarding/investor/preferences" className="text-sm underline hover:text-[#60BC9B]">&larr; Define Your Investment Style</Link>
    <form action={save}>
      <h1 className="text-2xl font-semibold mt-2">Compliance & Confidentiality</h1>
      <p className="mt-2">A few quick questions to keep everything secure and transparent. Confirm your confidentiality preferences and investor status to help us tailor your matches responsibly.</p>
      <hr className="mb-1 mt-4" />

      {/* NDA */}
      <fieldset className="space-y-2">
        <legend className=" pt-4">Willing to sign an NDA?</legend>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="willing_to_sign_nda"
              value="yes"
              defaultChecked={profile?.willing_to_sign_nda === true}
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="willing_to_sign_nda"
              value="no"
              defaultChecked={profile?.willing_to_sign_nda === false}
            />
            <span>No</span>
          </label>
        </div>
      </fieldset>

      {/* Accredited */}
      <fieldset className="space-y-2">
        <legend className=" pt-4">Are you an accredited investor?</legend>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="is_accredited_investor"
              value="yes"
              defaultChecked={profile?.is_accredited_investor === true}
            />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              name="is_accredited_investor"
              value="no"
              defaultChecked={profile?.is_accredited_investor === false}
            />
            <span>No</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          You can complete formal verification later; this just guides matching.
        </p>
      </fieldset>

      <div className="mt-4 flex gap-3">
        <Button type="submit" className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>
    </div>
  );
}
