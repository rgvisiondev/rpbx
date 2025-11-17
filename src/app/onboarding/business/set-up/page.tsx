// app/onboarding/business/set-up/page.tsx
import { createClientRSC } from '@/../utils/supabase/server'
import { redirect } from 'next/navigation'
import Button from "../../../components/Button";
import { Progress } from "@/components/ui/progress"
import { INDUSTRY_SLUGS } from '@/lib/industryImages';
import IndustryImagePicker from '../../components/IndustryImagePicker';
import { geocodeAddresssTomTom } from '@/lib/geocode';

export default async function Setup() {
  const supabase = await createClientRSC()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding/business/set-up')
  const userId = user.id as string

  // Prefill draft
  const { data: draft } = await supabase
    .from('business_listings')
    .select('id, title, industry, county, city, contact_email, listing_image_choice, address')
    .eq('owner_id', userId)
    .eq('status', 'draft')
    .maybeSingle()

  const INDUSTRIES = Object.keys(INDUSTRY_SLUGS)

  async function save(formData: FormData) {
    'use server'
    const { createClientRSC } = await import('@/../utils/supabase/server')
    const sb = await createClientRSC()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) redirect('/login?next=/onboarding/business/set-up')

    const title    = String(formData.get('title') ?? '').trim()
    const industry = String(formData.get('industry') ?? '').trim()
    const address = String(formData.get('address') ?? "").trim()
    const listing_image_choice = String(formData.get('listing_image_choice') ?? '').trim() || null

    const geo = address ? await geocodeAddresssTomTom(address) : null;

    const city = 
      geo?.city ||
      null;

    const county = 
      geo?.county ||
      null;

    const payload = {
      owner_id: user.id,
      status: 'draft' as const,
      title,
      industry,
      county,
      city: city || null,
      contact_email: user.email ?? null,
      listing_image_choice,
      address,
      country_code: geo?.countryCode ?? "US",
      state_code: geo?.stateCode ?? null,
      postal_code: geo?.postalCode ?? null,
      geocoded_lat: geo?.lat ?? null,
      geocoded_lng: geo?.lng ?? null,
      geocode_place_id: geo?.placeId ?? null,
      geocode_confidence: geo?.confidence ?? null,
      geocoded_at: geo ? new Date().toISOString() : null,
    }

    // Ensure we have a listing id
    let listingId = draft?.id as string | undefined
    if (!listingId) {
      const { data: ins, error: insErr } = await sb
        .from('business_listings')
        .insert(payload)
        .select('id')
        .single()
      if (insErr) {
        console.error(insErr)
        return
      }
      listingId = ins!.id
    } else {
      const { error: updErr } = await sb
        .from('business_listings')
        .update(payload)
        .eq('id', listingId)
      if (updErr) {
        console.error(updErr)
        return
      }
    }

      redirect('/onboarding/business/contact')
    }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 0% Complete</p>
        <Progress value={0} />
      </div>

    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <form action={save} >
      <h1 className="text-2xl font-semibold">Dive Into Your Business</h1>
      <p className="mt-2">Tell us what makes your business unique! Start by adding the essentials — your name, industry, and where you’re based — so local investors can easily discover and connect with you.</p>
      <hr className="mb-1 mt-4" />

      <label className="block pt-4 pt-4">
        <span>Business Title</span>
        <input
          name="title"
          defaultValue={draft?.title ?? ''}
          required
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <IndustryImagePicker
        allIndustries={INDUSTRIES}
        defaultIndustry={draft?.industry ?? ''}
        defaultImageKey={draft?.listing_image_choice ?? ''}
      ></IndustryImagePicker>

      <label className="block pt-4 pt-4">
        <span>Business Address</span>
        <input
          name="address"
          placeholder="123 Main St, McAllen, TX 78501"
          className="mt-1 w-full border rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          We'll only use this to aut-fill city and county. Your exact address is <strong>never</strong> shown to investors.
        </p>
      </label>
      <div className="mt-4 flex gap-3">
        <Button className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>

    </div>
  )
}
