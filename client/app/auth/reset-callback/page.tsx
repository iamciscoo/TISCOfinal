'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import { Loader2 } from 'lucide-react'
import { ProfileDialog } from '@/components/auth/ProfileDialog'

export default function ResetCallback() {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingComplete, setProcessingComplete] = useState(false)
  const hasExecuted = useRef(false)

  useEffect(() => {
    // Prevent double execution in React StrictMode (development)
    if (hasExecuted.current) return
    hasExecuted.current = true

    const handleResetCallback = async () => {
      const supabase = createClient()
      
      try {
        console.log('Reset callback starting - Current URL:', window.location.href)
        
        // First, try to exchange auth code if present (for OAuth/magic link flows)
        // Check if there's an auth code in the URL (different from password reset)
        const urlParams = new URLSearchParams(window.location.search)
        const authCode = urlParams.get('code')
        
        if (authCode) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
            if (data.session && !error) {
              console.log('Session established from auth code successfully')
              setIsProcessing(false)
              setProcessingComplete(true)
              setTimeout(() => {
                setShowProfileDialog(true)
              }, 800)
              // Clear the URL to prevent re-processing
              window.history.replaceState({}, document.title, window.location.pathname)
              return
            }
          } catch (codeError) {
            console.log('No auth code exchange needed:', codeError)
          }
        }
        
        // Check for new token_hash format (PKCE flow)
        const searchUrlParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        
        const tokenHash = searchUrlParams.get('token_hash') || hashParams.get('token_hash')
        const type = searchUrlParams.get('type') || hashParams.get('type')
        
        // Handle PKCE flow with token_hash
        if (tokenHash && type === 'recovery') {
          console.log('Attempting PKCE password reset with token_hash')
          try {
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            })
            
            if (error) {
              console.error('Failed to verify OTP with token_hash:', error)
              if (error.message.includes('expired')) {
                setError('Password reset link has expired. Please request a new reset link.')
              } else if (error.message.includes('invalid')) {
                setError('Password reset link is invalid. Please request a new reset link.')
              } else {
                setError(`Password reset failed: ${error.message}`)
              }
              setIsProcessing(false)
              return
            }
            
            if (data.session) {
              console.log('PKCE password reset session established successfully')
              setIsProcessing(false)
              setProcessingComplete(true)
              setTimeout(() => {
                setShowProfileDialog(true)
              }, 800)
              // Clear the URL to prevent re-processing
              window.history.replaceState({}, document.title, window.location.pathname)
              return
            }
          } catch (tokenError) {
            console.error('PKCE token verification failed:', tokenError)
          }
        }
        
        // Manual parsing fallback for older Supabase versions or edge cases
        let accessToken = hashParams.get('access_token')
        let refreshToken = hashParams.get('refresh_token')
        
        // Fallback to search parameters for legacy format
        if (!accessToken || !refreshToken) {
          accessToken = accessToken || searchUrlParams.get('access_token')
          refreshToken = refreshToken || searchUrlParams.get('refresh_token')
        }
        
        console.log('Reset callback - URL analysis:', {
          hasHash: window.location.hash.length > 1,
          hasSearch: window.location.search.length > 1,
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasAuthCode: !!authCode
        })
        
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Attempting to set session manually with tokens')
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Failed to set session from reset tokens:', error)
            
            // Provide specific error messages based on error type
            if (error.message.includes('expired')) {
              setError('Password reset link has expired. Please request a new reset link.')
            } else if (error.message.includes('invalid') || error.message.includes('JWT')) {
              setError('Password reset link is invalid or malformed. Please request a new reset link.')
            } else if (error.message.includes('used')) {
              setError('Password reset link has already been used. Please request a new reset link.')
            } else {
              setError(`Password reset failed: ${error.message}. Please try requesting a new reset link.`)
            }
            setIsProcessing(false)
            return
          }
          
          if (data.session) {
            console.log('Password reset session established successfully')
            setIsProcessing(false)
            setProcessingComplete(true)
            setTimeout(() => {
              setShowProfileDialog(true)
            }, 800)
            // Clear the URL hash to prevent re-processing
            window.history.replaceState({}, document.title, window.location.pathname)
            return
          }
        }
        
        // Final fallback: Check if we already have a session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session retrieval error:', sessionError)
          setError('Failed to establish session. Please try again.')
          setIsProcessing(false)
          return
        }

        if (sessionData.session) {
          console.log('Existing session found')
          setIsProcessing(false)
          setProcessingComplete(true)
          setTimeout(() => {
            setShowProfileDialog(true)
          }, 800)
        } else {
          // Check if we have error parameters indicating expired/invalid link
          const urlParams = new URLSearchParams(window.location.search)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const error = urlParams.get('error') || hashParams.get('error')
          const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
          const errorDescription = urlParams.get('error_description') || hashParams.get('error_description')
          
          if (error || errorCode || errorDescription) {
            console.log('Received error parameters:', { error, errorCode, errorDescription })
            if (errorCode === 'otp_expired' || (errorDescription && errorDescription.includes('expired'))) {
              setError('Password reset link has expired. Please request a new reset link.')
            } else if (errorCode === 'invalid' || (errorDescription && errorDescription.includes('invalid'))) {
              setError('Password reset link is invalid. Please request a new reset link.')
            } else {
              setError(`Password reset failed: ${errorDescription || error || 'Unknown error'}`)
            }
          } else {
            console.log('No session found, showing generic error')
            setError('Password reset session could not be established. Please request a new reset link.')
          }
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('Reset callback error:', error)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    // Small delay to ensure the page is fully loaded
    const timer = setTimeout(handleResetCallback, 100)
    return () => clearTimeout(timer)
  }, [])

  // Prevent navigation away from this page while processing
  useEffect(() => {
    if (!processingComplete && isProcessing) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = 'Password reset is in progress. Please wait.'
        return 'Password reset is in progress. Please wait.'
      }
      
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [processingComplete, isProcessing])

  const handleProfileDialogClose = () => {
    setShowProfileDialog(false)
    // Redirect to account page after password change
    router.push('/account')
  }

  const handleRetry = () => {
    router.push('/auth/reset-password')
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Reset Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Completing Password Reset</h2>
          <p className="text-gray-600">Please wait while we log you in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-green-600 mb-4">
          <svg className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600 mb-6">You&apos;ve been logged in successfully. Please set a new password.</p>
      </div>
      
      {/* Profile Dialog for Password Change */}
      <ProfileDialog 
        open={showProfileDialog} 
        onOpenChange={handleProfileDialogClose}
        isPasswordReset={true}
      />
    </div>
  )
}
