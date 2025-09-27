import { createBrowserClient } from '@supabase/ssr'
import { type User, type Session } from '@supabase/supabase-js'

// Singleton browser client to prevent multiple GoTrueClient instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

// Create Supabase client for browser usage (singleton pattern)
export const createClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}

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

  // Sign out
  async signOut() {
    const supabase = createClient()
    return await supabase.auth.signOut()
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
