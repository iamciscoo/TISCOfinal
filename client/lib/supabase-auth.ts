import { supabase } from './supabase'  // Use the main singleton client
import { type User, type Session } from '@supabase/supabase-js'

// Use the main singleton client for all auth operations
export const createClient = () => supabase

// Auth helper functions
export const supabaseAuth = {
  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: Record<string, any>) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const supabase = createClient()
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const supabase = createClient()
    return await supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  // Sign out with graceful error handling for stale sessions
  async signOut() {
    const supabase = createClient()
    
    try {
      // Attempt to sign out via API
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      // Ignore 403 or session_not_found errors - session is already invalid
      console.log('Sign out API call failed (session may already be invalid):', error)
    }
    
    // Always clear local storage regardless of API result
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('sb-hgxvlbpvxbliefqlxzak-auth-token')
        sessionStorage.clear()
      } catch (storageError) {
        console.error('Failed to clear storage:', storageError)
      }
    }
    
    // Return success - user is effectively signed out
    return { error: null }
  },

  // Get current session
  async getSession() {
    const supabase = createClient()
    return await supabase.auth.getSession()
  },

  // Get current user
  async getUser() {
    const supabase = createClient()
    return await supabase.auth.getUser()
  },

  // Reset password
  async resetPassword(email: string) {
    const supabase = createClient()
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-callback`
    })
  },

  // Update password
  async updatePassword(password: string) {
    const supabase = createClient()
    return await supabase.auth.updateUser({ password })
  },
}

// Update user metadata
export const updateUser = async (updates: { email?: string; data?: Record<string, any> }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  const supabase = createClient()
  return await supabase.auth.updateUser(updates)
}

// Social login functions
export const signInWithGoogle = async () => {
  const supabase = createClient()
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}



// Types for better TypeScript support
export type AuthUser = User
export type AuthSession = Session
export type AuthError = Error

// Auth state type
export interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
}
