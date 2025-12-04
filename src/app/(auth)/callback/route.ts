// src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  const nextParam = requestUrl.searchParams.get('next') ?? '/'
  const next = nextParam.startsWith('/') ? nextParam : '/'

  // ⬅️ cookies() is async now
  const cookieStore = await cookies()

  // Supabase SSR client wired to Next's cookie store
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // ⬅️ use getAll()
        getAll() {
          return cookieStore.getAll()
        },
        // ⬅️ use setAll()
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // If this runs in a pure RSC context where setting cookies is disallowed,
            // we just ignore — the middleware / other routes handle setting cookies.
          }
        },
      },
    }
  )

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? `${requestUrl.origin}`

      // At this point Supabase auth cookies are set,
      // so DashboardLayout's getUser() should see the user.
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${requestUrl.origin}`

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
