/**
 * Centralized Error Handling for TISCO Platform
 * 
 * Provides consistent error types, error responses, and error handling utilities.
 * Ensures uniform error messages and HTTP status codes across the application.
 */

import { logger } from './logger'

/**
 * Base API Error class with HTTP status code
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Common API error types
 */
export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends APIError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 500, 'DATABASE_ERROR', details)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends APIError {
  constructor(service: string, message: string, details?: Record<string, unknown>) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details)
    this.name = 'ExternalServiceError'
  }
}

/**
 * Error response formatter for API routes
 */
export interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, unknown>
  timestamp: string
}

export function formatErrorResponse(error: unknown): ErrorResponse {
  const timestamp = new Date().toISOString()

  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp
    }
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_ERROR',
      timestamp
    }
  }

  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    timestamp
  }
}

/**
 * Safe error handler for API routes
 */
export function handleAPIError(error: unknown, context?: string): {
  response: ErrorResponse
  status: number
} {
  // Log the error
  logger.error(context || 'API Error', error, {
    type: error instanceof Error ? error.constructor.name : typeof error
  })

  if (error instanceof APIError) {
    return {
      response: formatErrorResponse(error),
      status: error.statusCode
    }
  }

  // Default to 500 for unknown errors
  return {
    response: formatErrorResponse(error),
    status: 500
  }
}

/**
 * Database error parser for Supabase errors
 */
export function parseSupabaseError(error: unknown): APIError {
  if (!error || typeof error !== 'object') {
    return new DatabaseError('Database operation failed')
  }

  const dbError = error as {
    message?: string
    code?: string
    details?: string
    hint?: string
  }

  const code = dbError.code || 'UNKNOWN'
  const message = dbError.message || 'Database error occurred'

  // Check constraint violations
  if (code.startsWith('23')) {
    if (code === '23505') {
      return new ConflictError('Record already exists', { code, details: dbError.details })
    }
    if (code === '23503') {
      return new ConflictError('Related record not found', { code, details: dbError.details })
    }
    if (code === '23502') {
      return new ValidationError('Required field missing', { code, details: dbError.details })
    }
    return new ValidationError(message, { code, details: dbError.details })
  }

  // Permission errors
  if (code === '42501') {
    return new AuthorizationError('Database permission denied')
  }

  // Not found
  if (code === 'PGRST116') {
    return new NotFoundError('Record')
  }

  return new DatabaseError(message, { code, details: dbError.details, hint: dbError.hint })
}

/**
 * Async error wrapper with automatic logging
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    logger.error(context, error)
    throw error
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffFactor?: number
    retryableErrors?: (error: unknown) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryableErrors = () => true
  } = options

  let lastError: unknown
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if this is the last attempt or error is not retryable
      if (attempt === maxRetries || !retryableErrors(error)) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffFactor, maxDelay)
    }
  }

  throw lastError
}

/**
 * Check if error is temporary/retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('fetch failed') ||
      message.includes('network error') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('socket hang up')
    )
  }
  return false
}
