'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import { Loader2 } from 'lucide-react'
import { ProfileDialog } from '@/components/auth/ProfileDialog'

export default function ResetCallback() {
  const router = useRouter()
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleResetCallback = async () => {
      const supabase = createClient()
      
      try {
        // Get the session after password reset
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Reset callback error:', error)
          setError('Failed to complete password reset. Please try again.')
          setIsProcessing(false)
          return
        }

        if (data.session) {
          // User is now logged in after password reset
          setIsProcessing(false)
          // Small delay to let auth context update
          setTimeout(() => {
            setShowProfileDialog(true)
          }, 500)
        } else {
          // No session found, something went wrong
          setError('Password reset session expired. Please request a new reset link.')
          setIsProcessing(false)
        }
      } catch (error) {
        console.error('Reset callback error:', error)
        setError('An unexpected error occurred. Please try again.')
        setIsProcessing(false)
      }
    }

    handleResetCallback()
  }, [])

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
