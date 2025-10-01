/**
 * Production-safe logging utility for TISCO platform
 * Replaces console.log statements with proper logging
 */

declare const process: {
  env: {
    NODE_ENV?: string
    [key: string]: string | undefined
  }
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogData {
  [key: string]: unknown
}

export const logger = {
  /**
   * Info logging - development only, silent in production
   */
  info: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data ? data : '')
    }
    // TODO: Send to logging service in production (e.g., LogRocket, DataDog)
  },

  /**
   * Warning logging - always shown
   */
  warn: (message: string, data?: LogData) => {
    console.warn(`[WARN] ${message}`, data ? data : '')
    // TODO: Send to logging service in production
  },

  /**
   * Error logging - always shown and tracked
   */
  error: (message: string, error?: Error | unknown, data?: LogData) => {
    console.error(`[ERROR] ${message}`, error, data ? data : '')
    // TODO: Send to error tracking service (e.g., Sentry)
  },

  /**
   * Debug logging - development only, verbose
   */
  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data ? data : '')
    }
  },

  /**
   * Payment-specific logging with structured data
   */
  payment: (event: string, data: LogData) => {
    const logData = {
      event,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PAYMENT] ${event}`, logData)
    }
    // TODO: Send to payment monitoring service in production
  },

  /**
   * API request logging
   */
  api: (method: string, path: string, status: number, duration?: number, data?: LogData) => {
    const logData = {
      method,
      path,
      status,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString(),
      ...data
    }

    if (process.env.NODE_ENV === 'development') {
      const statusColor = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO'
      console.log(`[API-${statusColor}] ${method} ${path} ${status}`, logData)
    }
    // TODO: Send to API monitoring service in production
  },

  /**
   * Database operation logging
   */
  db: (operation: string, table: string, data?: LogData) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] ${operation} on ${table}`, data ? data : '')
    }
    // TODO: Send to database monitoring service in production
  },

  /**
   * Webhook logging with security considerations
   */
  webhook: (event: string, source: string, verified: boolean, data?: Omit<LogData, 'signature' | 'secret'>) => {
    const logData = {
      event,
      source,
      verified,
      timestamp: new Date().toISOString(),
      ...data
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[WEBHOOK] ${event} from ${source} (verified: ${verified})`, logData)
    }
    // TODO: Send to webhook monitoring service in production
  }
}

/**
 * Conditional logging wrapper for gradual migration
 * Use this to wrap existing console.log statements
 */
export const devLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, data)
  }
}

/**
 * Production-safe assertion logging
 */
export const assert = (condition: boolean, message: string, data?: LogData) => {
  if (!condition) {
    logger.error(`Assertion failed: ${message}`, new Error('Assertion failed'), data)
  }
}

export default logger
