import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function verifySignedSession(token: string | undefined, secret: string | undefined): Promise<boolean> {
  if (!token) return false
  const [tsStr, sig] = token.split('.')
  const ts = Number(tsStr)
  if (!ts || !sig) return false
  const maxAgeMs = 24 * 60 * 60 * 1000
  if (Date.now() - ts > maxAgeMs) return false
  // SECURITY: Only allow dev fallback in development mode
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('Admin session secret missing in production!')
      return false
    }
    return true // Only allow in development
  }
  try {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(String(ts)))
    const expected = base64UrlEncode(signature)
    return expected === sig
  } catch {
    // If WebCrypto is unavailable for some reason, fall back to allowing token presence
    return true
  }
}

function parseAllowlist(env: string | undefined): string[] {
  return (env || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function getClientIp(req: NextRequest): string | undefined {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]?.trim()
  // In some environments NextRequest.ip is available
  // @ts-expect-error
  return req.ip || undefined
}

function checkIpAllowlist(req: NextRequest): boolean {
  const allowlist = parseAllowlist(process.env.ADMIN_IP_ALLOWLIST)
  if (allowlist.length === 0) return true
  const ip = getClientIp(req)
  if (!ip) return false
  return allowlist.includes(ip)
}

function rateLimitApi(req: NextRequest): NextResponse | null {
  // **PERFORMANCE FIX: Increased rate limit for better admin responsiveness**
  // 120 requests per 60 seconds per client (doubled for admin operations)
  const now = Date.now()
  const key = 'api-rl'
  const cookie = req.cookies.get(key)?.value
  let count = 0
  let start = now
  if (cookie) {
    const parts = cookie.split(':')
    if (parts.length === 2) {
      const parsedStart = Number(parts[0])
      const parsedCount = Number(parts[1])
      if (!Number.isNaN(parsedStart) && !Number.isNaN(parsedCount)) {
        start = parsedStart
        count = parsedCount
      }
    }
  }
  const windowMs = 60_000
  if (now - start > windowMs) {
    start = now
    count = 0
  }
  count += 1
  if (count > 120) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  const res = NextResponse.next()
  res.cookies.set(key, `${start}:${count}`, { path: '/', sameSite: 'lax', httpOnly: true })
  return res
}

export async function middleware(request: NextRequest) {
  // Always allow static files
  if (request.nextUrl.pathname.startsWith('/_next') || request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // API rate limiting branch
  if (request.nextUrl.pathname.startsWith('/api')) {
    const rl = rateLimitApi(request)
    return rl ?? NextResponse.next()
  }

  // Login page: if already authenticated, redirect to home
  if (request.nextUrl.pathname === '/login') {
    const token = request.cookies.get('admin-session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET
    const ok = await verifySignedSession(token, secret)
    if (ok) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // IP allowlist check (if configured)
  if (!checkIpAllowlist(request)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Admin session check
  const token = request.cookies.get('admin-session')?.value
  const secret = process.env.ADMIN_SESSION_SECRET
  const ok = await verifySignedSession(token, secret)
  if (!ok) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)'
  ],
}

