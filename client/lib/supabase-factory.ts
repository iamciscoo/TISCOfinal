import { createClient } from '@supabase/supabase-js'
import { validateEnvironment } from './env-check'
import 'server-only'

// Centralized Supabase client factory to prevent connection pool exhaustion
// and ensure consistent configuration across all API routes

let serviceRoleClient: ReturnType<typeof createClient> | null = null
let anonClient: ReturnType<typeof createClient> | null = null

// Service role client for server-side operations (admin access)
export const getServiceRoleClient = () => {
  if (!serviceRoleClient) {
    const env = validateEnvironment()
    if (!process.env.SUPABASE_SERVICE_ROLE) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable')
    }
    serviceRoleClient = createClient(
      env.supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return serviceRoleClient
}

// Anonymous client for client-side operations with RLS
export const getAnonClient = () => {
  if (!anonClient) {
    const env = validateEnvironment()
    anonClient = createClient(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return anonClient
}

// Reset clients (useful for testing or configuration changes)
export const resetClients = () => {
  serviceRoleClient = null
  anonClient = null
}
