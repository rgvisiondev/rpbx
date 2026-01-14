// utils/supabase/server.ts
import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Minimal: throw a clean error instead of letting supabase throw a cryptic one
  if (!url || !anon) {
    throw new Error(
      "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, anon };
}

// ---------- RSC: READ-ONLY ----------
export async function createClientRSC() {
  const store = await cookies();
  const { url, anon } = requireSupabaseEnv();

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return store.get(name)?.value;
      },
      set(_name, _value, _options) {},
      remove(_name, _options) {},
    },
  });
}

// ---------- Server Action / Route Handler: WRITABLE ----------
export async function createClientWritable() {
  const store = await cookies();
  const { url, anon } = requireSupabaseEnv();

  return createServerClient(url, anon, {
    cookies: {
      get(name) {
        return store.get(name)?.value;
      },
      set(name, value, options) {
        store.set({ name, value, ...(options as CookieOptions) });
      },
      remove(name, options) {
        store.set({
          name,
          value: "",
          ...(options as CookieOptions),
          maxAge: 0,
        });
      },
    },
  });
}
