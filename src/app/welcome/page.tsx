import Image from "next/image";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClientRSC } from "@/../utils/supabase/server";
import EmailVerifiedCTA from "@/components/EmailVerifiedCTA";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Map a role to the page they should land on
type Role = "business" | "investor" | "admin" | "member" | null;
function nextPathForRole(role: Role) {
  if (role === "investor") return "/onboarding/investor/contact";
  if (role === "business") return "/onboarding/business/set-up";
  if (role === "admin") return "/admin";
  return "/dashboard";
}

function asRole(v?: string | null): Exclude<Role, null> | null {
  return v === "investor" || v === "business" || v === "admin" ? v : null;
}

async function getIntendedRole(sessionId?: string): Promise<Role> {
  if (!sessionId) return null;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription.items.data.price"],
  });

  const subscription =
    typeof session.subscription === "object" && session.subscription !== null
      ? (session.subscription as Stripe.Subscription)
      : null;

  const intendedFromSub = asRole(subscription?.metadata?.intended_user_type);
  const intendedFromSession = asRole(session.metadata?.intended_user_type);

  return intendedFromSub ?? intendedFromSession ?? null;
}

export default async function Welcome({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sp = await searchParams;
  const session_id = Array.isArray(sp.session_id) ? sp.session_id[0] : sp.session_id;

  const intendedRole = await getIntendedRole(session_id);
  const intendedNext = nextPathForRole(intendedRole);

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle<{ user_type: Role }>();

    const role: Role = profile?.user_type ?? intendedRole ?? "member";
    redirect(nextPathForRole(role));
  }

  const loginNext = encodeURIComponent(intendedNext || "/onboarding/business/basics");

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-4 lg:py-10">
      <div className="bg-white mx-auto max-w-lg lg:min-w-[500px] p-6 my-5 rounded-xl border border-neutral-200 shadow text-center">
        <Image
          src="/images/logos/Rio-Plex-Logo-Main-Mint-&-Charcoal.png"
          alt="Investors and Business Owners"
          width={2000}
          height={450}
          className="w-full h-auto"
          priority
        />

        <h1 className="text-2xl font-semibold pt-10">Welcome to RPBX!</h1>
        <p className="mt-2 text-neutral-600">
          We’ve saved your purchase. To keep your account secure, please verify your email.
          We’ve sent a link to the email used to create your account.
        </p>

        {/* ✅ Checkbox + Button */}
        <EmailVerifiedCTA loginNext={loginNext} />
      </div>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        If you come across any issues, contact us at{" "}
        <a href="tel:9563225942">956-322-5942</a> or{" "}
        <a href="mailto:info@rioplexbizx.com">info@rioplexbizx.com</a>.
      </div>
    </div>
  );
}
