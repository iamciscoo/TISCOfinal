import { createClient } from '@supabase/supabase-js'
import type { Database } from './database-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton client to prevent multiple instances with proper typing
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
})()

// Re-export shared types for backward compatibility
export type { Product, Category, CartItem, Order, OrderItem } from './types'
