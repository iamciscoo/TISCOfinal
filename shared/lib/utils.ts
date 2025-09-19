/**
 * Shared utility function for combining CSS classes
 * Used across both client and admin applications
 * 
 * WARNING: This is a placeholder implementation.
 * Each consuming project should implement their own cn function using clsx and tailwind-merge.
 * 
 * Example implementation:
 * ```typescript
 * import { clsx, type ClassValue } from "clsx"
 * import { twMerge } from "tailwind-merge"
 * 
 * export function cn(...inputs: ClassValue[]) {
 *   return twMerge(clsx(inputs))
 * }
 * ```
 */
export function cn(...inputs: any[]): string {
  console.warn('Using fallback cn function. Implement proper cn function with clsx and tailwind-merge in your project.')
  return inputs.filter(Boolean).join(' ')
}

/**
 * Environment variable validation and access
 */
export const getEnvVar = (key: string, fallback?: string): string => {
  if (typeof globalThis.process === 'undefined') {
    throw new Error('getEnvVar can only be used in Node.js environment')
  }
  const value = globalThis.process.env[key]
  if (!value && !fallback) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || fallback!
}

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

/**
 * Standardized API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

/**
 * Creates consistent error response
 */
export const createErrorResponse = (
  error: string, 
  status: number = 500, 
  code?: string, 
  details?: unknown
) => {
  return Response.json(
    { error, code, details } as ApiErrorResponse, 
    { status }
  )
}

/**
 * Creates consistent success response
 */
export const createSuccessResponse = <T>(
  data: T, 
  status: number = 200, 
  message?: string
) => {
  return Response.json(
    { data, message } as ApiSuccessResponse<T>, 
    { status }
  )
}

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Sanitizes and normalizes email
 */
export const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase()
}

/**
 * Database connection configuration
 */
export const getSupabaseConfig = () => {
  const url = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = globalThis.process?.env?.SUPABASE_SERVICE_ROLE!
  const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  return { url, serviceKey, anonKey }
}
