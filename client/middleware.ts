import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/products(.*)',
  '/services(.*)',
  '/deals(.*)',
  '/contact(.*)',
  '/faq(.*)',
  '/track-order(.*)',
  '/delivery-guide(.*)',
  '/api/products(.*)',
  '/api/reviews(.*)',
  '/api/deals(.*)',
  '/api/cart(.*)',
  // Webhooks must be publicly reachable; they are authenticated via signature, not session
  '/api/payments/webhooks(.*)',
  '/api/payments(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const path = req.nextUrl.pathname
  if (path.startsWith('/api/payments/webhooks') || path.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
