// /src/lib/googleAuth.ts
'use client'

import { createClient } from '@/../utils/supabase/client'

export async function signInWithGoogle(next: string = '/dashboard') {
  const supabase = createClient()

  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
}
