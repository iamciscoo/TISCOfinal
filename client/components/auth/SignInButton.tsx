'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { AuthModal } from './AuthModal'

interface SignInButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function SignInButton({ 
  children, 
  className, 
  variant = "ghost", 
  size = "sm" 
}: SignInButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    )
  }

  if (user) {
    return null // Don't show sign in button if user is already signed in
  }

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        className={className}
        onClick={() => setShowModal(true)}
      >
        {children || (
          <>
            <User className="h-4 w-4 mr-2" />
            Sign In
          </>
        )}
      </Button>
      
      <AuthModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        defaultMode="signin"
      />
    </>
  )
}
