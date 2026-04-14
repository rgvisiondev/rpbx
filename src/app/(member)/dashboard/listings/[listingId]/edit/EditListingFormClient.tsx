'use client';

import Link from 'next/link';
import Button from '@/app/components/Button';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

import { INDUSTRY_OPTIONS } from '@/lib/industryImages';
import IndustryImagePicker from '@/app/onboarding/components/IndustryImagePicker';
import AddressAutocomplete from '@/app/onboarding/components/AddressAutocomplete';
import { DescriptionAiAssist } from '@/app/onboarding/components/DescriptionAIAssist';

import {
  ANNUAL_REVENUE_BUCKETS,
  CASH_FLOW_BUCKETS,
  EBITDA_BUCKETS,
  YEARS_IN_BUSINESS_BUCKETS,
  EMPLOYEE_COUNT_BUCKETS,
} from '@/lib/ranges';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

type EditListing = {
  id: string;
  owner_id: string;
  status: string | null;
  is_active: boolean | null;

  title: string | null;
  industry: string | null;
  county: string | null;
  city: string | null;
  contact_email: string | null;

  ownership_percentage: number | null;
  annual_revenue_range: string | null;
  cash_flow_range: string | null;
  ebitda_range: string | null;
  years_in_business: string | null;
  employee_count_range: string | null;
  description: string | null;
  listing_image_choice: string | null;

  can_provide_financials: boolean | null;
  can_provide_tax_returns: boolean | null;
  address: string | null;
};

type EditListingFormClientProps = {
  listing: EditListing;
  updateListing: (formData: FormData) => Promise<void>;
};

export default function EditListingFormClient({
  listing,
  updateListing,
}: EditListingFormClientProps) {
  const [description, setDescription] = useState(listing?.description ?? '');

  const INDUSTRIES = INDUSTRY_OPTIONS;

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Edit Listing</p>
        <Progress value={100} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link href="/dashboard/listings" className="text-sm underline hover:text-[#60BC9B]">
          &larr; Back to My Listings
        </Link>

        <form action={updateListing}>
          <input type="hidden" name="id" value={listing.id} />

          <h1 className="text-2xl font-semibold mt-2">Edit Listing</h1>
          <p className="mt-2">Update your listing details. Changes save to the live listing.</p>
          <hr className="mb-1 mt-4" />

          <label className="block pt-4">
            <span>Business Title</span>
            <input
              name="title"
              defaultValue={listing.title ?? ''}
              required
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block pt-4">
            <IndustryImagePicker
              allIndustries={INDUSTRIES}
              defaultIndustry={listing?.industry ?? ''}
              defaultImageKey={listing?.listing_image_choice ?? ''}
            />
          </label>

          <label className="block pt-4">
            <span>Business Address</span>
            <AddressAutocomplete
              name="address"
              defaultValue={listing?.address ?? ""}
              placeholder="123 Main St, McAllen, TX 78501"
            />
            <p className="text-xs text-gray-500 mt-1">
              We&apos;ll only use this to auto-fill city and county. Your exact address is{" "}
              <strong>never</strong> shown to investors.
            </p>
          </label>

          <label className="block pt-4">
            <span>Contact email</span>
            <input
              name="contact_email"
              type="email"
              required
              defaultValue={listing?.contact_email ?? ""}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              name="can_provide_financials"
              defaultChecked={!!listing.can_provide_financials}
            />
            <span>We can provide financial statements on request</span>
          </label>

          <label className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              name="can_provide_tax_returns"
              defaultChecked={!!listing.can_provide_tax_returns}
            />
            <span>We can provide tax returns on request</span>
          </label>

          <label className="block pt-4">
            <span>Ownership percentage</span>
            <input
              name="ownership_percentage"
              type="number"
              min="0"
              max="100"
              step="1"
              defaultValue={listing.ownership_percentage ?? ''}
              className="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label className="block pt-4">
            <span>Annual revenue</span>
            <select
              name="annual_revenue_range"
              defaultValue={listing.annual_revenue_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {ANNUAL_REVENUE_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Cash flow (SDE)</span>
            <select
              name="cash_flow_range"
              defaultValue={listing.cash_flow_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {CASH_FLOW_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
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
              defaultValue={listing.ebitda_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {EBITDA_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Years in business</span>
            <select
              name="years_in_business"
              defaultValue={listing.years_in_business ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {YEARS_IN_BUSINESS_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block pt-4">
            <span>Employees</span>
            <select
              name="employee_count_range"
              defaultValue={listing.employee_count_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>
              {EMPLOYEE_COUNT_BUCKETS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <DescriptionAiAssist
            address={listing.address}
            business_name={listing.title}
            onGenerated={(val) => setDescription(val ?? '')}
          />

          <label className="block pt-4">
            <Tooltip>
              <span>
                Description <TooltipTrigger>ⓘ</TooltipTrigger>
              </span>
              <TooltipContent>
                Describe your business story, what you offer, and what makes your operation unique.<br />
                Highlight your experience, customer loyalty, quality, or growth. Avoid listing confidential names,<br />
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
            <Button className="w-full">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}