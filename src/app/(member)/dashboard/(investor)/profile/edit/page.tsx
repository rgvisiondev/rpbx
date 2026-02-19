// app/(member)/dashboard/profile/edit/page.tsx
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Button from "@/app/components/Button";
import { Progress } from "@/components/ui/progress";
import { INDUSTRY_SLUGS } from "@/lib/industryImages";
import OwnershipRange from "@/app/onboarding/investor/preferences/OwnershipRange";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Database } from "@/types/database.types";
import { EBITDA_BUCKETS } from "@/lib/ranges";
import { setInvestorHidden } from "./actions";
import { VisibilityToggle } from "../../../_components/VisibilityToggle";

const INDUSTRIES = Object.keys(INDUSTRY_SLUGS);

type InvestorProfileRow =
  Database["public"]["Tables"]["investor_profiles"]["Update"];

export default async function EditInvestorProfilePage() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/profile/edit");
  }

  const { data: profile } = await supabase
    .from("investor_profiles")
    .select(
      `
      user_id, first_name, last_name, city, organization_entity, bio,
      ownership_min, ownership_max, primary_industry, additional_industries,
      target_ebitda, target_cash_flow,
      willing_to_sign_nda, is_accredited_investor,
      avatar_path, status, is_hidden
    `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding/investor");
  }

  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage
      .from("investors")
      .createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = data?.signedUrl ?? null;
  }

  async function updateInvestorProfile(formData: FormData) {
    "use server";
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const sb = await createClientRSC();
    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      redirect("/login?next=/dashboard/profile/edit");
    }

    const first_name =
      (formData.get("first_name") ?? "").toString().trim() || null;
    const last_name =
      (formData.get("last_name") ?? "").toString().trim() || null;
    const city = (formData.get("city") ?? "").toString().trim() || null;
    const organization_entity =
      (formData.get("organization_entity") ?? "").toString().trim() || null;
    const bio = (formData.get("bio") ?? "").toString().trim() || null;

    // Ownership range (keep simple; OwnershipRange already enforces 0–100)
    const ownership_min_raw = formData.get("ownership_min");
    const ownership_max_raw = formData.get("ownership_max");

    const ownership_min =
      ownership_min_raw !== null && ownership_min_raw.toString().trim() !== ""
        ? Number(ownership_min_raw)
        : null;

    const ownership_max =
      ownership_max_raw !== null && ownership_max_raw.toString().trim() !== ""
        ? Number(ownership_max_raw)
        : null;

    const primary_industry =
      (formData.get("primary_industry") ?? "").toString().trim() || null;

    // Works with checkbox group (same name="additional_industries")
    const additional_industries = formData
      .getAll("additional_industries")
      .map((v) => v.toString().trim())
      .filter(Boolean);

    const target_ebitda =
      (formData.get("target_ebitda") ?? "").toString().trim() || null;
    const target_cash_flow =
      (formData.get("target_cash_flow") ?? "").toString().trim() || null;

    const willing_to_sign_nda = formData.get("willing_to_sign_nda") === "on";
    const is_accredited_investor =
      formData.get("is_accredited_investor") === "on";

    const payload: InvestorProfileRow = {
      first_name,
      last_name,
      city,
      organization_entity,
      bio,
      ownership_min,
      ownership_max,
      primary_industry,
      additional_industries: additional_industries.length
        ? additional_industries
        : null,
      target_ebitda,
      target_cash_flow,
      willing_to_sign_nda,
      is_accredited_investor,
    };

    const { error: updErr } = await sb
      .from("investor_profiles")
      .update(payload)
      .eq("user_id", user.id)
      .single();

    if (updErr) {
      console.error("Investor profile update failed:", updErr);
      redirect("/dashboard?msg=investor_update_failed");
    }

    const file = formData.get("avatar") as File | null;
    if (file && file.size > 0) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const key = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await sb.storage
        .from("investors")
        .upload(key, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
          cacheControl: "3600",
        });

      if (uploadErr) {
        console.error("Investor avatar upload failed:", uploadErr);
        redirect("/dashboard?msg=investor_avatar_failed");
      }

      const { error: avatarUpdErr } = await sb
        .from("investor_profiles")
        .update({ avatar_path: key })
        .eq("user_id", user.id)
        .single();

      if (avatarUpdErr) {
        console.error("avatar_path update failed:", avatarUpdErr);
        redirect("/dashboard?msg=investor_avatar_path_failed");
      }
    }

    redirect("/dashboard?msg=investor_profile_updated");
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className="mx-auto max-w-lg lg:min-w-[550px]">
        <p className="mb-2">Edit Investor Profile</p>
        <Progress value={100} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link
          href="/dashboard"
          className="text-sm underline hover:text-[#60BC9B]"
        >
          &larr; Back to Dashboard
        </Link>

        <h1 className="text-2xl font-semibold mt-2">Edit Investor Profile</h1>
        <p className="mt-2">
          Update your investor profile details. Changes will apply to how
          businesses see you when reviewing potential matches.
        </p>
        <hr className="mb-1 mt-4" />

        <form action={updateInvestorProfile}>
          {/* Avatar */}
          <div className="flex items-center gap-4 pt-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-16 w-16 rounded-full border object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full border bg-gray-100" />
            )}
            <div>
              <label className="block text-sm font-medium">
                Update profile photo
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                className="mt-1 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Square images work best. JPG or PNG up to a few MB.
              </p>
            </div>
          </div>

          {/* Visibility Toggle */}
          <VisibilityToggle
            id={profile.user_id}
            initialHidden={!!profile.is_hidden}
            setHiddenAction={setInvestorHidden}
            labelVisible="Visible to businesses"
            labelHidden="Hidden from businesses"
            helper="Turn off to hide your profile from business owners."
            toastHidden="Your profile is now hidden from businesses"
            toastVisible="Your profile is now visible to businesses"
          />

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <label className="block">
              <span>First name</span>
              <input
                name="first_name"
                defaultValue={profile.first_name ?? ""}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </label>
            <label className="block">
              <span>Last name</span>
              <input
                name="last_name"
                defaultValue={profile.last_name ?? ""}
                required
                className="mt-1 w-full border rounded px-3 py-2"
              />
            </label>
          </div>

          <label className="block pt-4">
            <span>City / Region</span>
            <input
              name="city"
              defaultValue={profile.city ?? ""}
              required
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="McAllen, TX"
            />
          </label>

          <label className="block pt-4">
            <span>Organization / Entity (optional)</span>
            <input
              name="organization_entity"
              defaultValue={profile.organization_entity ?? ""}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder="Garza Family Investments LLC"
            />
          </label>

          {/* Ownership slider (same feel as onboarding) */}
          <div className="pt-4">
            <label className="block mb-2">
              <span>Target ownership %</span>
            </label>
            <OwnershipRange
              defaultMin={profile.ownership_min ?? 20}
              defaultMax={profile.ownership_max ?? 40}
              nameMin="ownership_min"
              nameMax="ownership_max"
            />
          </div>

          {/* Primary industry */}
          <label className="block pt-4">
            <span>Primary industry focus</span>
            <select
              name="primary_industry"
              defaultValue={profile.primary_industry ?? ""}
              required
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">Select an industry…</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </label>

          {/* Additional industries (checkbox grid, like onboarding) */}
          <fieldset className="block pt-4">
            <legend className="block">Additional industries (optional)</legend>

            <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-2 border rounded p-3">
              {INDUSTRIES.map((opt) => {
                const checked =
                  Array.isArray(profile.additional_industries) &&
                  profile.additional_industries.includes(opt);

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

            <p className="text-xs text-gray-500 mt-1">
              Pick any that apply. You can change these later.
            </p>
          </fieldset>

          {/* Targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <label className="block">
              <span>Company EBITDA target</span>
              <select
                name="ebitda_bucket"
                defaultValue={profile?.target_ebitda ?? ""}
                className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
              >
                <option value="">-</option>
                {EBITDA_BUCKETS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span>Cash flow (SDE) target (optional)</span>
              <select
                name="target_cash_flow"
                defaultValue={profile.target_cash_flow ?? ""}
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
          </div>

          {/* Flags */}
          <div className="flex flex-col gap-2 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="willing_to_sign_nda"
                defaultChecked={!!profile.willing_to_sign_nda}
              />
              <span>I am willing to sign an NDA when appropriate</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_accredited_investor"
                defaultChecked={!!profile.is_accredited_investor}
              />
              <span>I am an accredited investor</span>
            </label>
          </div>

          {/* Bio with tooltip + example text, same pattern as listing description */}
          <label className="block pt-4">
            <Tooltip>
              <span>
                Investor description <TooltipTrigger> ⓘ</TooltipTrigger>
              </span>
              <TooltipContent>
                Describe your investment background, what types of businesses
                you&apos;re drawn to, and how you typically support owners
                beyond capital.
                <br />
                Highlight your experience, preferred deal structures, and what
                makes you a strong long-term partner. Avoid listing confidential
                details or personal identifiers.
              </TooltipContent>
            </Tooltip>
            <textarea
              name="bio"
              rows={5}
              defaultValue={profile.bio ?? ""}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder={`Experienced small business investor focused on stable, cash-flowing companies in South Texas. I typically look for owner-operated businesses with strong local reputations and room for operational improvements.

Beyond capital, I support owners with strategic planning, financial discipline, and access to a broader professional network. Open to both minority and majority positions where there is strong alignment on long-term goals.`}
            />
          </label>

          <div className="mt-4 flex gap-3">
            <Button className="w-full">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
