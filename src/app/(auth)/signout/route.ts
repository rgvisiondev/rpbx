// app/auth/sign-out/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // Prepare the redirect response up front so we can set cookies on it
    const response = NextResponse.redirect(new URL('/', request.url), { status: 302 })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            response.cookies.set({ name, value, ...(options as CookieOptions) })
          },
          remove(name, options) {
            response.cookies.set({ name, value: '', ...(options as CookieOptions), maxAge: 0 })
          },
        },
      }
    )

    // Sign out - this clears the session and refresh tokens
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Signout error:', error)
      // Still proceed with redirect even if there's an error
    }

    // Revalidate anything that depends on auth
    revalidatePath('/', 'layout')

    return response
  } catch (error) {
    console.error('Unexpected signout error:', error)
    // Fallback redirect even if something goes wrong
    return NextResponse.redirect(new URL('/', request.url), { status: 302 })
  }
}