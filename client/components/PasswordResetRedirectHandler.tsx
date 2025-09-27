'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Component to handle password reset redirects that are incorrectly sent to the home page
 * instead of the proper reset callback page. This happens when Supabase is misconfigured
 * in the dashboard to redirect to home page instead of /auth/reset-callback.
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
    
    // Detect various password reset scenarios that might be misrouted to home page
    const isPasswordResetFlow = (
      // Hash contains auth tokens
      hash.includes('access_token') || 
      hash.includes('type=recovery') ||
      // Search params contain auth tokens  
      searchParams.get('access_token') ||
      searchParams.get('type') === 'recovery' ||
      // Auth code flow
      searchParams.get('code') ||
      // Error scenarios from password reset
      (error && error.includes('access_denied')) ||
      (errorCode && (errorCode.includes('otp_expired') || errorCode.includes('invalid'))) ||
      (errorDescription && (errorDescription.includes('expired') || errorDescription.includes('invalid')))
    )
    
    if (isPasswordResetFlow) {
      console.log('🔄 Detected password reset flow redirected to home page')
      console.log('📧 This suggests Supabase redirect URL is misconfigured')
      console.log('🚀 Redirecting to proper reset callback handler...')
      
      // Preserve all URL parameters and redirect to proper callback
      const searchString = window.location.search
      const hashString = window.location.hash
      const newUrl = `/auth/reset-callback${searchString}${hashString}`
      
      console.log('🔗 Redirecting to:', newUrl)
      router.replace(newUrl)
    }
  }, [router, searchParams])
  
  return null // This component renders nothing
}
