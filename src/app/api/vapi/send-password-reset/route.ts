import { NextResponse } from 'next/server'
import { createClientRSC } from '@/../utils/supabase/server'
import crypto from 'crypto'

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function POST(req: Request) {
  try {
    // 1) Auth first
    const auth = req.headers.get('authorization') || ''
    const expected = `Bearer ${process.env.VAPI_TOOL_SECRET || ''}`

    if (!process.env.VAPI_TOOL_SECRET || !safeEqual(auth, expected)) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }

    // 2) Then parse body
    const body = await req.json().catch(() => null)
    const email = String(body?.email || '').trim()

    if (!email) {
      return NextResponse.json({ ok: false, message: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClientRSC()

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.headers.get('origin') ||
      'http://localhost:3000'

    const redirectTo = `${siteUrl}/reset-password`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    // 3) For security, respond the same whether or not it worked
    // (and also whether or not the email exists)
    if (error) {
      // Optional: log internally for debugging
      console.error('resetPasswordForEmail error:', error)
    }

    return NextResponse.json({
      ok: true,
      message: 'If an account exists for that email, a reset link has been sent.',
    })
  } catch (err) {
    return NextResponse.json({ ok: false, message: `Unexpected error, ${err}` }, { status: 500 })
  }
}
