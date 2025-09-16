/**
 * Shared utility function for combining CSS classes
 * Used across both client and admin applications
 * Note: This requires clsx and tailwind-merge to be installed in the consuming project
 */
export function cn(...inputs: any[]) {
  // This will be implemented by the consuming project
  // Each project should import clsx and tailwind-merge locally
  throw new Error('cn function must be implemented in the consuming project')
}

/**
 * Environment variable validation and access
 */
export const getEnvVar = (key: string, fallback?: string): string => {
  if (typeof process === 'undefined') {
    throw new Error('getEnvVar can only be used in Node.js environment')
  }
  const value = process.env[key]
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
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
  const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  
  return { url, serviceKey, anonKey }
}
