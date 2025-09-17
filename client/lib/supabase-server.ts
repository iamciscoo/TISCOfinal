import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type User } from '@supabase/supabase-js'
import { validateEnvironment } from './env-check'

export const createClient = async () => {
  const cookieStore = await cookies()
  const env = validateEnvironment()

  return createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Server-side auth helpers
export const getUser = async (): Promise<User | null> => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export const getSession = async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// Get user profile from our users table
export const getUserProfile = async (authUserId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

// Create or update user profile
export const upsertUserProfile = async (user: User) => {
  const supabase = await createClient()
  
  // Normalize names from social metadata
  const meta = user.user_metadata || {}
  const fullName: string = meta.full_name || meta.name || ''
  const given: string = meta.given_name || ''
  const family: string = meta.family_name || ''
  let firstName: string = meta.first_name || given || ''
  let lastName: string = meta.last_name || family || ''
  if (!firstName && fullName) {
    const parts = fullName.trim().split(/\s+/)
    firstName = parts[0] || ''
    lastName = parts.slice(1).join(' ') || ''
  }
  const avatarUrl: string = meta.avatar_url || meta.picture || ''

  const userData = {
    id: user.id,
    auth_user_id: user.id,
    email: user.email!,
    first_name: firstName,
    last_name: lastName,
    avatar_url: avatarUrl,
    phone: meta.phone || null,
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(userData, { onConflict: 'auth_user_id' })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    return null
  }

  return data
}
