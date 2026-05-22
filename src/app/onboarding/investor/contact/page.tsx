import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import { splitName } from "@/lib/name";
import InvestorContactFormClient from "./InvestorContactFormClient";

type InvestorStatus =
  | "incomplete"
  | "pending_review"
  | "published"
  | "archived"
  | "suspended";

function nullableString(value: FormDataEntryValue | null) {
  const cleaned = value?.toString().trim();
  return cleaned ? cleaned : null;
}

export default async function Contact() {
  const supabase = await createClientRSC();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding/investor/contact");

  const fullFromAuth =
    (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();

  const { first: authFirst, last: authLast } = splitName(fullFromAuth);

  const { data: draft } = await supabase
    .from("investor_profiles")
    .select(
      `
      user_id,
      first_name,
      last_name,
      address,
      city,
      state_code,
      county,
      postal_code,
      organization_entity,
      contact_email,
      bio,
      avatar_path,
      status
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  let previewUrl: string | null = null;

  if (draft?.avatar_path) {
    const { data: signed } = await supabase.storage
      .from("investors")
      .createSignedUrl(draft.avatar_path, 60 * 60);

    previewUrl = signed?.signedUrl ?? null;
  }

  async function save(formData: FormData) {
    "use server";

    const { createClientRSC } = await import("@/../utils/supabase/server");
    const { splitName } = await import("@/lib/name");
    const { geocodeAddresssTomTom } = await import("@/lib/geocode");

    const sb = await createClientRSC();

    const {
      data: { user },
    } = await sb.auth.getUser();

    if (!user) redirect("/login?next=/onboarding/investor/contact");

    const authFull =
      (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();

    const { first: authFirst, last: authLast } = splitName(authFull);

    const enteredFirstName = nullableString(formData.get("first_name"));
    const enteredLastName = nullableString(formData.get("last_name"));
    const enteredEmail = nullableString(formData.get("email"));

    const first_name = enteredFirstName ?? authFirst ?? "";
    const last_name = enteredLastName ?? authLast ?? "";
    const contact_email = enteredEmail ?? user.email ?? "";

    const address = nullableString(formData.get("address"));

    const selectedCity = nullableString(formData.get("address_city"));
    const selectedCounty = nullableString(formData.get("address_county"));
    const selectedStateCode = nullableString(
      formData.get("address_state_code"),
    );
    const selectedPostalCode = nullableString(
      formData.get("address_postal_code"),
    );

    const organization_entity = nullableString(formData.get("org"));
    const bio = nullableString(formData.get("bio"));
    const bioWasAiGenerated = formData.get("bio_ai_generated") === "true";

    const file = formData.get("avatar") as File | null;

    const geo = address ? await geocodeAddresssTomTom(address) : null;

    const city = geo?.city ?? selectedCity;
    const county = geo?.county ?? selectedCounty;
    const state_code = geo?.stateCode ?? selectedStateCode;
    const postal_code = geo?.postalCode ?? selectedPostalCode;

    const nextStatus = (draft?.status ?? "incomplete") as InvestorStatus;

    const payload = {
      user_id: user.id,
      first_name,
      last_name,

      address,
      city,
      county,
      state_code,
      country_code: geo?.countryCode ?? "US",
      postal_code,

      geocoded_lat: geo?.lat ?? null,
      geocoded_lng: geo?.lng ?? null,
      geocode_place_id: geo?.placeId ?? null,
      geocode_confidence: geo?.confidence ?? null,
      geocoded_at: geo ? new Date().toISOString() : null,

      organization_entity,
      contact_email,
      bio,
      bio_ai_generated_at: bioWasAiGenerated ? new Date().toISOString() : null,

      status: nextStatus,
    };

    const { error: upsertErr } = await sb
      .from("investor_profiles")
      .upsert(payload, { onConflict: "user_id" });

    if (upsertErr) {
      console.error("Profile upsert failed:", upsertErr);
      redirect("/onboarding/investor/contact?msg=save_error");
    }

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
        console.error("Storage upload error:", uploadErr);
        redirect("/onboarding/investor/contact?msg=avatar_upload_error");
      }

      const { error: updImgErr } = await sb
        .from("investor_profiles")
        .update({
          avatar_path: key,
          avatar_updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updImgErr) {
        console.error("DB update avatar_path failed:", updImgErr);
        redirect("/onboarding/investor/contact?msg=avatar_update_error");
      }
    }

    redirect("/onboarding/investor/preferences");
  }

  return (
    <InvestorContactFormClient
      draft={draft}
      userEmail={user.email ?? ""}
      authFirst={authFirst ?? ""}
      authLast={authLast ?? ""}
      previewUrl={previewUrl}
      save={save}
    />
  );
}