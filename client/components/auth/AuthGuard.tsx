'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/shared'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  fallback = <LoadingSpinner />,
  redirectTo = '/auth/sign-in'
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and no user, redirect to sign in
    if (!loading && !user) {
      const currentPath = window.location.pathname
      const redirectUrl = `${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`
      router.push(redirectUrl)
    }
  }, [user, loading, router, redirectTo])

  // Show loading spinner while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{fallback}</div>
  }

  // Don't render children if no user (will redirect)
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">{fallback}</div>
  }

  // User is authenticated, render children
  return <>{children}</>
}
