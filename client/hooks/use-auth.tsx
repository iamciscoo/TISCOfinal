/**
 * Authentication Context and Hooks for TISCO E-commerce Platform
 * 
 * This module provides a comprehensive authentication system built on Supabase Auth,
 * offering both email/password and social authentication (Google OAuth). It manages
 * user sessions, authentication state, and provides hooks for components to interact
 * with the authentication system.
 * 
 * Key Features:
 * - Email/password authentication with secure password reset
 * - Google OAuth integration for social login
 * - Persistent session management across browser sessions
 * - Real-time authentication state updates
 * - Welcome email notifications for new users
 * - Type-safe authentication context and hooks
 * - Automatic user profile synchronization
 * 
 * The system follows React context patterns to provide authentication state
 * throughout the application while maintaining optimal performance through
 * selective re-renders.
 */

'use client'

// Import React hooks and context utilities for state management
import { createContext, useContext, useEffect, useState } from 'react'
import type React from 'react'
// Import configured Supabase client and social authentication functions
import { createClient, signInWithGoogle } from '@/lib/supabase-auth'
// Import Supabase TypeScript types for type safety
import { 
  type User as AuthUser, 
  type Session as AuthSession,
  type AuthChangeEvent, 
  type Session,
  type AuthResponse,
  type AuthError,
  type UserResponse,
  type OAuthResponse
} from '@supabase/supabase-js'
// Cart store for clearing persisted items on logout to avoid cross-account cart bleed
import { useCartStore } from '@/lib/store'

/**
 * Authentication State Interface
 * 
 * Defines the structure of the authentication state that will be provided
 * to all components through the React context. This ensures type safety
 * and consistent state management across the application.
 */
interface AuthState {
  user: AuthUser | null      // Current authenticated user or null if not logged in
  session: AuthSession | null // Current session data with tokens and metadata
  loading: boolean            // Loading state for authentication operations
}

/**
 * Authentication Context Definition
 * 
 * Creates a React context that combines authentication state with action methods.
 * This context will be provided at the app level and consumed by components
 * that need authentication functionality.
 * 
 * The context includes both state (user, session, loading) and actions
 * (signIn, signUp, signOut, etc.) to provide a complete authentication API.
 */
const AuthContext = createContext<AuthState & {
  // Core authentication actions
  signIn: (email: string, password: string) => Promise<AuthResponse>                                    // Email/password sign in
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<AuthResponse>   // User registration
  signOut: () => Promise<{ error: AuthError | null }>                                                     // Sign out current user
  
  // Password management actions  
  resetPassword: (email: string) => Promise<{ data: unknown | null; error: AuthError | null }>               // Initiate password reset
  updatePassword: (password: string) => Promise<UserResponse>                                            // Update user password
  
  // User profile management
  updateUser: (updates: { email?: string; data?: Record<string, unknown> }) => Promise<UserResponse>    // Update user metadata
  
  // Social authentication
  signInWithGoogle: () => Promise<OAuthResponse>                                                         // Google OAuth sign in
}>({
  // Default state values - will be overridden by the provider
  user: null,           // No user initially
  session: null,        // No session initially  
  loading: true,        // Start in loading state
  
  // Default no-op functions - will be overridden by the provider
  signIn: async () => ({ data: { user: null, session: null }, error: null }),
  signUp: async () => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ data: null, error: null }),
  updatePassword: async () => ({ data: { user: null }, error: { message: 'Not implemented', status: 500 } as AuthError }),
  updateUser: async () => ({ data: { user: null }, error: { message: 'Not implemented', status: 500 } as AuthError }),
  signInWithGoogle: async () => ({ data: { provider: 'google' as const, url: '' }, error: null })
})

