'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoadingSpinner } from '@/components/shared'
import { AuthModal } from './AuthModal'
import { useToast } from '@/hooks/use-toast'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
}

/**
 * Routes where closing the auth modal redirects to homepage
 * instead of showing a "must sign in" toast.
 */
const REDIRECT_ON_CLOSE_ROUTES = ['/checkout', '/cart']

export function AuthGuard({ 
  children, 
  fallback = <LoadingSpinner />,
  requireAuth = true
}: AuthGuardProps) {
  const { user, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [hasShownToast, setHasShownToast] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // If not loading and no user, show auth modal
    if (!loading && !user && requireAuth) {
      setShowAuthModal(true)
      
      // Show helpful toast notification once
      if (!hasShownToast) {
        toast({
          title: "Sign in required",
          description: "Please sign in to continue. New user? Create an account to get started.",
          variant: "default",
          duration: 6000,
        })
        setHasShownToast(true)
      }
    }
    
    // Close modal if user becomes authenticated
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, loading, requireAuth, showAuthModal, hasShownToast, toast])

  // Show loading spinner while checking auth
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{fallback}</div>
  }

  // If no user, show the content but with auth modal overlay
  if (!user && requireAuth) {
    const shouldRedirectOnClose = REDIRECT_ON_CLOSE_ROUTES.some(
      route => pathname.startsWith(route)
    )

    return (
      <>
        {/* Blur the background content */}
        <div className="filter blur-sm pointer-events-none select-none">
          {children}
        </div>
        
        {/* Show auth modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            if (shouldRedirectOnClose) {
              // Redirect to homepage when closing auth modal on checkout/cart
              setShowAuthModal(false)
              router.push('/')
            } else {
              // For other protected routes, show toast and keep modal open
              toast({
                title: "Authentication required",
                description: "You must sign in to access this page.",
                variant: "default",
                duration: 4000,
              })
            }
          }}
          defaultMode="signin"
        />
      </>
    )
  }

  // User is authenticated, render children normally
  return <>{children}</>
}
