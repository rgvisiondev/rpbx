// app/onboarding/business/contact/page.tsx
import { createClientRSC } from '@/../utils/supabase/server'
import { redirect } from 'next/navigation'
import Button from "../../../components/Button";
import Link from 'next/link'
import { Progress } from "@/components/ui/progress"

export default async function ContactStep() {
  const supabase = await createClientRSC()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/onboarding/business/contact')

  // Load the active draft (created by the Basics step)
  const { data: draft } = await supabase
    .from('business_listings')
    .select('*')
    .eq('owner_id', user.id)
    .eq('status', 'draft')
    .maybeSingle()

  // If no draft yet, send them back to Basics to start one
  if (!draft) redirect('/onboarding/business/set-up')

async function save(formData: FormData) {
  'use server'
  const { createClientRSC } = await import('@/../utils/supabase/server')
  const sb = await createClientRSC()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login?next=/onboarding/business/contact')

  const { data: currentDraft } = await sb
    .from('business_listings').select('id')
    .eq('owner_id', user.id).eq('status', 'draft')
    .maybeSingle() // safe if uniqueness is enforced
  if (!currentDraft) redirect('/onboarding/business/set-up')

  const contact_email = String(formData.get('contact_email') ?? '')
  const can_provide_financials = formData.get('can_provide_financials') === 'on'
  const can_provide_tax_returns = formData.get('can_provide_tax_returns') === 'on'

  await sb.from('business_listings').update({
    contact_email, can_provide_financials, can_provide_tax_returns
  }).eq('id', currentDraft.id)

  redirect('/onboarding/business/details')
}

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 30% Complete</p>
        <Progress value={30} />
      </div>
    <div className=" bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
    <Link href="/onboarding/business/set-up" className="text-sm underline hover:text-[#60BC9B]">&larr; Let’s Dive Into Your Business</Link>
    <form action={save} >
      <h1 className="text-2xl font-semibold mt-2">Stay Connected & Build Trust</h1>
      <p className="mt-2">Share how investors can reach you and let them know you’re ready to provide key documents when needed. Transparency builds confidence and helps spark meaningful connections.</p>
      <hr className="mb-1 mt-4" />

      <label className="block  pt-4">
        <span>Contact email</span>
        <input
          name="contact_email"
          type="email"
          required
          defaultValue={draft?.contact_email ?? (user?.email ?? '')}
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </label>

      <label className="flex items-center gap-2  pt-4">
        <input type="checkbox" name="can_provide_financials" defaultChecked={!!draft?.can_provide_financials} />
        <span>We can provide financial statements on request</span>
      </label>

      <label className="flex items-center gap-2  pt-2">
        <input type="checkbox" name="can_provide_tax_returns" defaultChecked={!!draft?.can_provide_tax_returns} />
        <span>We can provide tax returns on request</span>
      </label>

      <div className="mt-4 flex gap-3">
        <Button className="w-full">Save & Continue</Button>
      </div>
    </form>
    </div>
    
    </div>
  )
}
