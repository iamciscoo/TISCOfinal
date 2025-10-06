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
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            // Increase timeout and add retry logic
            signal: AbortSignal.timeout(20000), // 20 second timeout
          })
        },
      },
      cookies: {
        get(name: string) {
          try {
            const cookie = cookieStore.get(name)
            if (!cookie?.value) return undefined
            
            // Validate Supabase auth cookies to prevent UTF-8 errors
            if (name.includes('supabase') || name.includes('auth')) {
              try {
                // Test if the cookie value is valid UTF-8 by encoding/decoding
                const testString = decodeURIComponent(encodeURIComponent(cookie.value))
                if (testString !== cookie.value) {
                  console.warn(`Invalid UTF-8 in cookie ${name}, ignoring`)
                  return undefined
                }
                
                // For JWT tokens, validate base64 structure
                if (cookie.value.includes('.')) {
                  const parts = cookie.value.split('.')
                  if (parts.length >= 2) {
                    try {
                      atob(parts[1])
                    } catch {
                      console.warn(`Invalid JWT structure in cookie ${name}, ignoring`)
                      return undefined
                    }
                  }
                }
              } catch (error) {
                console.warn(`Cookie validation failed for ${name}:`, error)
                return undefined
              }
            }
            
            return cookie.value
          } catch (error) {
            console.warn(`Error reading cookie ${name}:`, error)
            return undefined
          }
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

// Server-side auth helpers with retry logic
export const getUser = async (retries = 2): Promise<User | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const supabase = await createClient()
      
      // First try to get session, then user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        return session.user
      }
      
      // Fallback to getUser()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        // If it's a retryable error and we have attempts left
        if (attempt < retries && (error.message?.includes('fetch failed') || error.message?.includes('timeout'))) {
          console.warn(`Auth error in getUser (attempt ${attempt + 1}/${retries + 1}):`, error.message)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Exponential backoff
          continue
        }
        console.error('Auth error in getUser:', error)
        return null
      }
      
      return user
    } catch (error) {
      // If it's a retryable error and we have attempts left
      if (attempt < retries && (error instanceof Error && (
        error.message?.includes('fetch failed') || 
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ENOTFOUND')
      ))) {
        console.warn(`Exception in getUser (attempt ${attempt + 1}/${retries + 1}):`, error.message)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Exponential backoff
        continue
      }
      console.error('Exception in getUser:', error)
      return null
    }
  }
  return null
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
