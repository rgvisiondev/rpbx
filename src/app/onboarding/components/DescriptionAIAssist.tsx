'use client'

import { getBusinessDescriptionFromSite } from '@/lib/openai-query';
import { Lightbulb } from 'lucide-react';

type DescriptionAiAssistProps = {
    address: string | null;
    business_name: string | null;
}


export function DescriptionAiAssist({address, business_name}: DescriptionAiAssistProps){

    return(
        <div className="mt-6 mb-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#9ed3c3]/20 text-[#60BC9B]">
                <Lightbulb className="h-4 w-4" />
              </span>
              Let AI help describe your business
            </p>

            <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
              Paste your website URL and we’ll generate a confidential, investor-ready business description you can edit.
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                name="website_url"
                placeholder="https://yourbusiness.com"
                className="w-full rounded border px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="shrink-0 rounded-md bg-[#9ed3c3] px-4 py-2 text-sm font-medium text-white hover:bg-[#7fb8a9]"
                // onClick={handleGenerateDescription}
              >
                Generate from website
              </button>
            </div>

            <p className="mt-1 text-[11px] text-neutral-500">
              We won’t include your business name or exact address — only a high-level, opportunity-focused summary.
            </p>
          </div>
    )


}