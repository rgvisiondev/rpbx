// app/login/page.tsx
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { LoginForm } from "../components/login-form"
import { createClientRSC } from "../../../utils/supabase/server"
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: "Login | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const v = params[key]
  if (Array.isArray(v)) return v[0]
  return v
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams}) {

  const params = await searchParams
  const next = readParam(params, "next")
  const initialError = readParam(params, "error")
  const supabase = await createClientRSC()
  
  //Use getSession() instead of getUser() for consistency
  const { data: { user }, error: sessErr } = await supabase.auth.getUser()

  if (sessErr && sessErr.status !== 400){
    console.error("Login page auth error: ", sessErr)
  }

  if (user) redirect("/dashboard")
  
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center self-center">
          <Image
            src="/images/logos/Rio-Plex-Logo-Main-Mint-&-Charcoal.png"
            width={150}
            height={200}
            alt="RioPlex logo"
            className="h-auto w-[150px]"
            priority
          />
        </Link>
        <LoginForm next={next} initialError={initialError ?? undefined} />
      </div>
    </div>
  )
}