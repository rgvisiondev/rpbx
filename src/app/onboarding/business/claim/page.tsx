// app/onboarding/business/claim/page.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClientRSC } from "@/../utils/supabase/server";
import { getStripe } from "@/lib/stripe";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Props = {
  searchParams?: Promise<{
    session_id?: string;
  }>;
};

function getBaseUrl() {
  // Prefer a server-only base URL if you have it, otherwise fall back
  // NOTE: NEXT_PUBLIC_SITE_URL should be like https://yourdomain.com
  return process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL?.startsWith("http")
    ? process.env.VERCEL_URL
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
}

export default async function ClaimPage({ searchParams }: Props) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const sp = await searchParams;
  const sessionId = sp?.session_id;
  if (!sessionId) redirect("/dashboard/listings?err=no_session");

  // ✅ Read cookies ONCE (awaited)
  const cookieStore = await cookies();

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

  // Helper: look up listing_id from our subscriptions table
const tryFindFromSubscriptions = async () => {
  const { data: subRow, error } = await supabase
    .from("subscriptions")
    .select("metadata, user_id")
    .eq("id", subId)
    .maybeSingle();

  if (error) {
    console.error("Claim: subscriptions lookup error", error);
    return null;
  }

  if (!subRow || subRow.user_id !== user.id) return null;

  const meta = subRow.metadata as Record<string, unknown> | null;
  const lid = meta && typeof meta["listing_id"] === "string" ? meta["listing_id"] : null;
  return lid;
};


  // 2) First, see if webhook already bound it
  let listingId = await tryFindFromSubscriptions();

  // Retry once (webhook timing)
  if (!listingId) {
    await sleep(800);
    listingId = await tryFindFromSubscriptions();
  }

  // 3) If still missing, call ensure route (needs cookie auth)
  if (!listingId) {
    const baseUrl = getBaseUrl();
    const ensureUrl = new URL("/api/listings/ensure", baseUrl);

    const res = await fetch(ensureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieStore.toString(),
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
