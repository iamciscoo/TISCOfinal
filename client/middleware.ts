import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/products',
  '/services',
  '/deals',
  '/contact',
  '/faq',
  '/track-order',
  '/delivery-guide',
  '/about',
  '/auth',
  '/api/products',
  '/api/categories',
  '/api/services',
  '/api/reviews',
  '/api/deals',
  '/api/contact-messages',
  '/api/newsletter',
  '/api/service-bookings',
  '/api/payments/webhooks',
  '/api/payments',
]

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Allow webhooks to pass through without auth
  if (pathname.startsWith('/api/payments/webhooks') || pathname.startsWith('/api/webhooks')) {
    return response
  }

  // Check if route is public
  if (isPublicRoute(pathname)) {
    return response
  }

  // For protected routes, check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to sign in for protected pages
    if (!pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/auth/sign-in', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    // Return 401 for protected API routes
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|mp4|webm|ogg|mp3|wav|mov|m4v)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
