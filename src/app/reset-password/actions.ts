'use server'

import { createClientRSC } from "@/../utils/supabase/server"

export async function updatePassword(_: unknown, formData: FormData){
    const password = String(formData.get('password') || '')
    const confirm = String(formData.get('confirm') || '')

    if (password.length < 8) return { ok: false, message: "Must be at least 8 characters"}
    if (password != confirm) return  { ok: false, message: "Passwords do not match" }

    const supabase = await createClientRSC()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { ok: false, message: error.message }

    return { ok: true, message: 'Password updated. You can now sign in'}
}