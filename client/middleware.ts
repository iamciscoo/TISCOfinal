import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Use Node.js runtime to support Supabase APIs
export const runtime = 'nodejs'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/products',
  '/product',
  '/services',
  '/deals',
  '/contact',
  '/faq',
  '/track-order',
  '/delivery-guide',
  '/about',
  '/auth',
  '/cart', // Cart should be accessible without auth
  '/search', // Search should be accessible
  '/terms',
  '/privacy',
  '/cookies',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/browserconfig.xml',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-96x96.png',
  '/favicon-192x192.png',
  '/favicon-512x512.png',
  '/logo-email.png',
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
  '/api/notifications',
  '/api/admin',
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
          try {
            const cookieValue = request.cookies.get(name)?.value
            if (!cookieValue) return undefined
            
            // Validate Supabase auth cookies to prevent UTF-8 errors
            if (name.includes('supabase') || name.includes('auth')) {
              try {
                // Test if the cookie value is valid UTF-8
                const testString = decodeURIComponent(encodeURIComponent(cookieValue))
                if (testString !== cookieValue) {
                  console.warn(`Invalid UTF-8 in middleware cookie ${name}, ignoring`)
                  return undefined
                }
                
                // For JWT tokens, validate base64 structure
                if (cookieValue.includes('.')) {
                  const parts = cookieValue.split('.')
                  if (parts.length >= 2) {
                    try {
                      atob(parts[1])
                    } catch {
                      console.warn(`Invalid JWT in middleware cookie ${name}, ignoring`)
                      return undefined
                    }
                  }
                }
              } catch (error) {
                console.warn(`Middleware cookie validation failed for ${name}:`, error)
                return undefined
              }
            }
            
            return cookieValue
          } catch (error) {
            console.warn(`Error reading middleware cookie ${name}:`, error)
            return undefined
          }  
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
  const isPublic = isPublicRoute(pathname)
  console.log('🌐 Route check:', { pathname, isPublic })
  
  if (isPublic) {
    console.log('✅ Public route, allowing access:', pathname)
    return response
  }
  
  console.log('🔒 Protected route detected:', pathname)

  // For protected routes, check authentication
  try {
    console.log('🛡️ Middleware checking auth for:', pathname)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 Auth check result:', { 
      hasUser: !!user, 
      userEmail: user?.email, 
      authError: authError?.message 
    })

    if (!user) {
      console.log('❌ No user found, redirecting to sign-in')
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
    
    console.log('✅ User authenticated, allowing access to:', pathname)
  } catch (error) {
    console.error('Auth error in middleware:', error)
    
    // If it's a UTF-8 error, clear all auth cookies and redirect/return 401
    if (error instanceof Error && error.message.includes('UTF-8')) {
      console.log('Clearing corrupted auth cookies due to UTF-8 error')
      
      // Create response to clear cookies
      const clearResponse = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      
      // Clear all Supabase auth cookies
      const cookiesToClear = [
        'sb-hgxvlbpvxbliefqlxzak-auth-token',
        'sb-hgxvlbpvxbliefqlxzak-auth-token.0',
        'sb-hgxvlbpvxbliefqlxzak-auth-token.1',
        'supabase-auth-token',
        'supabase.auth.token'
      ]
      
      cookiesToClear.forEach(cookieName => {
        clearResponse.cookies.set({
          name: cookieName,
          value: '',
          expires: new Date(0),
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'lax'
        })
      })
      
      if (!pathname.startsWith('/api/')) {
        const redirectUrl = new URL('/auth/sign-in', request.url)
        redirectUrl.searchParams.set('redirectTo', pathname)
        redirectUrl.searchParams.set('error', 'session_expired')
        return NextResponse.redirect(redirectUrl, { headers: clearResponse.headers })
      }
      
      return NextResponse.json(
        { error: 'Authentication session expired' },
        { status: 401, headers: clearResponse.headers }
      )
    }
    
    // For other auth errors, treat as unauthenticated
    if (!pathname.startsWith('/api/')) {
      const redirectUrl = new URL('/auth/sign-in', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return NextResponse.json(
      { error: 'Authentication error' },
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
