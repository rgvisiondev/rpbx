'use client';

import { Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

type DescriptionAiAssistProps = {
  address: string | null;
  business_name: string | null;
  onGenerated: (value: string | null) => void;
};

export function DescriptionAiAssist({ address, business_name, onGenerated }: DescriptionAiAssistProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!retryAt) return;

    const tick = () => {
      const diffMs = retryAt - Date.now();
      const s = Math.max(0, Math.ceil(diffMs / 1000));
      setSecondsLeft(s);
      if (s === 0) setRetryAt(null);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [retryAt]);

  const blocked = retryAt !== null && secondsLeft > 0;

  function normalizeUrl(input: string){

    const u = input.trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;

  }

  function formatUrl(){
    const formatted = normalizeUrl(url);

    if (!formatted){
      setError("Please enter a website URL");
      return;
    }

    if (formatted !== url) setUrl(formatted);

    handleGenerateDescription(formatted)
  }

  async function handleGenerateDescription(urlOverride?: string) {
    try {

      const finalUrl = (urlOverride ?? url).trim();
      
      if (!finalUrl) {
        setError('Please enter a website URL.');
        return;
      }

      setError('');
      setLoading(true);

      const res = await fetch('/api/ai/business-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          address: address ?? '',
          business_name: business_name ?? '',
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        if (res.status === 429) {
          // Always show the message
          const msg = data?.error || 'Rate limit reached. Try again shortly.';
          setError(msg);

          // If your API returns a reset timestamp (ms), use it; otherwise fall back to 60s
          const resetTs =
            typeof data?.reset === 'number'
              ? data.reset
              : Date.now() + 60_000;

          setRetryAt(resetTs);
        } else {
          setError(data?.error || 'Something went wrong.');
        }
        return;
      }

      // success
      setRetryAt(null);
      setError('');
      onGenerated(data?.description ?? null);
    } catch (err) {
      console.error('AI generation failed.', err);
      setError('AI generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 mb-3">
      {/* ✅ Always visible when error exists, and clearly “red” */}
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs font-medium text-red-700">
            {blocked ? `${error} Try again in ${secondsLeft}s.` : error}
          </p>
        </div>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            // optional: clear old errors when opening
            // setError('');
          }}
          className="group w-full rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow transition p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#9ed3c3]/20 text-[#60BC9B]">
              <Lightbulb className="h-5 w-5" />
            </span>

            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                Let AI help describe your business
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">Click to get started</p>
            </div>

            <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
          </div>
        </button>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#9ed3c3]/20 text-[#60BC9B]">
                <Lightbulb className="h-4 w-4" />
              </span>
              Let AI help describe your business
            </p>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
            >
              Hide <ChevronUp className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
            Paste your website URL and we’ll generate a confidential, investor-ready business description you can edit.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              name="website_url"
              placeholder="https://yourbusiness.com"
              className="w-full rounded border px-3 py-2 text-sm"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                // optional: clear error while typing
                // setError('');
              }}
            />
            <button
              type="button"
              disabled={loading || blocked}
              className="shrink-0 rounded-md bg-[#9ed3c3] px-4 py-2 text-sm font-medium text-white hover:bg-[#7fb8a9] disabled:opacity-60"
              onClick={formatUrl}
            >
              {loading
                ? 'Generating...'
                : blocked
                  ? `Try again in ${secondsLeft}s`
                  : 'Generate from website'}
            </button>
          </div>

          <p className="mt-1 text-[11px] text-neutral-500">
            We won’t include your business name or exact address — only a high-level, opportunity-focused summary.
          </p>
        </div>
      )}
    </div>
  );
}
