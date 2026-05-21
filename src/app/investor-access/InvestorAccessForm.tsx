"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/app/components/TurnstileWidget";

export function InvestorAccessForm() {
  const lookup =
    process.env.NEXT_PUBLIC_STRIPE_LOOKUP_INVESTOR ?? "investor_monthly";

  const [showPw, setShowPw] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const turnstileRef = React.useRef<TurnstileHandle>(null);

  const submitLockRef = React.useRef(false);
  const lastTokenRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      const errorMessages: Record<string, string> = {
        username_taken:
          "This username is already taken. Please choose a different one.",
        account_exists:
          "An account with this email already exists. Please sign in instead.",
        verification_failed: "Verification failed. Please try again.",
        rate_limit: "Too many attempts. Please wait a moment and try again.",
        missing_fields: "Please fill out all required fields.",
        invalid_plan: "Invalid subscription plan selected.",
        unknown: "An error occurred. Please try again.",
      };

      setErrorMsg(errorMessages[error] || errorMessages.unknown);
    }
  }, []);

  const submitWithToken = React.useCallback((token: string) => {
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    setTurnstileToken(token);
    setVerifying(false);

    setTimeout(() => {
      formRef.current?.submit();
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMsg(null);

    if (submitLockRef.current || verifying) return;

    lastTokenRef.current = null;
    submitLockRef.current = false;
    setVerifying(true);

    try {
      await turnstileRef.current?.execute();
    } catch (err) {
      setVerifying(false);
      submitLockRef.current = false;
      setErrorMsg("Verification failed. Please try again.");
      console.log(err);
    }
  };

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/subscribe"
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <input name="lookup" type="hidden" value={lookup} />
      <input type="hidden" name="turnstile_token" value={turnstileToken ?? ""} />
      <input type="hidden" name="source" value="investor_access" />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="investor_first_name"
            className="mb-1 block text-xs font-bold uppercase text-slate-700"
          >
            First Name
          </label>
          <input
            type="text"
            id="investor_first_name"
            name="first_name"
            placeholder="John"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20"
            required
          />
        </div>

        <div>
          <label
            htmlFor="investor_last_name"
            className="mb-1 block text-xs font-bold uppercase text-slate-700"
          >
            Last Name
          </label>
          <input
            type="text"
            id="investor_last_name"
            name="last_name"
            placeholder="Doe"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20"
            required
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="investor_username"
          className="mb-1 block text-xs font-bold uppercase text-slate-700"
        >
          Username
        </label>
        <input
          type="text"
          id="investor_username"
          name="username"
          placeholder="JohnDoe99"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20"
          required
        />
      </div>

      <div>
        <label
          htmlFor="investor_email"
          className="mb-1 block text-xs font-bold uppercase text-slate-700"
        >
          Email Address
        </label>
        <input
          type="email"
          id="investor_email"
          name="email"
          placeholder="john.doe@example.com"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20"
          required
        />
      </div>

      <div className="relative">
        <label
          htmlFor="investor_password"
          className="mb-1 block text-xs font-bold uppercase text-slate-700"
        >
          Password
        </label>
        <input
          type={showPw ? "text" : "password"}
          id="investor_password"
          name="password"
          placeholder="••••••••"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-12 font-medium text-slate-900 outline-none transition-all focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20"
          required
        />

        <button
          type="button"
          aria-label={showPw ? "Hide password" : "Show password"}
          onClick={() => setShowPw((s) => !s)}
          className="absolute inset-y-0 right-4 top-6 flex items-center"
        >
          {showPw ? (
            <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
          ) : (
            <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
          )}
        </button>
      </div>

      <TurnstileWidget
        ref={turnstileRef}
        action="investor_signup"
        onVerify={(token) => {
          submitWithToken(token);
        }}
        onError={() => {
          submitLockRef.current = false;
          setVerifying(false);
          setTurnstileToken(null);
          setErrorMsg("Verification failed. Please try again.");
          turnstileRef.current?.reset();
        }}
      />

      {errorMsg && (
        <p className="text-sm text-red-600" aria-live="polite">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={verifying}
        className="group mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#60BC9B] py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4da685] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {verifying ? "Verifying..." : "Create Investor Account"}
        {!verifying && (
          <i className="fas fa-arrow-right transition-transform group-hover:translate-x-1" />
        )}
      </button>

      <p className="small text-center text-grey">
        By joining, you agree to RPBX&apos;s{" "}
        <Link href="/terms" className="underline hover:text-[#60BC9B]">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-[#60BC9B]">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}