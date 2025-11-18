import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Pagination metadata interface
export interface PaginationMeta {
  total: number
  count: number
  limit: number
  offset: number
  hasMore: boolean
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
  pagination?: PaginationMeta  // Optional pagination metadata
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown> | unknown[]
  timestamp: string
}

// Standard API Error Codes
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const

// API Response Helpers
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  }
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown> | unknown[]
): ApiResponse {
  const response: ApiResponse = {
    success: false,
    error: code,
    message,
    timestamp: new Date().toISOString()
  }
  
  // Add details to the error message if provided
  if (details) {
    response.message = `${message}: ${JSON.stringify(details)}`
  }
  
  return response
}

// Custom API Error Class
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown> | unknown[]
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Validation Middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function (handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      let data: unknown = {}
      try {

        if (req.method === 'GET') {
          // Parse URL search params for GET requests
          const url = new URL(req.url)
          const params: Record<string, unknown> = {}
          url.searchParams.forEach((value, key) => {
            // Try to parse numbers and booleans
            if (value === 'true') params[key] = true
            else if (value === 'false') params[key] = false
            else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value)
            else params[key] = value
          })
          data = params
        } else {
          // Parse JSON body for other methods
          data = await req.json()
        }

        console.log('[Validation Middleware] Parsing data:', data)
        const validatedData = schema.parse(data)
        console.log('[Validation Middleware] Validation successful')
        return await handler(req, validatedData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('[Validation Middleware] Validation failed:', {
            issues: error.issues,
            data
          })
          return NextResponse.json(
            createErrorResponse(
              API_ERROR_CODES.VALIDATION_ERROR,
              'Validation failed',
              error.issues
            ),
            { status: 400 }
          )
        }

        console.error('Validation middleware error:', error)
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.INTERNAL_ERROR,
            'Internal server error'
          ),
          { status: 500 }
        )
      }
    }
  }
}

// Error Handler Middleware
export function withErrorHandler<T extends (...args: never[]) => Promise<NextResponse>>(
  handler: T
) {
  return async function (...args: Parameters<T>): Promise<NextResponse> {
    try {
      // Forward all arguments to preserve data passed by previous middlewares
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof ApiError) {
        return NextResponse.json(
          createErrorResponse(error.code, error.message, error.details),
          { status: error.statusCode }
        )
      }

      // Handle Supabase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const supabaseError = error as { code: string; message?: string }
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.DATABASE_ERROR,
            supabaseError.message || 'Database operation failed',
            { code: supabaseError.code }
          ),
          { status: 500 }
        )
      }

      // Generic error fallback
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.INTERNAL_ERROR,
          'An unexpected error occurred'
        ),
        { status: 500 }
      )
    }
  }
}

// Rate Limiting (Simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
) {
  return function (handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function (req: NextRequest): Promise<NextResponse> {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()
      const windowStart = now - windowMs

      // Clean up old entries
      for (const [key, value] of rateLimitMap.entries()) {
        if (value.resetTime < windowStart) {
          rateLimitMap.delete(key)
        }
      }

      const current = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs }

      if (current.count >= maxRequests && current.resetTime > now) {
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            'Too many requests'
          ),
          { status: 429 }
        )
      }

      current.count++
      rateLimitMap.set(ip, current)

      return await handler(req)
    }
  }
}

// Authentication Middleware
export function withAuth(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>
) {
  return async function (req: NextRequest): Promise<NextResponse> {
    try {
      // Extract user ID from Supabase session or headers
      const authHeader = req.headers.get('authorization')
      const userId = req.headers.get('x-user-id') // Set by auth middleware

      if (!userId && !authHeader) {
        return NextResponse.json(
          createErrorResponse(
            API_ERROR_CODES.AUTHENTICATION_ERROR,
            'Authentication required'
          ),
          { status: 401 }
        )
      }

      return await handler(req, userId || 'anonymous')
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        createErrorResponse(
          API_ERROR_CODES.AUTHENTICATION_ERROR,
          'Authentication failed'
        ),
        { status: 401 }
      )
    }
  }
}

// Combine multiple middlewares
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withMiddleware(...middlewares: Array<(handler: any) => any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (handler: any) {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}
