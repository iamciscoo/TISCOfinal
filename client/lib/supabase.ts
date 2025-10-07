import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create browser client that uses cookies for session storage (SSR-compatible)
// This allows the server to read the session cookies via createServerClient
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    // Use createBrowserClient from @supabase/ssr instead of createClient
    // This automatically configures cookie-based storage for SSR compatibility
    supabaseInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()

// Re-export shared types for backward compatibility
export type { Product, Category, CartItem, Order, OrderItem } from './types'
