'use server'

import { createClientRSC } from '@/../utils/supabase/server'
import { syncMailerLiteGroups } from '@/lib/mailerlite/mailerlite'

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const full_name = String(formData.get('full_name') ?? '')
  const username = String(formData.get('username') ?? '')

  const supabase = await createClientRSC()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verified`,
    },
  })

  if (error) throw new Error(error.message)

  // ✅ MailerLite: on account creation, treat as non-subscriber
  // never let this break signup
  try {
    await syncMailerLiteGroups(email, null, full_name || undefined)
  } catch (e) {
    console.error('[MailerLite] signup sync failed', e)
  }
}
