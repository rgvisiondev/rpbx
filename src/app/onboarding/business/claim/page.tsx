// app/onboarding/business/claim/page.tsx
import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createClientRSC } from "@/../utils/supabase/server";

// Utility: small delay to let webhook (if any) write first
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const stripe = getStripe();
  const sp = await searchParams;
  const sessionId = sp?.session_id;
  if (!sessionId) redirect("/dashboard/listings?err=no_session");

  // 1) Get the Checkout Session and Subscription id
  const cs = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const subId =
    typeof cs.subscription === "string"
      ? cs.subscription
      : cs.subscription?.id;

  if (!subId) redirect("/dashboard/listings?err=no_sub");

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?next=/onboarding/business/claim&session_id=" +
      encodeURIComponent(sessionId)
    );
  }

  // Helper: look up listing_id from our subscriptions table
  const tryFindFromSubscriptions = async () => {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("listing_id, user_id")
      .eq("id", subId)
      .maybeSingle();

    if (!subRow || subRow.user_id !== user.id) return null;
    return (subRow.listing_id as string | null) ?? null;
  };

  // 2) First, see if this subscription is already bound to a listing
  let listingId = await tryFindFromSubscriptions();

  // Give any webhook a moment to write, then retry once
  if (!listingId) {
    await sleep(800);
    listingId = await tryFindFromSubscriptions();
  }

  // 3) If still no listing_id, create or reuse a draft
  if (!listingId) {
    // Prefer reusing an existing draft for this owner to avoid duplicates
    const { data: existingDraft, error: draftLookupErr } = await supabase
      .from("business_listings")
      .select("id")
      .eq("owner_id", user.id)
      .eq("status", "draft")
      .eq("is_active", false)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (draftLookupErr) {
      console.error("Claim: error looking up existing draft", draftLookupErr);
    }

    if (existingDraft?.id) {
      listingId = existingDraft.id;
    } else {
      // No existing draft → create a fresh one
      const { data: draft, error: insertErr } = await supabase
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

      if (!draft?.id || insertErr) {
        console.error("Claim: draft insert failed", insertErr);
        redirect("/dashboard/listings?err=draft_fallback");
      }

      listingId = draft.id;
    }

    // Bind subscription → listing in our DB
    const { error: subUpdErr } = await supabase
      .from("subscriptions")
      .update({ listing_id: listingId })
      .eq("id", subId);

    if (subUpdErr) {
      console.error(
        "Claim: failed to stamp listing_id on subscriptions",
        subUpdErr
      );
    }

    // Also stamp on Stripe subscription metadata (for observability / debugging)
    await stripe.subscriptions.update(subId, {
      metadata: {
        ...(cs.subscription &&
          typeof cs.subscription !== "string" &&
          cs.subscription.metadata
          ? cs.subscription.metadata
          : {}),
        listing_id: listingId,
      },
    });
  }

  // 4) Now we *always* have a listingId → send user into set-up step
  redirect(`/onboarding/business/${listingId}/set-up`);
}
