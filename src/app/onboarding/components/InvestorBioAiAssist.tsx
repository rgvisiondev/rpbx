"use client";

import { ChevronDown, ChevronUp, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  firstName: string;
  lastName: string;
  organizationEntity: string;
  city: string;
  stateCode: string;
  onGenerated: (value: string | null) => void;
};

type InvestorBioResponse = {
  bio?: string;
  error?: string;
  reset?: number;
};

export function InvestorBioAiAssist({
  firstName,
  lastName,
  organizationEntity,
  city,
  stateCode,
  onGenerated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [investmentFocus, setInvestmentFocus] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!retryAt) return;

    const tick = () => {
      const diffMs = retryAt - Date.now();
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsLeft(seconds);
      if (seconds === 0) setRetryAt(null);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [retryAt]);

  const blocked = retryAt !== null && secondsLeft > 0;

  async function handleGenerateBio() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/ai/investor-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          organizationEntity,
          city,
          stateCode,
          professionalSummary,
          investmentFocus,
          goals,
        }),
      });

      let data: InvestorBioResponse = {};

      try {
        data = (await res.json()) as InvestorBioResponse;
      } catch {
        data = {};
      }

      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || "Rate limit reached. Try again shortly.");
          setRetryAt(typeof data.reset === "number" ? data.reset : Date.now() + 60_000);
        } else {
          setError(data.error || "Something went wrong.");
        }

        return;
      }

      setRetryAt(null);
      setError("");
      onGenerated(data.bio ?? null);
    } catch (err) {
      console.error("Investor bio generation failed:", err);
      setError("Bio generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 mb-3">
      {error && (
        <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-700">
            {blocked ? `${error} Try again in ${secondsLeft}s.` : error}
          </p>
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#9ed3c3]/20 text-[#4f9f88]">
              <Sparkles className="h-5 w-5" />
            </span>

            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Let AI help write your investor bio
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                Use your background, investment focus, or pasted profile summary.
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
          </div>
        </button>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-[#9ed3c3]/10 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#9ed3c3]/25 text-[#4f9f88]">
                  <Sparkles className="h-4 w-4" />
                </span>
                Build an investor-ready bio
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                Paste a professional summary, LinkedIn About section, or describe your investment focus.
                We will turn it into a polished bio that business owners can understand quickly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-xs text-neutral-600 hover:text-neutral-900"
            >
              Hide <ChevronUp className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-[#9ed3c3]/40 bg-white/80 p-3">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#4f9f88]" />
              <p className="text-xs leading-relaxed text-neutral-600">
                Only paste text you are comfortable using for your RioPlex profile.
                You can edit the generated bio before saving.
              </p>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-neutral-800">
              Professional background or pasted summary
            </span>
            <textarea
              rows={4}
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              placeholder="Example: I have experience working with local service businesses, real estate, and growth-stage companies. I am interested in partnering with owners who want strategic support and long-term growth."
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-medium text-neutral-800">
              Investment focus
            </span>
            <textarea
              rows={3}
              value={investmentFocus}
              onChange={(e) => setInvestmentFocus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              placeholder="Example: I am looking for established businesses in professional services, home services, healthcare, logistics, or light manufacturing."
            />
          </label>

          <label className="mt-3 block">
            <span className="text-sm font-medium text-neutral-800">
              Goals or what you want owners to know
            </span>
            <textarea
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none transition focus:border-[#9ed3c3] focus:ring-2 focus:ring-[#9ed3c3]/30"
              placeholder="Example: I value confidentiality, clear communication, and building relationships before discussing deal structure."
            />
          </label>

          <button
            type="button"
            disabled={loading || blocked}
            onClick={handleGenerateBio}
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#9ed3c3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7fb8a9] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Generating..."
              : blocked
                ? `Try again in ${secondsLeft}s`
                : "Generate investor bio"}
          </button>
        </div>
      )}
    </div>
  );
}