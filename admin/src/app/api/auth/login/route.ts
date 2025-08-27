import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createHmac } from 'node:crypto'

function toBase64Url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function signTimestamp(ts: number, secret: string) {
  const h = createHmac('sha256', secret)
  h.update(String(ts))
  return toBase64Url(h.digest())
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { accessKey?: string }
    const providedKey = String(body?.accessKey || '')

    const adminKey = process.env.ADMIN_ACCESS_KEY
    const sessionSecret = process.env.ADMIN_SESSION_SECRET

    if (!adminKey || !sessionSecret) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    if (providedKey !== adminKey) {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 })
    }

    // Issue a signed, time-bound session token: `${ts}.${sig}`
    const now = Date.now()
    const signature = signTimestamp(now, sessionSecret)
    const token = `${now}.${signature}`

    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


