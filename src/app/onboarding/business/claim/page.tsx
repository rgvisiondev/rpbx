// app/onboarding/business/claim/page.tsx
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { getStripe } from "@/lib/stripe";
import { cookies } from "next/headers";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Props = {
  searchParams?: Promise<{
    session_id?: string;
  }>;
};

export default async function ClaimPage({ searchParams }: Props) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const sp = await searchParams;
  const sessionId = sp?.session_id;
  if (!sessionId) redirect("/dashboard/listings?err=no_session");

  // 1) Get Checkout Session → subscription id
  const cs = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const subId =
    typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id;

  if (!subId) redirect("/dashboard/listings?err=no_sub");

  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?next=/onboarding/business/claim&session_id=" +
        encodeURIComponent(sessionId),
    );
  }

  // Helper: look up listing_id from our subscriptions table (generated from metadata)
  const tryFindFromSubscriptions = async () => {
    const { data: subRow, error } = await supabase
      .from("subscriptions")
      .select("listing_id, user_id")
      .eq("id", subId)
      .maybeSingle();

    if (error) {
      console.error("Claim: subscriptions lookup error", error);
      return null;
    }

    if (!subRow || subRow.user_id !== user.id) return null;
    return (subRow.listing_id as string | null) ?? null;
  };

  // 2) First, see if webhook already bound it
  let listingId = await tryFindFromSubscriptions();

  // Retry once (webhook timing)
  if (!listingId) {
    await sleep(800);
    listingId = await tryFindFromSubscriptions();
  }

  // 3) If still missing, ask our server (service role) to "ensure" entitlement
  if (!listingId) {
    const res = await fetch("/api/listings/ensure", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookies().toString(),
      },
      body: JSON.stringify({ subId }),
      cache: "no-store",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Claim: ensure failed", res.status, txt);
      redirect("/dashboard/listings?err=ensure_failed");
    }

    const data = (await res.json()) as { listingId?: string | null };
    if (!data?.listingId) {
      console.error("Claim: ensure returned no listingId");
      redirect("/dashboard/listings?err=ensure_no_listing");
    }

    listingId = data.listingId;
  }

  // 4) Always have listingId now
  redirect(`/onboarding/business/${listingId}/set-up`);
}
