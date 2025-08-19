import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Admin access key for basic authentication
const ADMIN_ACCESS_KEY = process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY || 'admin_secret_key_123'

export function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next()
  }

  // Skip middleware for login page
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next()
  }

  // Check if admin is authenticated
  const adminToken = request.cookies.get('admin-token')?.value

  if (!adminToken || adminToken !== ADMIN_ACCESS_KEY) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

