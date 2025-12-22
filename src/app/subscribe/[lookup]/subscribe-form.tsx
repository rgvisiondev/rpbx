// src/app/subscribe/[lookup]/subscribe-form.tsx
"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "../../components/Button";
import { TurnstileWidget, type TurnstileHandle } from "@/app/components/TurnstileWidget";

export function SubscribeForm({
  lookup,
  trialDays = 0,
}: {
  lookup: string;
  trialDays?: number;
}) {
  const [showPw, setShowPw] = React.useState(false);
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const turnstileRef = React.useRef<TurnstileHandle>(null);

  // Guards to prevent callback loops / duplicate submits
  const submitLockRef = React.useRef(false);
  const lastTokenRef = React.useRef<string | null>(null);

  // If you want extra UX: disable the button while verifying/submitting
  const [verifying, setVerifying] = React.useState(false);

  const submitWithToken = (token: string) => {
    // Prevent duplicate submits (callback can fire more than once)
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    // Put token into hidden input (server reads turnstile_token)
    setTurnstileToken(token);

    // Submit the native form exactly once
    // (use requestSubmit when available to respect form validation)
    if (formRef.current) {
      if (typeof formRef.current.requestSubmit === "function") {
        formRef.current.requestSubmit();
      } else {
        formRef.current.submit();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    // Prevent double-clicks / rapid submits
    if (submitLockRef.current || verifying) return;

    // New click => allow a new token
    lastTokenRef.current = null;

    setVerifying(true);

    // Trigger Turnstile; token arrives via onVerify -> submitWithToken
    await turnstileRef.current?.execute();

    // If script isn't ready, execute() calls onError; we unset verifying there.
    // If it succeeds, the form will submit and navigate away.
    // If it fails silently, we can safely re-enable after a short tick.
    // (keeps UX responsive without reintroducing loops)
    setTimeout(() => {
      // Only unlock if we didn't already submit (lock remains true after submitWithToken)
      if (!submitLockRef.current) setVerifying(false);
    }, 0);
  };

  return (
    <form
      ref={formRef}
      method="post"
      action="/api/subscribe"
      onSubmit={handleSubmit}
      className="mt-6 space-y-3"
    >
      <input name="lookup" type="hidden" value={lookup} />
      {trialDays > 0 && <input name="trial_days" type="hidden" value={trialDays} />}

      <input type="hidden" name="turnstile_token" value={turnstileToken ?? ""} />

      <label className="block">
        <span>First name</span>
        <input
          name="first_name"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Last name</span>
        <input
          name="last_name"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Username</span>
        <input
          name="username"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Password</span>
        <div className="relative mt-1">
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="new-password"
            className="w-full border rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
          />
          <button
            type="button"
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((s) => !s)}
            className="absolute inset-y-0 right-2 flex items-center"
          >
            {showPw ? (
              <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
            ) : (
              <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
            )}
          </button>
        </div>
      </label>

      <TurnstileWidget
        ref={turnstileRef}
        action="signup"
        onVerify={(token) => submitWithToken(token)}
        onError={() => {
          // Release locks so user can retry
          submitLockRef.current = false;
          setVerifying(false);

          // Clear any stale token
          setTurnstileToken(null);

          setErrorMsg("Verification failed. Please try again.");
          // Optional: make sure widget is fresh for the next click
          turnstileRef.current?.reset();
        }}
      />

      {errorMsg && (
        <p className="text-sm text-red-600 mt-2" aria-live="polite">
          {errorMsg}
        </p>
      )}

      <Button className="w-full" disabled={verifying}>
        {verifying ? "Verifying..." : "Continue to secure checkout"}
      </Button>
    </form>
  );
}
