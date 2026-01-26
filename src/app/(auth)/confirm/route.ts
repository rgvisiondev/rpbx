import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type = (searchParams.get('type') ?? 'recovery') as EmailOtpType

  const nextParam = searchParams.get('next') ?? '/reset-password'
  const next = nextParam.startsWith('/') ? nextParam : '/reset-password'

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignore
          }
        },
      },
    }
  )

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin
  return NextResponse.redirect(`${baseUrl}/login?message=invalid_or_expired_link`)
}
