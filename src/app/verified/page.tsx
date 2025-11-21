// app/verified/page.tsx
import Image from "next/image";
import Link from "next/link";
import Button from "../components/Button";

export default function Verified() {
  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-4 lg:py-10">
      <div className="bg-white mx-auto max-w-lg lg:min-w-[500px] p-6 my-5 rounded-xl border border-neutral-200 shadow text-center">
        <Image
          src="/images/logos/Rio-Plex-Logo-Main-Mint-&-Charcoal.png"
          alt="RioPlex"
          width={2000}
          height={450}
          className="w-full h-auto"
          priority
        />

        {/* Success badge */}
        <div className="mx-auto mt-8 mb-3 flex h-14 w-14 items-center justify-center rounded-full"
             style={{ backgroundColor: "#EAF7F3", color: "#2F3E38", border: "1px solid #D7EEE8" }}>
          {/* Checkmark */}
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <path fill="currentColor" d="M9.00049 16.2002L4.80049 12.0002L3.40039 13.4003L9.00049 19.0004L21.0005 7.00039L19.6004 5.60029L9.00049 16.2002Z"/>
          </svg>
        </div>

        <h1 className="text-2xl font-semibold">Thank you — you’re verified!</h1>
        <p className="mt-2 text-neutral-600">
          You’re all set to begin making connections. Click <span className="font-medium">Login</span> to start setting up your account.
        </p>

        {/* Primary CTA */}
        <div className="mx-auto mt-6">
          <Button href="/login">
            Login
          </Button>
        </div>

        {/* Secondary links */}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <Link href="/" className="underline underline-offset-4 text-neutral-600 hover:text-neutral-800">
            Back to Home
          </Link>
          <span className="text-neutral-300">•</span>
          <Link href="/pricing" className="underline underline-offset-4 text-neutral-600 hover:text-neutral-800">
            View Plans
          </Link>
        </div>
      </div>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Need a hand? Call <a href="tel:9563225942">956-322-5942</a> or email <a href="mailto:info@rioplexbizx.com">info@rioplexbizx.com</a>.
      </div>
    </div>
  );
}
