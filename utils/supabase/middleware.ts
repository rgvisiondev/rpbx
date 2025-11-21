// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          response.cookies.set(name, value, options as CookieOptions)
        },
        remove(name, options) {
          response.cookies.set(name, '', { ...(options as CookieOptions), maxAge: 0 })
        },
      },
    }
  )

  // Only check auth for protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                          request.nextUrl.pathname.startsWith('/business-listing') ||
                          request.nextUrl.pathname.startsWith('/investor-listing')

  if (isProtectedRoute) {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (!session || error) {
      // Redirect to login or home page
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    // Only run middleware on routes that might need protection
    // Exclude static files, API routes (unless you need auth), and public assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)',
  ],
}