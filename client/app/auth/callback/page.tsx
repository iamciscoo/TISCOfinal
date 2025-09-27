'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import { Loader2 } from 'lucide-react'
import { ProfileDialog } from '@/components/auth/ProfileDialog'

export default function AuthCallback() {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        console.log('OAuth callback starting - URL:', window.location.href)
        
        // First, try to exchange auth code if present (for OAuth flows)
        const urlParams = new URLSearchParams(window.location.search)
        const authCode = urlParams.get('code')
        
        if (authCode) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
            if (data.session && !error) {
              console.log('OAuth session established successfully')
              
              // Check if this is a new user (sign-up) vs returning user (sign-in)
              const isNewUser = data.user?.created_at === data.user?.last_sign_in_at
              console.log('OAuth user status:', { isNewUser, provider: data.user?.app_metadata?.provider })
              
              setIsProcessing(false)
              
              // For OAuth users, especially new ones, show profile completion dialog
              // But NOT as a password reset (OAuth users don't need passwords)
              if (isNewUser) {
                setIsNewUser(true)
                setTimeout(() => {
                  setShowProfileDialog(true)
                }, 800)
              } else {
                // Existing OAuth user, redirect directly
                const redirectTo = urlParams.get('redirectTo')
                router.push(redirectTo || '/')
              }
              
              // Clear the URL to prevent re-processing
              window.history.replaceState({}, document.title, window.location.pathname)
              return
            }
          } catch (codeError) {
            console.log('Auth code exchange failed:', codeError)
          }
        }
        
        // Fallback: Check if we already have a session
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/sign-in?error=callback_failed')
          return
        }

        if (data.session) {
          // Successful authentication, redirect to home or intended page
          const redirectTo = urlParams.get('redirectTo')
          router.push(redirectTo || '/')
        } else {
          // No session found, redirect to sign in
          router.push('/auth/sign-in')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/sign-in?error=callback_failed')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [router])

  const handleProfileDialogClose = () => {
    setShowProfileDialog(false)
    // Redirect to home page after profile completion for new OAuth users
    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo')
    router.push(redirectTo || '/')
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Completing sign in</h2>
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h2>
        <p className="text-gray-600 mb-6">
          {isNewUser 
            ? "You've signed up successfully. Please complete your profile."
            : "You've been logged in successfully."
          }
        </p>
      </div>
      
      {/* Profile Dialog for new OAuth users - NOT a password reset */}
      <ProfileDialog 
        open={showProfileDialog} 
        onOpenChange={handleProfileDialogClose}
        isPasswordReset={false}  // Critical: OAuth users should NOT be treated as password reset
      />
    </div>
  )
}
