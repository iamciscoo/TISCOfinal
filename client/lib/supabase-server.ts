import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type User } from '@supabase/supabase-js'
import { validateEnvironment } from './env-check'
import { logger } from './logger'

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
            
            // DEBUG: Log cookie access
            if (name.includes('auth')) {
              logger.debug('Cookie access', { name, present: !!cookie?.value })
            }
            
            if (!cookie?.value) return undefined
            
            // Validate Supabase auth cookies to prevent UTF-8 errors
            if (name.includes('supabase') || name.includes('auth')) {
              try {
                // Test if the cookie value is valid UTF-8 by encoding/decoding
                const testString = decodeURIComponent(encodeURIComponent(cookie.value))
                if (testString !== cookie.value) {
                  logger.warn('Invalid UTF-8 in cookie, ignoring', { cookieName: name })
                  return undefined
                }
                
                // For JWT tokens, validate base64 structure
                if (cookie.value.includes('.')) {
                  const parts = cookie.value.split('.')
                  if (parts.length >= 2) {
                    try {
                      atob(parts[1])
                    } catch {
                      logger.warn('Invalid JWT structure in cookie, ignoring', { cookieName: name })
                      return undefined
                    }
                  }
                }
              } catch (error) {
                logger.warn('Cookie validation failed', { cookieName: name, error })
                return undefined
              }
            }
            
            return cookie.value
          } catch (error) {
            logger.warn('Error reading cookie', { cookieName: name, error })
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
      
      // DEBUG: Log cookie access attempts
      logger.debug('Attempting to get session')
      
      // First try to get session, then user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      logger.debug('Session result', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || 'none',
        hasError: !!sessionError
      })
      
      if (session?.user) {
        logger.debug('User found via session', { email: session.user.email })
        return session.user
      }
      
      // Fallback to getUser()
      logger.debug('No session, trying getUser()')
      const { data: { user }, error } = await supabase.auth.getUser()
      
      logger.debug('getUser() result', {
        hasUser: !!user,
        userId: user?.id || 'none',
        email: user?.email || 'none',
        hasError: !!error
      })
      
      if (error) {
        // If it's a retryable error and we have attempts left
        if (attempt < retries && (error.message?.includes('fetch failed') || error.message?.includes('timeout'))) {
          logger.warn('Auth error in getUser, retrying', { attempt: attempt + 1, totalAttempts: retries + 1, error: error.message })
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Exponential backoff
          continue
        }
        logger.error('Auth error in getUser', error)
        return null
      }
      
      if (user) {
        logger.debug('User found via getUser()', { email: user.email })
      } else {
        logger.debug('No user found')
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
        logger.warn('Exception in getUser, retrying', { attempt: attempt + 1, totalAttempts: retries + 1, error: (error as Error).message })
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Exponential backoff
        continue
      }
      logger.error('Exception in getUser', error)
      return null
    }
  }
  logger.warn('All retry attempts exhausted in getUser', { totalAttempts: retries + 1 })
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
    logger.error('Error fetching user profile', error, { authUserId })
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
    logger.error('Error upserting user profile', error, { userId: user.id })
    return null
  }

  return data
}
