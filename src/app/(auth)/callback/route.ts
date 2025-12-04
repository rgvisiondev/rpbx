import { NextResponse } from 'next/server'
import { createClientRSC } from '@/../utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const next = searchParams.get('next')?.startsWith('/')
    ? searchParams.get('next')
    : '/'

  const supabase = await createClientRSC()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ??
        'http://localhost:3000'

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
