// Your login actions file
'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClientWritable } from '@/../utils/supabase/server' // ✅ Use writable client

export async function login(formData: FormData) {
  const supabase = await createClientWritable() // ✅ Changed from createClientRSC
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const next = String(formData.get('next') || '')

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}${next ? `&next=${encodeURIComponent(next)}` : ''}`)
  }

  revalidatePath('/', 'layout')
  redirect(next || '/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClientWritable() // ✅ Changed from createClientRSC
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  const { error } = await supabase.auth.signUp({ email, password })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/login?info=check_email')
}