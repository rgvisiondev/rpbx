// app/(member)/dashboard/listings/[listingId]/edit/page.tsx
import { createClientRSC } from '@/../utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Button from '@/app/components/Button' // or your shared Button
import { Progress } from '@/components/ui/progress'
import { INDUSTRY_SLUGS } from '@/lib/industryImages'
import IndustryImagePicker from '@/app/onboarding/components/IndustryImagePicker'
import { geocodeAddresssTomTom } from '@/lib/geocode'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import AddressAutocomplete from '@/app/onboarding/components/AddressAutocomplete'
import type { Metadata } from "next";


type Params = { listingId: string }
type PageProps = { params: Promise<Params> }

export const metadata: Metadata = {
  title: "Edit Listing | RioPlex Business Exchange",
  description: "Manage your business listings and subscriptions on RioPlex Business Exchange.",
};

export default async function EditListingPage({ params }: PageProps) {
    const { listingId } = await params;
  const supabase = await createClientRSC()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/dashboard/listings/${listingId}/edit`)

  // Fetch listing the user owns
  const { data: listing } = await supabase
    .from('business_listings')
    .select(`
      id, owner_id, status, is_active,
      title, industry, county, city, contact_email,
      ownership_percentage, annual_revenue_range, book_value_range, ebitda_range,
      years_in_business, employee_count_range, description, listing_image_choice,
      can_provide_financials, can_provide_tax_returns, address
    `)
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!listing) notFound()

    const INDUSTRIES = Object.keys(INDUSTRY_SLUGS)

  async function updateListing(formData: FormData) {
    'use server'
    const { createClientRSC } = await import('@/../utils/supabase/server')
    const sb = await createClientRSC()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) redirect(`/login?next=/dashboard/listings/${listingId}/edit`)

    const id = String(formData.get('id') ?? '')
    if (!id) redirect('/dashboard/listings?msg=missing_id')

    // Basics
    const title    = String(formData.get('title') ?? '').trim()
    const industry = String(formData.get('industry') ?? '').trim()
    const contact_email = String(formData.get('contact_email') ?? '').trim()
    const listing_image_choice = String(formData.get('listing_image_choice') ?? '').trim() || null


    // Details
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
    const address = String(formData.get('address') ?? "").trim()

    const can_provide_financials = formData.get('can_provide_financials') === 'on'
    const can_provide_tax_returns = formData.get('can_provide_tax_returns') === 'on'

    const geo = address ? await geocodeAddresssTomTom(address) : null;

    const city = 
      geo?.city || 
      null;

    const county = 
      geo?.county || 
      null;

    // Keep the same allow-lists you used in onboarding
    const ALLOWED = {
      annual: new Set(['0_50k','50k_100k','100k_250k','250k_1m','1m_plus']),
      book:   new Set(['25k_150k','150k_750k','750k_3m','3m_7m']),
      ebitda: new Set(['lt_50k','50k_150k','150k_500k','500k_1m','gt_1m']),
      years:  new Set(['lt_1','1_3','3_5','5_10','gt_10']),
      emp:    new Set(['1_4','5_10','11_25','26_50','51_100','gt_100']),
    }

    const payload = {
      title,
      industry,
      county,
      city: city || null,
      contact_email: contact_email || null,
      listing_image_choice,

      ownership_percentage,
      annual_revenue_range: ALLOWED.annual.has(annual) ? annual : null,
      book_value_range:     ALLOWED.book.has(book) ? book : null,
      ebitda_range:         ALLOWED.ebitda.has(ebitda) ? ebitda : null,
      years_in_business:    ALLOWED.years.has(years) ? years : null,
      employee_count_range: ALLOWED.emp.has(empCount) ? empCount : null,
      description,

      can_provide_financials,
      can_provide_tax_returns,

      country_code: geo?.countryCode ?? "US",
      state_code: geo?.stateCode ?? null,
      postal_code: geo?.postalCode ?? null,
      geocoded_lat: geo?.lat ?? null,
      geocoded_lng: geo?.lng ?? null,
      geocode_place_id: geo?.placeId ?? null,
      geocode_confidence: geo?.confidence ?? null,
      geocoded_at: geo ? new Date().toISOString() : null,
      address
    }

    // Update core fields first
    const { error: updErr } = await sb
      .from('business_listings')
      .update(payload)
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    if (updErr) {
      console.error('Update failed:', updErr)
      redirect(`/dashboard/listings/${id}/edit?msg=update_failed`)
    }

    // Optional file upload
    const file = formData.get('cover') as File | null
    if (file && file.size > 0) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const key = `${user.id}/${id}/cover.${ext}`

      const { error: uploadErr } = await sb
        .storage
        .from('listings')
        .upload(key, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
        })

      if (uploadErr) {
        console.error('Storage upload failed:', uploadErr)
        redirect(`/dashboard/listings/${id}/edit?msg=upload_failed`)
      }

      const { error: imgUpdErr } = await sb
        .from('business_listings')
        .update({ listing_image_path: key })
        .eq('id', id)
        .eq('owner_id', user.id)
        .single()

      if (imgUpdErr) {
        console.error('listing_image_path update failed:', imgUpdErr)
        redirect(`/dashboard/listings/${id}/edit?msg=image_path_failed`)
      }
    }

    // After successful save, bounce back to details page or listing view
    redirect(`/dashboard/listings?msg=updated`) // or `/listings/${id}`
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Edit Listing</p>
        <Progress value={100} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link href="/dashboard/listings" className="text-sm underline hover:text-[#60BC9B]">&larr; Back to My Listings</Link>

        <form action={updateListing}>
          <input type="hidden" name="id" value={listing.id} />

          <h1 className="text-2xl font-semibold mt-2">Edit Listing</h1>
          <p className="mt-2">Update your listing details. Changes save to the live listing.</p>
          <hr className="mb-1 mt-4" />

          {/* Basics */}
          <label className="block pt-4">
            <span>Business Title</span>
            <input name="title" defaultValue={listing.title ?? ''} required className="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label className="block pt-4">
            <IndustryImagePicker
                allIndustries={INDUSTRIES}
                defaultIndustry={listing?.industry ?? ''}
                defaultImageKey={listing?.listing_image_choice ?? ''}
            ></IndustryImagePicker>
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
          {/* Contact flags */}
          <label className="flex items-center gap-2 pt-4">
            <input type="checkbox" name="can_provide_financials" defaultChecked={!!listing.can_provide_financials} />
            <span>We can provide financial statements on request</span>
          </label>
          <label className="flex items-center gap-2 pt-2">
            <input type="checkbox" name="can_provide_tax_returns" defaultChecked={!!listing.can_provide_tax_returns} />
            <span>We can provide tax returns on request</span>
          </label>

          {/* Details */}
          <label className="block pt-4">
            <span>Ownership percentage</span>
            <input name="ownership_percentage" type="number" min="0" max="100" step="1" defaultValue={listing.ownership_percentage ?? ''} className="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label className="block pt-4">
            <span>Annual revenue</span>
            <select name="annual_revenue_range" defaultValue={listing.annual_revenue_range ?? ''} className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer">
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
              defaultValue={listing?.book_value_range ?? ''}
              className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer"
            >
              <option value="">—</option>

              <option value="0_50k">0–50K</option>
              <option value="50k_150k">50K–150K</option>
              <option value="150k_350k">150K–350K</option>
              <option value="350k_750k">350K–750K</option>
              <option value="750k_1_5m">750K–1.5M</option>
              <option value="1_5m_5m">1.5M–5M</option>
              <option value="5m_plus">5M+</option>
            </select>
          </label>
          <label className="block pt-4">
            <Tooltip>
              <span>
                EBITDA <TooltipTrigger>ⓘ</TooltipTrigger>
              </span>
              <TooltipContent>
                EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization) shows your<br/>
                business&#39;s profit from operations, before accounting for things like loans, taxes,
                or depreciation.
              </TooltipContent>
            </Tooltip>
            <select name="ebitda_range" defaultValue={listing.ebitda_range ?? ''} className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer">
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
            <select name="years_in_business" defaultValue={listing.years_in_business ?? ''} className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer">
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
            <select name="employee_count_range" defaultValue={listing.employee_count_range ?? ''} className="mt-1 w-full border rounded px-3 py-2 hover:cursor-pointer">
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
            <Tooltip>
              <span>
                Description <TooltipTrigger> ⓘ</TooltipTrigger>
                </span>
              <TooltipContent>
                Describe your business story, what you offer, and what makes your operation unique.<br/> 
                Highlight your experience, customer loyalty, quality, or growth. Avoid listing confidential names,<br/> 
                exact locations, or sensitive details. Focus on what sets your business apart and why it&#39;s a strong opportunity.
              </TooltipContent>
            </Tooltip>
            <textarea
              name="description"
              rows={5}
              defaultValue={listing?.description ?? ''}
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
  )
}
