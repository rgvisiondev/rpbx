// app/onboarding/business/[id]/contact/page.tsx
import { createClientRSC } from "@/../utils/supabase/server";
import { redirect } from "next/navigation";
import Button from "@/app/components/Button";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

export default async function ContactStep({
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
    redirect(
      `/login?next=${encodeURIComponent(
        `/onboarding/business/${listingId}/contact`
      )}`
    );
  }

  // Load THIS listing, make sure it belongs to the user and is still a draft
  const { data: draft } = await supabase
    .from("business_listings")
    .select("*")
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!draft) {
    redirect("/dashboard/listings?err=no_listing");
  }

  if (draft.status !== "draft") {
    redirect("/dashboard/listings?err=not_draft");
  }

  // --- SERVER ACTION ---
  async function save(formData: FormData) {
    "use server";
    const { createClientRSC } = await import("@/../utils/supabase/server");
    const sb = await createClientRSC();
    const {
      data: { user },
    } = await sb.auth.getUser();

    const listingId = String(formData.get("listing_id") ?? "");

    if (!user) {
      redirect(
        `/login?next=${encodeURIComponent(
          `/onboarding/business/${listingId}/contact`
        )}`
      );
    }

    // Make sure this user owns this listing and it's still a draft
    const { data: currentDraft } = await sb
      .from("business_listings")
      .select("id, owner_id, status")
      .eq("id", listingId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!currentDraft || currentDraft.status !== "draft") {
      redirect("/dashboard/listings?err=no_draft_for_listing");
    }

    const contact_email = String(formData.get("contact_email") ?? "");
    const can_provide_financials =
      formData.get("can_provide_financials") === "on";
    const can_provide_tax_returns =
      formData.get("can_provide_tax_returns") === "on";

    await sb
      .from("business_listings")
      .update({
        contact_email,
        can_provide_financials,
        can_provide_tax_returns,
      })
      .eq("id", listingId)
      .eq("owner_id", user.id);

    // ✅ next step, keep listingId in path
    redirect(`/onboarding/business/${listingId}/details`);
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className="mx-auto max-w-lg lg:min-w-[550px]">
        <p className="mb-2"> Profile 30% Complete</p>
        <Progress value={30} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link
          href={`/onboarding/business/${listingId}/set-up`}
          className="text-sm underline hover:text-[#60BC9B]"
        >
          &larr; Let’s Dive Into Your Business
        </Link>

        <form action={save}>
          {/* hidden so the server action always knows which listing */}
          <input type="hidden" name="listing_id" value={listingId} />

          <h1 className="text-2xl font-semibold mt-2">
            Stay Connected & Build Trust
          </h1>
          <p className="mt-2">
            Share how investors can reach you and let them know you’re ready to
            provide key documents when needed. Transparency builds confidence
            and helps spark meaningful connections.
          </p>
          <hr className="mb-1 mt-4" />

          <label className="block pt-4">
            <span>Contact email</span>
            <input
              name="contact_email"
              type="email"
              required
              defaultValue={draft?.contact_email ?? user?.email ?? ""}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              name="can_provide_financials"
              defaultChecked={!!draft?.can_provide_financials}
            />
            <span>We can provide financial statements on request</span>
          </label>

          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="can_provide_tax_returns"
              defaultChecked={!!draft?.can_provide_tax_returns}
            />
            <span>We can provide tax returns on request</span>
          </label>

          <div className="mt-4 flex gap-3">
            <Button className="w-full">Save & Continue</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
