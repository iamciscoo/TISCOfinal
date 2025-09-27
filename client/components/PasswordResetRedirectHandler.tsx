'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Component to handle authentication redirects that are incorrectly sent to the home page
 * instead of their proper callback pages. This happens when Supabase is misconfigured
 * in the dashboard. This component properly routes:
 * - Password reset flows: to /auth/reset-callback
 * - OAuth flows (Google, etc.): to /auth/callback
 */
export function PasswordResetRedirectHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if user landed on home page due to password reset redirect
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code') 
    const errorDescription = searchParams.get('error_description')
    const hash = window.location.hash
    
    // CRITICAL: Only detect ACTUAL password reset flows, NOT OAuth flows
    const isPasswordResetFlow = (
      // Hash contains recovery type specifically (not OAuth tokens)
      hash.includes('type=recovery') ||
      // Search params contain recovery type specifically
      searchParams.get('type') === 'recovery' ||
      // Password reset specific error scenarios
      (error && error.includes('access_denied') && hash.includes('type=recovery')) ||
      (errorCode && (errorCode.includes('otp_expired') || errorCode.includes('invalid')) && hash.includes('type=recovery')) ||
      (errorDescription && (errorDescription.includes('expired') || errorDescription.includes('invalid')) && hash.includes('type=recovery'))
    )
    
    // EXCLUDE OAuth flows (these should go to /auth/callback instead)
    const isOAuthFlow = (
      searchParams.get('code') ||  // OAuth authorization code
      hash.includes('provider_token') ||  // OAuth provider token
      searchParams.get('state') ||  // OAuth state parameter
      (hash.includes('access_token') && !hash.includes('type=recovery'))  // OAuth tokens without recovery type
    )
    
    if (isPasswordResetFlow && !isOAuthFlow) {
      console.log('🔄 Detected password reset flow redirected to home page')
      console.log('📧 This suggests Supabase redirect URL is misconfigured')
      console.log('🚀 Redirecting to proper reset callback handler...')
      
      // Preserve all URL parameters and redirect to proper callback
      const searchString = window.location.search
      const hashString = window.location.hash
      const newUrl = `/auth/reset-callback${searchString}${hashString}`
      
      console.log('🔗 Redirecting to:', newUrl)
      router.replace(newUrl)
    } else if (isOAuthFlow) {
      console.log('🔄 Detected OAuth flow redirected to home page')
      console.log('🚀 Redirecting to proper OAuth callback handler...')
      
      // Preserve all URL parameters and redirect to OAuth callback
      const searchString = window.location.search
      const hashString = window.location.hash
      const newUrl = `/auth/callback${searchString}${hashString}`
      
      console.log('🔗 Redirecting to:', newUrl)
      router.replace(newUrl)
    }
  }, [router, searchParams])
  
  return null // This component renders nothing
}
