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
  const [verifying, setVerifying] = React.useState(false);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const turnstileRef = React.useRef<TurnstileHandle>(null);

  // Guards to prevent callback loops / duplicate submits
  const submitLockRef = React.useRef(false);
  const lastTokenRef = React.useRef<string | null>(null);

  // Check for error in URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    
    if (error) {
      const errorMessages: Record<string, string> = {
        username_taken: 'This username is already taken. Please choose a different one.',
        account_exists: 'An account with this email already exists. Please sign in instead.',
        verification_failed: 'Verification failed. Please try again.',
        rate_limit: 'Too many attempts. Please wait a moment and try again.',
        missing_fields: 'Please fill out all required fields.',
        invalid_plan: 'Invalid subscription plan selected.',
        unknown: 'An error occurred. Please try again.',
      };
      
      setErrorMsg(errorMessages[error] || errorMessages.unknown);
    }
  }, []);

  const submitWithToken = React.useCallback((token: string) => {
    // Prevent duplicate submits (callback can fire more than once)
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    // Put token into hidden input (server reads turnstile_token)
    setTurnstileToken(token);
    setVerifying(false);

    // Wait for React to update the DOM with the token value, then submit
    setTimeout(() => {
      if (formRef.current) {
        // Use native submit() to bypass the onSubmit handler
        formRef.current.submit();
      }
    }, 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setErrorMsg(null);

    // Prevent double-clicks / rapid submits
    if (submitLockRef.current || verifying) return;

    // New click => allow a new token
    lastTokenRef.current = null;
    submitLockRef.current = false;
    setVerifying(true);

    // Trigger Turnstile; token arrives via onVerify -> submitWithToken
    try {
      await turnstileRef.current?.execute();
    } catch (err) {
      setVerifying(false);
      submitLockRef.current = false;
      setErrorMsg('Verification failed. Please try again.');
      console.log(err);
    }
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
        onVerify={(token) => {
          submitWithToken(token);
        }}
        onError={() => {
          // Release locks so user can retry
          submitLockRef.current = false;
          setVerifying(false);

          // Clear any stale token
          setTurnstileToken(null);

          setErrorMsg("Verification failed. Please try again.");
          // Reset widget for next attempt
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