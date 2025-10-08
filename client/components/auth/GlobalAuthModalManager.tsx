'use client'

import { useState, useEffect } from 'react'
import { AuthModal } from './AuthModal'

/**
 * Global Auth Modal Manager
 * 
 * Listens for custom events to open auth modals in specific modes.
 * This allows components like toasts to trigger auth modals without
 * needing direct access to modal state.
 */
export function GlobalAuthModalManager() {
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    const handleOpenSignupModal = (event: Event) => {
      const customEvent = event as CustomEvent<{ email?: string }>
      console.log('📨 GlobalAuthModalManager: Received openSignupModal event', customEvent.detail)
      
      // Open signup modal
      setShowSignupModal(true)
    }

    // Listen for custom signup modal events
    window.addEventListener('openSignupModal', handleOpenSignupModal)

    return () => {
      window.removeEventListener('openSignupModal', handleOpenSignupModal)
    }
  }, [])

  const handleCloseSignupModal = () => {
    console.log('🔐 GlobalAuthModalManager: Closing signup modal')
    setShowSignupModal(false)
  }

  return (
    <>
      {/* Global Signup Modal - Triggered by toast actions */}
      {showSignupModal && (
        <AuthModal
          isOpen={showSignupModal}
          onClose={handleCloseSignupModal}
          defaultMode="signup"
        />
      )}
    </>
  )
}
