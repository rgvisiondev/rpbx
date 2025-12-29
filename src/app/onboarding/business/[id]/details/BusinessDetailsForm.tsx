'use client';

// app/onboarding/business/[id]/details/DetailsFormClient.tsx
import Link from 'next/link';
import { useState } from 'react';
import Button from '@/app/components/Button';
import { Progress } from "@/components/ui/progress";
import { DescriptionAiAssist } from '@/app/onboarding/components/DescriptionAIAssist';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { ANNUAL_REVENUE_BUCKETS, CASH_FLOW_BUCKETS, EBITDA_BUCKETS, YEARS_IN_BUSINESS_BUCKETS, EMPLOYEE_COUNT_BUCKETS } from '@/lib/ranges';

type BusinessDraft = {
  id: string;
  title: string | null;
  ownership_percentage: number | null;
  annual_revenue_range: string | null;
  cash_flow_range: string | null;
  ebitda_range: string | null;
  years_in_business: string | null;
  employee_count_range: string | null;
  description: string | null;
  address: string | null;
};


type DetailsFormClientProps = {
  listingId: string;
  draft: BusinessDraft;
  save: (formData: FormData) => Promise<void>;
};

export default function DetailsFormClient({ listingId, draft, save }: DetailsFormClientProps) {
  const [description, setDescription] = useState(draft?.description ?? '');

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 60% Complete</p>
        <Progress value={60} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link
          href={`/onboarding/business/${listingId}/contact`}
          className="text-sm underline hover:text-[#60BC9B]"
        >
          &larr; Stay Connected & Build Trust
        </Link>

        <form action={save}>
          <input type="hidden" name="listing_id" value={listingId} />

          <h1 className="text-2xl font-semibold mt-2">Your Business at a Glance</h1>
          <p className="mt-2">
            Give investors a quick snapshot of your business’s scale and performance. These details help
            showcase your growth, stability, and potential for future success.
          </p>
          <hr className="mb-1 mt-4" />

          <label className="block pt-4">
            <span>Ownership percentage</span>
            <input
              name="ownership_percentage"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={draft?.ownership_percentage ?? ''}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block pt-4">
            <span>Annual revenue</span>
            <select
              name="annual_revenue_range"
              defaultValue={draft?.annual_revenue_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {ANNUAL_REVENUE_BUCKETS.map((a) => (
                <option key={a.key} value={a.key}>{a.label}</option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Book value</span>
            <select
              name="cash_flow_range"
              defaultValue={draft?.cash_flow_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {CASH_FLOW_BUCKETS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <Tooltip>
              <span>
                EBITDA <TooltipTrigger>ⓘ</TooltipTrigger>
              </span>
              <TooltipContent>
                EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) shows your<br />
                business&#39;s profit from operations, before accounting for things like loans, taxes,
                or depreciation.
              </TooltipContent>
            </Tooltip>
            <select
              name="ebitda_range"
              defaultValue={draft?.ebitda_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {EBITDA_BUCKETS.map((e) => (
                <option key={e.key} value={e.key}>{e.label}</option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Years in business</span>
            <select
              name="years_in_business"
              defaultValue={draft?.years_in_business ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {YEARS_IN_BUSINESS_BUCKETS.map((y) => (
                <option key={y.key} value={y.key}>{y.label}</option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Employees</span>
            <select
              name="employee_count_range"
              defaultValue={draft?.employee_count_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {EMPLOYEE_COUNT_BUCKETS.map((em) => (
                <option key={em.key} value={em.key}>{em.label}</option>
              ))}
            </select>
          </label>

          <DescriptionAiAssist
            address={draft.address}
            business_name={draft.title}
            onGenerated={(val) => setDescription(val ?? '')}
          />

          <label className="block pt-4">
            <Tooltip>
              <span>
                Description<TooltipTrigger>ⓘ</TooltipTrigger>
              </span>
              <TooltipContent>
                Describe your business story, what you offer, and what makes your operation unique.<br />
                Highlight your experience, customer loyalty, quality, or growth. Avoid listing confidential names, <br />
                exact locations, or sensitive details. Focus on what sets your business apart and why it&#39;s a strong opportunity.
              </TooltipContent>
            </Tooltip>
            <textarea
              name="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border rounded px-3 py-2"
              placeholder='Seasoned local service provider with 10+ years of experience, specializing in quality-focused operations and 
              steady year-over-year growth. Our customer loyalty, efficient processes, 
              and strong regional demand position this business for continued success.'
            />
          </label>

          <div className="mt-4 flex gap-3">
            <Button className="w-full">Save & Continue</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
