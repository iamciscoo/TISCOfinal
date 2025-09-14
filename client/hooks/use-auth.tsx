'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient, signInWithGoogle } from '@/lib/supabase-auth'
import { type User as AuthUser, type Session as AuthSession } from '@supabase/supabase-js'
import { type AuthChangeEvent, type Session } from '@supabase/supabase-js'

// Auth state interface
interface AuthState {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
}

// Create auth context
const AuthContext = createContext<AuthState & {
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<any>
  updatePassword: (password: string) => Promise<any>
  updateUser: (updates: { email?: string; data?: Record<string, any> }) => Promise<any>
  signInWithGoogle: () => Promise<any>
}>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  updateUser: async () => {},
  signInWithGoogle: async () => {}
})

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await supabase.auth.signInWithPassword({ email, password })
      return result
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, any>) => {
    setLoading(true)
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      })
      return result
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
  }

  const updatePassword = async (password: string) => {
    return await supabase.auth.updateUser({ password })
  }

  const updateUser = async (updates: { email?: string; data?: Record<string, any> }) => {
    return await supabase.auth.updateUser(updates)
  }

  const handleSignInWithGoogle = async () => {
    return await signInWithGoogle()
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
