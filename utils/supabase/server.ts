// utils/supabase/server.ts
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ---------- RSC: READ-ONLY ----------
export async function createClientRSC() {
  // Next 15: cookies() is async
  const store = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value
        },
        // no-ops in RSC (cannot write headers/cookies)
        set(_name, _value, _options) {},
        remove(_name, _options) {},
      },
    }
  )
}

// ---------- Server Action / Route Handler: WRITABLE ----------
export async function createClientWritable() {
  const store = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return store.get(name)?.value
        },
        set(name, value, options) {
          store.set({ name, value, ...(options as CookieOptions) })
        },
        remove(name, options) {
          store.set({ name, value: '', ...(options as CookieOptions), maxAge: 0 })
        },
      },
    }
  )
}
