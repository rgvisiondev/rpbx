import { redirect } from "next/navigation";
import { createClientRSC } from "../../../../../utils/supabase/server";

export async function setListingHidden(listingId: string, hidden: boolean) {
  "use server";

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/listings");

  // Only allow owner to update listing
  const { data: listing, error: findErr } = await supabase
    .from("business_listings")
    .select("id, owner_id")
    .eq("id", listingId)
    .maybeSingle();

  if (findErr || !listing) throw new Error("Listing not found");
  if (listing.owner_id !== user!.id) throw new Error("Forbidden");

  const { error: updErr } = await supabase
    .from("business_listings")
    .update({ is_hidden: hidden })
    .eq("id", listingId);

  if (updErr) throw updErr;

  // refresh server-rendered list
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/dashboard/listings");
}
