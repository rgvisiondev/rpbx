// app/(member)/dashboard/profile/edit/page.tsx
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import Button from "@/app/components/Button";
import { Progress } from "@/components/ui/progress";
import { INDUSTRY_OPTIONS } from "@/lib/industryImages";
import OwnershipRange from "@/app/onboarding/investor/preferences/OwnershipRange";
import { Database } from "@/types/database.types";
import { EBITDA_BUCKETS } from "@/lib/ranges";
import { setInvestorHidden } from "./actions";
import { VisibilityToggle } from "../../../_components/VisibilityToggle";
import InvestorIdentityBioFields from "./InvestorIdentityBioFields";

const INDUSTRIES = INDUSTRY_OPTIONS;

type InvestorProfileRow =
  Database["public"]["Tables"]["investor_profiles"]["Update"];

type TomTomGeoResult = {
  city?: string | null;
  county?: string | null;
  stateCode?: string | null;
  state_code?: string | null;
  postalCode?: string | null;
  postal_code?: string | null;
  countryCode?: string | null;
  country_code?: string | null;
  lat?: number | null;
  lng?: number | null;
  lon?: number | null;
  placeId?: string | null;
  place_id?: string | null;
  confidence?: number | null;
};

function nullableString(value: FormDataEntryValue | null) {
  const cleaned = value?.toString().trim();
  return cleaned ? cleaned : null;
}

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
      user_id,
      first_name,
      last_name,
      address,
      city,
      county,
      state_code,
      postal_code,
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
      status,
      is_hidden
      `,
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
    const { geocodeAddresssTomTom } = await import("@/lib/geocode");

    const sb = await createClientRSC();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) {
      redirect("/login?next=/dashboard/profile/edit");
    }

    const first_name = nullableString(formData.get("first_name"));
    const last_name = nullableString(formData.get("last_name"));

    const address = nullableString(formData.get("address"));

    const selectedCity = nullableString(formData.get("address_city"));
    const selectedCounty = nullableString(formData.get("address_county"));
    const selectedStateCode = nullableString(
      formData.get("address_state_code"),
    );
    const selectedPostalCode = nullableString(
      formData.get("address_postal_code"),
    );

    const existingCity = nullableString(formData.get("existing_city"));
    const existingCounty = nullableString(formData.get("existing_county"));
    const existingStateCode = nullableString(
      formData.get("existing_state_code"),
    );
    const existingPostalCode = nullableString(
      formData.get("existing_postal_code"),
    );

    const geoRaw = address ? await geocodeAddresssTomTom(address) : null;
    const geo = geoRaw as TomTomGeoResult | null;

    const city = geo?.city ?? selectedCity ?? existingCity;
    const county = geo?.county ?? selectedCounty ?? existingCounty;

    const state_code =
      geo?.stateCode ??
      geo?.state_code ??
      selectedStateCode ??
      existingStateCode;

    const postal_code =
      geo?.postalCode ??
      geo?.postal_code ??
      selectedPostalCode ??
      existingPostalCode;

    const country_code = geo?.countryCode ?? geo?.country_code ?? "US";
    const geocoded_lat = geo?.lat ?? null;
    const geocoded_lng = geo?.lng ?? geo?.lon ?? null;
    const geocode_place_id = geo?.placeId ?? geo?.place_id ?? null;
    const geocode_confidence = geo?.confidence ?? null;

    const organization_entity = nullableString(
      formData.get("organization_entity"),
    );

    const bio = nullableString(formData.get("bio"));
    const bioWasAiGenerated = formData.get("bio_ai_generated") === "true";

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

    const primary_industry = nullableString(formData.get("primary_industry"));

    const additional_industries = formData
      .getAll("additional_industries")
      .map((v) => v.toString().trim())
      .filter(Boolean);

    const target_ebitda = nullableString(formData.get("target_ebitda"));
    const target_cash_flow = nullableString(formData.get("target_cash_flow"));

    const willing_to_sign_nda = formData.get("willing_to_sign_nda") === "on";
    const is_accredited_investor =
      formData.get("is_accredited_investor") === "on";

    const payload: InvestorProfileRow = {
      first_name,
      last_name,

      address,
      city,
      county,
      state_code,
      postal_code,
      country_code,
      geocoded_lat,
      geocoded_lng,
      geocode_place_id,
      geocode_confidence,
      geocoded_at: geo ? new Date().toISOString() : null,

      organization_entity,
      bio,
      bio_ai_generated_at: bioWasAiGenerated
        ? new Date().toISOString()
        : null,

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
      .eq("user_id", user.id);

    if (updErr) {
      console.error("Investor profile update failed:", updErr);
      redirect("/dashboard?msg=investor_update_failed");
    }

    const file = formData.get("avatar") as File | null;

    if (file && file.size > 0) {
      const guess = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const ext = ["jpg", "jpeg", "png", "webp"].includes(guess)
        ? guess
        : "jpg";

      const key = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await sb.storage
        .from("investors")
        .upload(key, file, {
          upsert: true,
          contentType: file.type || `image/${ext}`,
          cacheControl: "3600",
        });

      if (uploadErr) {
        console.error("Investor avatar upload failed:", uploadErr);
        redirect("/dashboard?msg=investor_avatar_failed");
      }

      const { error: avatarUpdErr } = await sb
        .from("investor_profiles")
        .update({
          avatar_path: key,
          avatar_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (avatarUpdErr) {
        console.error("avatar_path update failed:", avatarUpdErr);
        redirect("/dashboard?msg=investor_avatar_path_failed");
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile/edit");
    revalidatePath("/investor-listing");

    redirect("/dashboard?msg=investor_profile_updated");
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center p-5">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-700">
            Profile Settings
          </p>
          <p className="text-xs text-neutral-500">Investor profile</p>
        </div>

        <Progress value={100} />
      </div>

      <div className="mx-auto my-5 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-[#4f9f88]"
        >
          &larr; Back to Dashboard
        </Link>

        <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#9ed3c3]/25 to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4f9f88]">
            Investor profile
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-neutral-950">
            Edit Your Investor Profile
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Keep your investor details accurate so business owners can better
            understand your investment focus, preferred opportunities, and
            confidentiality preferences.
          </p>
        </div>

        <form action={updateInvestorProfile} className="mt-5">
          <section className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Profile Visibility & Photo
              </p>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Control whether business owners can discover your profile and
                update the photo shown with your investor card.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt="Investor profile photo"
                  className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-lg font-semibold text-neutral-500">
                  {(profile.first_name?.[0] ?? "I").toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-neutral-800">
                  Update profile photo
                </label>

                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#9ed3c3]/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#3f8c77] hover:cursor-pointer"
                />

                <p className="mt-1 text-xs text-neutral-500">
                  Square images work best. JPG, PNG, or WEBP up to a few MB.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
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
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-1">
              <p className="text-sm font-semibold text-neutral-900">
                Identity, Location & Bio
              </p>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                These are the main details business owners see when they review
                your profile. Your exact address is not shown publicly.
              </p>
            </div>

            <InvestorIdentityBioFields
              firstName={profile.first_name ?? ""}
              lastName={profile.last_name ?? ""}
              address={profile.address ?? ""}
              city={profile.city ?? ""}
              county={profile.county ?? ""}
              stateCode={profile.state_code ?? ""}
              postalCode={profile.postal_code ?? ""}
              organizationEntity={profile.organization_entity ?? ""}
              bio={profile.bio ?? ""}
            />
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Ownership Goals
              </p>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Set the ownership range you are generally open to exploring.
              </p>
            </div>

            <label className="mb-2 block text-sm font-medium text-neutral-800">
              Target ownership %
            </label>

            <OwnershipRange
              defaultMin={profile.ownership_min ?? 20}
              defaultMax={profile.ownership_max ?? 40}
              nameMin="ownership_min"
              nameMax="ownership_max"
            />
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Industry Focus
              </p>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Choose the types of businesses you are most interested in
                reviewing.
              </p>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-neutral-800">
                Primary industry focus
              </span>

              <select
                name="primary_industry"
                defaultValue={profile.primary_industry ?? ""}
                required
                className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              >
                <option value="">Select an industry…</option>

                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
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
                {INDUSTRIES.map((opt) => {
                  const checked =
                    Array.isArray(profile.additional_industries) &&
                    profile.additional_industries.includes(opt);

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
                These are not strict requirements. They help RioPlex improve
                match quality.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-neutral-800">
                  Company EBITDA target
                </span>

                <select
                  name="target_ebitda"
                  defaultValue={profile.target_ebitda ?? ""}
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

              <label className="block">
                <span className="text-sm font-medium text-neutral-800">
                  Cash flow / SDE target
                  <span className="font-normal text-neutral-500">
                    {" "}
                    optional
                  </span>
                </span>

                <select
                  name="target_cash_flow"
                  defaultValue={profile.target_cash_flow ?? ""}
                  className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition hover:cursor-pointer focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
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
          </section>

          <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="mb-4">
              <p className="text-sm font-semibold text-neutral-900">
                Compliance & Confidentiality
              </p>

              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                These answers help business owners understand how to share
                sensitive information with you.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                <input
                  type="checkbox"
                  name="willing_to_sign_nda"
                  defaultChecked={!!profile.willing_to_sign_nda}
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    I am willing to sign an NDA when appropriate
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    This helps business owners feel comfortable sharing
                    confidential details.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-3 transition hover:border-[#9ed3c3]/60 hover:bg-[#9ed3c3]/10">
                <input
                  type="checkbox"
                  name="is_accredited_investor"
                  defaultChecked={!!profile.is_accredited_investor}
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-semibold text-neutral-900">
                    I am an accredited investor
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-neutral-500">
                    This helps RioPlex tailor profile visibility and future
                    opportunity access.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="mt-5 flex gap-3">
            <Button className="w-full">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}