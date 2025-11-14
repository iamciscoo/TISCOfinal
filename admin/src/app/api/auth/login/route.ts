import { NextResponse } from 'next/server'
import { createHmac } from 'node:crypto'
import { 
  sanitizeInput, 
  validateRequestSize, 
  checkRateLimit 
} from '@/lib/security/sanitizer'

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
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
    
    // Rate limiting: 5 login attempts per 15 minutes per IP
    if (!checkRateLimit(`admin_login_${clientIp}`, 5, 900000)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' }, 
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({})) as { accessKey?: string }
    
    // Validate request size
    validateRequestSize(body, 10) // Max 10KB
    
    const providedKey = sanitizeInput(String(body?.accessKey || ''), 500)

    const adminKey = process.env.ADMIN_ACCESS_KEY
    const sessionSecret = process.env.ADMIN_SESSION_SECRET

    if (!adminKey || !sessionSecret) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
    }

    if (providedKey !== adminKey) {
      // Additional rate limiting for failed attempts
      checkRateLimit(`admin_failed_${clientIp}`, 3, 3600000) // 3 failures per hour
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
      sameSite: 'strict', // Enhanced CSRF protection
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    })
    
    // Set additional security headers
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    
    return res
  } catch {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}


