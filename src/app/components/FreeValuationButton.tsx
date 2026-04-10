// app/components/FreeValuationButton.tsx
"use client";

import { useRef, useState } from "react";
import Button from "./Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TurnstileWidget,
  type TurnstileHandle,
} from "@/app/components/TurnstileWidget";

type Props = {
  color?: "white" | "green";
  variant?: "text";
  sourcePage?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function FreeValuationButton({
  color,
  variant,
  sourcePage = "unknown",
}: Props) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const turnstileRef = useRef<TurnstileHandle>(null);
  const submitLockRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setError("");
    setLoading(false);
    submitLockRef.current = false;
    lastTokenRef.current = null;
    turnstileRef.current?.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && loading) return;

    setOpen(nextOpen);

    if (!nextOpen) {
      resetForm();
    }
  };

  async function submitWithToken(token: string) {
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;
    setLoading(true);
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/valuations/free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          sourcePage,
          turnstileToken: token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "We couldn’t start your valuation right now."
        );
      }

      if (!data.redirectUrl) {
        throw new Error("Your valuation link could not be opened.");
      }

      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error("Free valuation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "We couldn’t start your valuation right now. Please try again."
      );
      setLoading(false);
      submitLockRef.current = false;
      turnstileRef.current?.reset();
    }
  }

  const handleSubmit = async () => {
    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (submitLockRef.current || loading) return;

    lastTokenRef.current = null;
    await turnstileRef.current?.execute();
  };

  const trigger =
    variant === "text" ? (
      <button
        type="button"
        className="mt-4 text-sm font-bold text-white underline underline-offset-8 transition hover:cursor-pointer hover:text-[#60BC9B] lg:mt-0"
      >
        Get your free valuation →
      </button>
    ) : (
      <Button
        type="button"
        className={
          color === "white"
            ? "mt-3 w-full sm:w-auto lg:mt-3"
            : "mb-10 w-full max-w-[1000px]"
        }
        variant={color === "white" ? "white" : undefined}
      >
        Get My Free Valuation
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="overflow-hidden rounded-3xl p-0 sm:max-w-[520px]">
        <div className="p-6 sm:p-8">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              Get your free business valuation
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm font-medium leading-6 text-slate-600">
              Enter your name and email and we’ll send your valuation link right
              away, along with an optional consultation link.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="free-valuation-full-name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full Name
              </label>
              <input
                id="free-valuation-full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                disabled={loading}
                autoComplete="name"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#60BC9B]"
              />
            </div>

            <div>
              <label
                htmlFor="free-valuation-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email Address
              </label>
              <input
                id="free-valuation-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-[#60BC9B]"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-2xl bg-[#60BC9B] px-4 py-3 font-bold text-white transition hover:cursor-pointer hover:bg-[#4da685] disabled:opacity-50"
            >
              {loading ? "Opening valuation..." : "Continue"}
            </button>

            <TurnstileWidget
              ref={turnstileRef}
              action="free_valuation"
              onVerify={(token) => submitWithToken(token)}
              onError={() => {
                setError("Verification failed. Please try again.");
                setLoading(false);
                submitLockRef.current = false;
              }}
            />

            <p className="text-xs leading-5 text-slate-500">
              If you’ve requested a valuation before, we’ll simply send your
              access link again.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}