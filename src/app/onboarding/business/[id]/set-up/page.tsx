// app/onboarding/business/[id]/set-up/page.tsx
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Button from "@/app/components/Button";
import { Progress } from "@/components/ui/progress";
import { INDUSTRY_OPTIONS } from "@/lib/industryImages";
import IndustryImagePicker from "@/app/onboarding/components/IndustryImagePicker";
import { geocodeAddresssTomTom } from "@/lib/geocode";
import AddressAutocomplete from "@/app/onboarding/components/AddressAutocomplete";

export default async function Setup({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = await params;

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // include listingId so login can bounce them back to the same step
    redirect(`/login?next=/onboarding/business/${listingId}/set-up`);
  }

  // 🔹 Load *this* listing, ensure it belongs to the current user
  const { data: draft, error: draftErr } = await supabase
    .from("business_listings")
    .select(
      "id, title, industry, secondary_industry, county, city, contact_email, listing_image_choice, address",
    )
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (draftErr || !draft) {
    console.error("No draft for listing", { listingId, draftErr });
    redirect("/dashboard/listings?err=no_draft_for_listing");
  }

  const INDUSTRIES = INDUSTRY_OPTIONS;

  async function save(formData: FormData) {
    "use server";
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const sb = await createClientRSC();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) redirect(`/login?next=/onboarding/business/${listingId}/set-up`);

    const listingIdFromForm = String(formData.get("listing_id") ?? "");

    // Re-verify listing belongs to user
    const { data: existing, error: loadErr } = await sb
      .from("business_listings")
      .select("id")
      .eq("id", listingIdFromForm)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (loadErr || !existing) {
      console.error("Save: no draft for listing", {
        listingId: listingIdFromForm,
        loadErr,
      });
      redirect("/dashboard/listings?err=no_draft_for_listing");
    }

    const title = String(formData.get("title") ?? "").trim();
    const industry = String(formData.get("industry") ?? "").trim();
    const secondaryIndustryRaw = String(
      formData.get("secondary_industry") ?? "",
    ).trim();
    const secondary_industry =
      secondaryIndustryRaw && secondaryIndustryRaw !== industry
        ? secondaryIndustryRaw
        : null;
    const address = String(formData.get("address") ?? "").trim();
    const listing_image_choice =
      String(formData.get("listing_image_choice") ?? "").trim() || null;

    const geo = address ? await geocodeAddresssTomTom(address) : null;

    const city = geo?.city ?? null;
    const county = geo?.county ?? null;

    const payload = {
      title,
      industry,
      secondary_industry,
      county,
      city,
      contact_email: user.email ?? null,
      listing_image_choice,
      address,
      country_code: geo?.countryCode ?? "US",
      state_code: geo?.stateCode ?? null,
      postal_code: geo?.postalCode ?? null,
      geocoded_lat: geo?.lat ?? null,
      geocoded_lng: geo?.lng ?? null,
      geocode_place_id: geo?.placeId ?? null,
      geocode_confidence: geo?.confidence ?? null,
      geocoded_at: geo ? new Date().toISOString() : null,
      status: "draft" as const,
    };

    const { error: updErr } = await sb
      .from("business_listings")
      .update(payload)
      .eq("id", listingIdFromForm)
      .eq("owner_id", user.id);

    if (updErr) {
      console.error("Setup update error", updErr);
      redirect("/dashboard/listings?err=setup_update_failed");
    }

    redirect(`/onboarding/business/${listingIdFromForm}/contact`);
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className="mx-auto max-w-lg lg:min-w-[550px]">
        <p className="mb-2"> Profile 0% Complete</p>
        <Progress value={0} />
      </div>

      <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <form action={save}>
          <input type="hidden" name="listing_id" value={draft.id} />

          <h1 className="text-2xl font-semibold">Dive Into Your Business</h1>
          <p className="mt-2">
            Tell us what makes your business unique! Start by adding the
            essentials — your name, industry, and where you’re based — so local
            investors can easily discover and connect with you.
          </p>
          <hr className="mb-1 mt-4" />

          <label className="block pt-4">
            <span>Business Title</span>
            <input
              name="title"
              defaultValue={draft?.title ?? ""}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <IndustryImagePicker
            allIndustries={INDUSTRIES}
            defaultIndustry={draft?.industry ?? ""}
            defaultSecondaryIndustry={draft?.secondary_industry}
            defaultImageKey={draft?.listing_image_choice ?? ""}
          />

          <label className="block pt-4">
            <span>Business Address</span>
            <AddressAutocomplete
              name="address"
              defaultValue={draft?.address ?? ""}
              placeholder="123 Main St, McAllen, TX 78501"
            />
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll only use this to auto-fill city and county. Your exact
              address is <strong>never</strong> shown to investors.
            </p>
          </label>

          <div className="mt-4 flex gap-3">
            <Button className="w-full">Save & Continue</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
