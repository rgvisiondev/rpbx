'use client';

import { Lightbulb, ChevronUp, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type DescriptionAiAssistProps = {
  address: string | null;
  business_name: string | null;
  onGenerated: (value: string | null) => void;
};

export function DescriptionAiAssist({ address, business_name, onGenerated }: DescriptionAiAssistProps) {
  
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGenerateDescription() {
    try {
      if (!url) return;

      setLoading(true);

      const res = await fetch('/api/ai/business-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          address: address ?? '',
          business_name: business_name ?? '',
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'AI generation failed');
      }

      const data = await res.json();
      onGenerated(data.description ?? null);
    } catch (err) {
      console.error('AI generation failed.', err);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="mt-6 mb-3">
      {/* Collapsed: small square card */}
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
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
              <p className="text-xs text-neutral-500 mt-0.5">
                Click to get started
              </p>
            </div>

            <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
          </div>
        </button>
      ) : (
        /* Expanded: your full view */
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
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              disabled={loading}
              className="shrink-0 rounded-md bg-[#9ed3c3] px-4 py-2 text-sm font-medium text-white hover:bg-[#7fb8a9] disabled:opacity-60"
              onClick={handleGenerateDescription}
            >
              {loading ? 'Generating...' : 'Generate from website'}
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