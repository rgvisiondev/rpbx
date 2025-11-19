import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { createClientRSC } from "@/../utils/supabase/server";

// Utility: sleep small; we’ll use once if needed to let webhook commit first
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const sp = await searchParams
  const sessionId = sp?.session_id;
  if (!sessionId) redirect("/dashboard/listings?err=no_session");

  // 1) Get the Checkout Session and Subscription id
  const cs = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const subId = typeof cs.subscription === "string"
    ? cs.subscription
    : cs.subscription?.id;

  if (!subId) redirect("/dashboard/listings?err=no_sub");

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/claim?session_id=" + encodeURIComponent(sessionId));

  // 2) Try to find the subscription row with listing_id set (webhook path)
  const tryFind = async () => {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("listing_id, user_id, status")
      .eq("id", subId)
      .maybeSingle();

    if (subRow?.user_id !== user.id) return null;
    return subRow?.listing_id ?? null;
  };

  let listingId = await tryFind();

  // 3) Fallback: if webhook hasn’t written listing_id yet, wait once and retry,
  //    then, if still missing, create the draft here (idempotent) and stamp metadata.
  if (!listingId) {
    await sleep(800); // small grace to allow webhook commit
    listingId = await tryFind();
  }

  if (!listingId) {
    // Create draft listing as fallback (idempotent)
    const { data: draft, error: e1 } = await supabase
      .from("business_listings")
      .insert({
        owner_id: user.id,
        title: "Untitled Listing",
        industry: "Unspecified",
        status: "draft",
        is_active: false,
      })
      .select("id")
      .maybeSingle();

    if (!draft?.id || e1) redirect("/dashboard/listings?err=draft_fallback");

    listingId = draft.id;

    // Stamp to Stripe subscription metadata so the DB will see it next webhook/update
    await stripe.subscriptions.update(subId, {
      metadata: { listing_id: listingId },
    });
  }

    redirect(`/onboarding/business/set-up?listing_id=${listingId}`);
}
