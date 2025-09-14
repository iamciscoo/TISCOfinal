import { createClient } from '@supabase/supabase-js'
import 'server-only'

// Centralized Supabase client factory to prevent connection pool exhaustion
// and ensure consistent configuration across all API routes

let serviceRoleClient: ReturnType<typeof createClient> | null = null
let anonClient: ReturnType<typeof createClient> | null = null

// Service role client for server-side operations (admin access)
export const getServiceRoleClient = () => {
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
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
    anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
