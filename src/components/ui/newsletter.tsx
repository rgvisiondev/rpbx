"use client";

import React, { useRef, useState } from "react";
import { TurnstileWidget, type TurnstileHandle } from "@/app/components/TurnstileWidget";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Turnstile: execute-on-submit (no token stored long-term)
  const turnstileRef = useRef<TurnstileHandle>(null);

  // Guards to prevent callback loops / duplicate submits
  const submitLockRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  async function submitWithToken(token: string) {
    // Prevent duplicate submits (callback can fire more than once)
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/ml-subscribe-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, email, turnstileToken: token }),
      });

      if (res.ok) {
        setSuccess(true);
        setName("");
        setEmail("");
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error ?? "Failed to signup. Please try again.");
        setSuccess(false);
      }
    } catch {
      setErrorMsg("Failed to signup. Please try again.");
      setSuccess(false);
    } finally {
      setLoading(false);

      // Release lock AFTER request finishes
      submitLockRef.current = false;

      // Reset so user can submit again later (tokens are single-use)
      turnstileRef.current?.reset();
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccess(false);

    // Prevent double-clicks / rapid submits
    if (submitLockRef.current || loading) return;

    if (!email) {
      setErrorMsg("Please fill out all fields");
      return;
    }
    if (!name) {
      setErrorMsg("Please enter your name");
      return;
    }

    // New click => allow a new token
    lastTokenRef.current = null;

    // Trigger Turnstile; token arrives via onVerify -> submitWithToken
    await turnstileRef.current?.execute();
  };

  return (
    <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center bg-fixed py-10 px-4 lg:px-0">
      <div className="bg-white flex flex-col items-center w-full lg:w-[900px] min-h-[300px] rounded-2xl py-10 px-6 lg:px-20 mx-4 shadow-lg border-2 border-grey-500 transition-transform duration-300 hover:scale-101 hover:shadow-xl">
        <h2 className="text-center mb-2">Business Marketplace Expert Insights</h2>
        <p className="text-center">
          Join our monthly newsletter for expert insights on selling your business, business valuations, seller financing strategies, and the latest businesses for sale. Get advice on CIM preparation, mergers and acquisitions, and connecting directly with investors in Texas.
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="mt-5 w-full px-6 py-2 rounded-full font-medium bg-[#EDE2E2]"
            required
          />

          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mt-5 w-full px-6 py-2 rounded-full font-medium bg-[#EDE2E2]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Sign Up"}
          </button>

          <TurnstileWidget
            ref={turnstileRef}
            action="newsletter"
            onVerify={(token) => submitWithToken(token)}
            onError={() => {
              // Don't unlock here; lock is released in finally.
              setErrorMsg("Verification failed. Please try again.");
              setSuccess(false);
            }}
          />
        </form>

        {success && (
          <p className="mt-4 bg-green-100 w-full rounded-full py-2 text-center">
            Thank you for subscribing!
          </p>
        )}

        {!success && errorMsg && (
          <p className="mt-4 bg-red-100 w-full rounded-full py-2 text-center">
            {errorMsg}
          </p>
        )}

        <p className="mt-5 pt-2 border-t-2 border-[#A1A1A1] text-center small text-grey">
          By submitting this form, you agree to receive marketing emails from info@rioplexbizx.com. You can unsubscribe
          at any time. Emails are serviced by MailerLite.
        </p>
      </div>
    </div>
  );
}
