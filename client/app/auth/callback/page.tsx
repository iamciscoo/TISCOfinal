'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-auth'
import { Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/sign-in?error=callback_failed')
          return
        }

        if (data.session) {
          // Successful authentication, redirect to home or intended page
          const redirectTo = new URLSearchParams(window.location.search).get('redirectTo')
          router.push(redirectTo || '/')
        } else {
          // No session found, redirect to sign in
          router.push('/auth/sign-in')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/sign-in?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
