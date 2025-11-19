// app/onboarding/business/details/page.tsx
import { createClientRSC } from '@/../utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";

export default async function DetailsStep() {
  const supabase = await createClientRSC()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding/business/details')

  // Only select what you need here
  const { data: draft } = await supabase
    .from('business_listings')
    .select(`
      id,
      ownership_percentage,
      annual_revenue_range,
      book_value_range,
      ebitda_range,
      years_in_business,
      employee_count_range,
      description
    `)
    .eq('owner_id', user.id)
    .eq('status', 'draft')
    .maybeSingle()

  if (!draft) redirect('/onboarding/business/set-up')
  const draftId: string | null = draft.id ?? null

  async function save(formData: FormData) {
    'use server'
    const { createClientRSC } = await import('@/../utils/supabase/server')
    const sb = await createClientRSC()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) redirect('/login?next=/onboarding/business/details')

    // Pull values from form
    const ownership_percentage =
      formData.get('ownership_percentage') !== null && String(formData.get('ownership_percentage')) !== ''
        ? Number(formData.get('ownership_percentage'))
        : null

    const annual   = String(formData.get('annual_revenue_range') ?? '')
    const book     = String(formData.get('book_value_range') ?? '')
    const ebitda   = String(formData.get('ebitda_range') ?? '')
    const years    = String(formData.get('years_in_business') ?? '')
    const empCount = String(formData.get('employee_count_range') ?? '')
    const description = (String(formData.get('description') ?? '').trim()) || null

    // Server-side token validation (keep in sync with DB CHECKs)
    const ALLOWED = {
      annual: new Set(['0_50k','50k_100k','100k_250k','250k_1m','1m_plus']),
      book:   new Set(['25k_150k','150k_750k','750k_3m','3m_7m']),
      ebitda: new Set(['lt_50k','50k_150k','150k_500k','500k_1m','gt_1m']),
      years:  new Set(['lt_1','1_3','3_5','5_10','gt_10']),
      emp:    new Set(['1_4','5_10','11_25','26_50','51_100','gt_100']),
    }

    const payload = {
      ownership_percentage,
      annual_revenue_range: ALLOWED.annual.has(annual) ? annual : null,
      book_value_range:     ALLOWED.book.has(book) ? book : null,
      ebitda_range:         ALLOWED.ebitda.has(ebitda) ? ebitda : null,
      years_in_business:    ALLOWED.years.has(years) ? years : null,
      employee_count_range: ALLOWED.emp.has(empCount) ? empCount : null,
      description,
      status: 'draft' as const, // keep as draft on this step
      owner_id: user.id,        // harmless on update; useful if you ever do insert here
    }

    const { error: updErr } = await sb
      .from('business_listings')
      .update(payload)
      .eq('id', draftId)

    if (updErr) {
      console.error(updErr)
      return
    }

    redirect('/onboarding/business/review')
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 60% Complete</p>
        <Progress value={60} />
      </div>
    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <Link href="/onboarding/business/contact" className="text-sm underline hover:text-[#60BC9B]">&larr; Stay Connected & Build Trust</Link>
    <form action={save}>
      <h1 className="text-2xl font-semibold mt-2">Your Business at a Glance</h1>
      <p className="mt-2">Give investors a quick snapshot of your business’s scale and performance. These details help showcase your growth, stability, and potential for future success.</p>
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
          <option value="0_50k">0–50K</option>
          <option value="50k_100k">50K–100K</option>
          <option value="100k_250k">100K–250K</option>
          <option value="250k_1m">250K–1M</option>
          <option value="1m_plus">1M+</option>
        </select>
      </label>

      <label className="block pt-4">
        <span>Book value</span>
        <select
          name="book_value_range"
          defaultValue={draft?.book_value_range ?? ''}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="">—</option>
          <option value="25k_150k">25K–150K</option>
          <option value="150k_750k">150K–750K</option>
          <option value="750k_3m">750K–3M</option>
          <option value="3m_7m">3M–7M</option>
        </select>
      </label>

      <label className="block pt-4">
        <Tooltip>
          <span>EBITDA <TooltipTrigger>ⓘ</TooltipTrigger></span>
          <TooltipContent>EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) shows your business&#39;s profit from operations,<br></br> 
            before accounting for things like loans, taxes, or depreciation. If you&#39;re not sure of your EBITDA,<br></br> 
            you can usually find it in your income statement or financial reports, or calculate it by starting with net<br></br> 
            income and adding back interest, taxes, depreciation, and amortization.</TooltipContent>
        </Tooltip>
        <select
          name="ebitda_range"
          defaultValue={draft?.ebitda_range ?? ''}
          className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
        >
          <option value="">—</option>
          <option value="lt_50k">Under 50K</option>
          <option value="50k_150k">50K–150K</option>
          <option value="150k_500k">150K–500K</option>
          <option value="500k_1m">500K–1M</option>
          <option value="gt_1m">1M+</option>
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
          <option value="lt_1">Less than 1</option>
          <option value="1_3">1–3</option>
          <option value="3_5">3–5</option>
          <option value="5_10">5–10</option>
          <option value="gt_10">10+</option>
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
          <option value="1_4">1–4</option>
          <option value="5_10">5–10</option>
          <option value="11_25">11–25</option>
          <option value="26_50">26–50</option>
          <option value="51_100">51–100</option>
          <option value="gt_100">100+</option>
        </select>
      </label>

      <label className="block pt-4">
        <span>Description</span>
        <textarea
          name="description"
          rows={5}
          defaultValue={draft?.description ?? ''}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <div className="mt-4 flex gap-3">
        <Button className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>
    </div>
  )
}
