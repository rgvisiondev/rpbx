import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import { splitName } from "@/lib/name";
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress"

export default async function Contact() {  
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/investor/contact");

  const fullFromAuth = 
    (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
    const { first: authFirst, last: authLast } = splitName(fullFromAuth);
  // Prefill from existing profile (any status)
  const { data: draft } = await supabase
    .from("investor_profiles")
    .select(
      "user_id, first_name, last_name, city, organization_entity, contact_email, bio, avatar_path, status"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  // Signed preview URL if we have an avatar
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
    const sb = await createClientRSC();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) redirect("/login?next=/onboarding/investor/contact");

    const authFull = 
        (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim();
    const { first: authFirst, last: authLast } = splitName(authFull)

    const first_name = String(formData.get("first_name") ?? "").trim() || authFirst;
    const last_name = String(formData.get("last_name") ?? "").trim() || authLast;
    const contact_email = String(formData.get("email") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const organization_entity = String(formData.get("org") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const file = formData.get("avatar") as File | null;

    // Upsert profile by user_id
    const payload = {
      user_id: user!.id,
      first_name,
      last_name,
      city,
      organization_entity: organization_entity || null,
      contact_email,
      bio,
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
      console.error("Profile upsert failed:", upsertErr);
      return;
    }

    // Optional avatar upload
    if (file && file.size > 0) {
      const guess = (file.name.split(".").pop() || "jpg").toLowerCase();
      const ext = ["jpg", "jpeg", "png", "webp"].includes(guess) ? guess : "jpg";
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
        return;
      }

      const { error: updImgErr } = await sb
        .from("investor_profiles")
        .update({ avatar_path: key, avatar_updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      if (updImgErr) {
        console.error("DB update (avatar_path) failed:", updImgErr);
        return;
      }
    }

    redirect("/onboarding/investor/preferences");
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 0% Complete</p>
        <Progress value={0} />
      </div>

    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <form action={save}>
      <h1 className="text-2xl font-semibold">Introduce Yourself</h1>
      <p className="mt-2">Let the community get to know you! Share a few basics so business owners can see who’s behind the investment. A great profile helps you make authentic local connections from the start.</p>
      <hr className="mb-1 mt-4" />

      <div className="grid grid-cols-2 gap-3 pt-4">
        <label className="block">
          <span>First name</span>
          <input
            name="first_name"
            required
            defaultValue={draft?.first_name ?? authFirst ?? ""}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span>Last name</span>
          <input
            name="last_name"
            required
            defaultValue={draft?.last_name ?? authLast ?? ""}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>
      </div>

      <label className="block pt-4">
        <span>Contact Email</span>
        <input
          type="email"
          name="email"
          defaultValue={user.email ?? ""}
          className="mt-1 w-full border rounded px-3 py-2 bg-gray-50 text-gray-600"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <label className="block col-span-2 sm:col-span-1">
          <span>City</span>
          <input
            name="city"
            required
            defaultValue={draft?.city ?? ""}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>

        <label className="block col-span-2 sm:col-span-1">
          <span>Organization / Entity (optional)</span>
          <input
            name="org"
            defaultValue={draft?.organization_entity ?? ""}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </label>
      </div>

      <label className="block pt-4">
        <span>Profile Photo</span>
        <input name="avatar" type="file" accept="image/*" className="mt-1 w-full border rounded border-neutral-200 px-3 py-2 hover:cursor-pointer" />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Profile photo preview"
            className="mt-2 h-32 w-32 object-cover rounded-full border"
          />
        )}
      </label>

      <label className="block pt-4">
        <span>Short bio (public)</span>
        <textarea
          name="bio"
          rows={4}
          defaultValue={draft?.bio ?? ""}
          className="mt-1 w-full border rounded px-3 py-2"
          placeholder="Tell us about you as an investor…"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <Button type="submit" className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>
    </div>
  );
}
