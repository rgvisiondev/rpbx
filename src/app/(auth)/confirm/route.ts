import { NextRequest, NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'
import { createClientRSC } from '@/../utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? 'recovery') as EmailOtpType
  const next = searchParams.get('next') ?? '/reset-password'

  if (token_hash) {
    const supabase = await createClientRSC()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      // Redirect to your reset-password page (absolute or relative)
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(
    new URL('/login?message=invalid_or_expired_link', request.url)
  )
}
