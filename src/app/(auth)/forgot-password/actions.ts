'use server'

import { createClientRSC } from '@/../utils/supabase/server'

export async function requestReset(_: unknown, formData: FormData){
    const email = String(formData.get(`email`) || '').trim()
    if (!email) return { ok: false, message: 'Email is required'}

    const supabase = await createClientRSC()

    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const redirectTo = `${base}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) return { ok: false, message: error.message}

    return { ok: true, message: "Check your email for the reset link."}
}