/**
 * Authentication Provider Component
 * 
 * This component wraps the entire application to provide authentication context
 * to all child components. It manages authentication state, handles auth events,
 * and provides methods for authentication operations.
 * 
 * The provider initializes the authentication system, sets up event listeners
 * for auth changes, and maintains the current authentication state.
 * 
 * @param children - Child components that will have access to auth context
 * @returns JSX.Element - Provider component wrapping children
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Authentication state management using React hooks
  const [user, setUser] = useState<AuthUser | null>(null)           // Current authenticated user
  const [session, setSession] = useState<AuthSession | null>(null)   // Current session with tokens
  const [loading, setLoading] = useState(true)                      // Loading state for auth operations

  // Initialize Supabase client for authentication operations
  const supabase = createClient()

  /**
   * Authentication State Initialization and Event Handling
   * 
   * This effect runs once when the component mounts and sets up:
   * 1. Initial session recovery from stored tokens
   * 2. Real-time auth state change listeners
   * 3. Cleanup when component unmounts
   */
  useEffect(() => {
    /**
     * Retrieve initial authentication session
     * 
     * Attempts to recover existing session from browser storage
     * (localStorage/sessionStorage) and update component state.
     */
    const getInitialSession = async () => {
      try {
        console.log('🔍 Checking for existing session...')
        // Retrieve session from Supabase (checks stored tokens)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting initial session:', error)
        } else {
          console.log('📋 Initial session check:', !!session, session?.user?.email)
        }
        
        // Update component state with retrieved session data
        setSession(session)                    // Set session data (tokens, metadata)
        setUser(session?.user ?? null)        // Extract user data from session
        setLoading(false)                      // Authentication check complete
      } catch (error) {
        console.error('❌ Failed to get initial session:', error)
        setLoading(false)                      // Clear loading even on error
      }
    }

    // Execute initial session recovery
    getInitialSession()

    /**
     * Set up real-time authentication event listener
     * 
     * Listens for authentication state changes such as:
     * - SIGNED_IN: User successfully authenticated
     * - SIGNED_OUT: User logged out or session expired
     * - TOKEN_REFRESHED: Session tokens were refreshed
     * - USER_UPDATED: User metadata was updated
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔐 Auth state change:', event, 'Session exists:', !!session, 'User exists:', !!session?.user)
        
        // Update component state with new session data
        setSession(session)                  // Update session (may be null on signout)
        setUser(session?.user ?? null)      // Update user data (may be null on signout)
        setLoading(false)                    // Mark authentication state as resolved

        // Handle explicit sign out events
        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out - clearing auth state')
          setUser(null)                      // Clear user data
          setSession(null)                   // Clear session data
          // Note: Component state is already updated above, this is for clarity
        } else if (event === 'SIGNED_IN') {
          console.log('✅ User signed in successfully:', session?.user?.email)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed for user:', session?.user?.email)
        }
      }
    )

    // Cleanup function: unsubscribe from auth events when component unmounts
    return () => subscription.unsubscribe()
  }, [supabase.auth]) // Re-run if supabase.auth instance changes (should be stable)

  /**
   * Email/Password Sign In
   * 
   * Authenticates a user using email and password credentials.
   * Updates loading state during the operation and handles errors gracefully.
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<AuthResponse> - Authentication result with user/session or error
   */
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    setLoading(true) // Show loading state during authentication
    try {
      // Attempt authentication with Supabase
      const result = await supabase.auth.signInWithPassword({ email, password })
      
      // If successful, the loading state will be updated by the auth state change listener
      // If failed, we need to clear loading state here
      if (result.error) {
        setLoading(false)
      }
      
      return result // Return authentication result (success or error)
    } catch (error) {
      setLoading(false) // Clear loading state on error
      throw error
    }
  }

  /**
   * User Registration with Welcome Email
   * 
   * Creates a new user account with optional metadata and sends a welcome email.
   * The welcome email is sent asynchronously and won't fail the signup process
   * if it encounters errors.
   * 
   * @param email - User's email address
   * @param password - User's chosen password
   * @param metadata - Optional user metadata (name, preferences, etc.)
   * @returns Promise<AuthResponse> - Registration result with user/session or error
   */
  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResponse> => {
    setLoading(true) // Show loading state during registration
    try {
      // Attempt user registration with Supabase
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata } // Include user metadata in registration
      })
      
      // Send welcome notification if signup was successful
      if (result.data.user && !result.error) {
        try {
          // Construct user name from metadata for personalized welcome email
          const userName = metadata?.first_name && metadata?.last_name 
            ? `${metadata.first_name} ${metadata.last_name}`    // Full name if available
            : (metadata?.first_name as string) || 'New Customer'  // First name or generic fallback
            
          // Send welcome email to new user
          await fetch('/api/notifications/welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: result.data.user.email,  // User's email address
              name: userName                   // Personalized name for email
            })
          })
          console.log('✅ Welcome email sent to new user')
        } catch (error) {
          // Log error but don't fail the signup process
          console.error('Failed to send welcome notification:', error)
          // Welcome email failure should not prevent successful user registration
        }
      }
      
      // If there's an error, clear loading state immediately
      if (result.error) {
        setLoading(false)
      }
      
      return result // Return registration result
    } catch (error) {
      setLoading(false) // Clear loading state on error
      throw error
    }
  }

  /**
   * User Sign Out
   * 
   * Signs out the current user and handles cart abandonment intelligently:
   * - If cart has items: records abandonment and preserves cart for restoration on next login
   * - If cart is empty: clears any previous abandonment records
   * - Always clears local cart to prevent cross-account carryover
   * 
   * @returns Promise<{ error: AuthError | null }> - Sign out result
   */
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    setLoading(true)
    try {
      // Handle cart abandonment logic BEFORE signing out
      if (user) {
        console.log('LOGOUT DEBUG: Starting cart abandonment process for user:', user.id)

        // Capture current cart data before sign-out
        const cartItems = useCartStore.getState().items
        const hasItems = cartItems.length > 0

        try {
          if (hasItems) {
            // Cart abandonment tracking removed - cart is now client-side only
            console.log('LOGOUT DEBUG: Cart persisted locally for restoration on return')
          } else {
            // Empty cart - no action needed as cart is client-side only
            console.log('LOGOUT DEBUG: Empty cart, no persistence needed')
          }
        } catch (error) {
          console.error('LOGOUT DEBUG: Cart abandonment operation failed (non-blocking):', error)
        }

        // Important: Sign out FIRST so cart sync stops before we clear local cart
        const result = await supabase.auth.signOut()

        // Now clear local persisted cart to prevent cross-account carryover
        try {
          useCartStore.getState().clearCart()
          if (typeof window !== 'undefined') {
            localStorage.removeItem('tisco-cart-storage')
          }
        } catch {}

        return { error: result.error }
      }

      // If no user, just sign out defensively
      const result = await supabase.auth.signOut()
      return { error: result.error }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Password Reset Request
   * 
   * Sends a password reset email to the specified email address.
   * The email will contain a link to reset the password.
   * 
   * @param email - User's email address
   * @returns Promise<{ data: unknown | null; error: AuthError | null }> - Reset request result
   */
  const resetPassword = async (email: string): Promise<{ data: unknown | null; error: AuthError | null }> => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`
    })
  }

  /**
   * Update User Password
   * 
   * Updates the current user's password. User must be authenticated.
   * 
   * @param password - New password
   * @returns Promise<UserResponse> - Update result with user data or error
   */
  const updatePassword = async (password: string): Promise<UserResponse> => {
    return await supabase.auth.updateUser({ password })
  }

  /**
   * Update User Profile
   * 
   * Updates the current user's email or metadata. User must be authenticated.
   * 
   * @param updates - Object containing email and/or data updates
   * @returns Promise<UserResponse> - Update result with user data or error
   */
  const updateUser = async (updates: { email?: string; data?: Record<string, unknown> }): Promise<UserResponse> => {
    return await supabase.auth.updateUser(updates)
  }

  /**
   * Google OAuth Sign In
   * 
   * Initiates Google OAuth authentication flow.
   * 
   * @returns Promise<OAuthResponse> - OAuth authentication result with redirect URL
   */
  const handleSignInWithGoogle = async (): Promise<OAuthResponse> => {
    setLoading(true) // Show loading state during OAuth
    try {
      const result = await signInWithGoogle()
      // OAuth will redirect, so loading state will be cleared by page navigation
      // or by the auth state change listener when user returns
      return result
    } catch (error) {
      setLoading(false) // Clear loading state on error
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateUser,
    signInWithGoogle: handleSignInWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Compatibility hook for legacy useUser references
export function useUser() {
  const { user, loading } = useAuth()
  return {
    user,
    loading,
    isLoaded: !loading,
    isSignedIn: !!user
  }
}
