/**
 * Centralized Logging Utility for TISCO Platform
 * 
 * Provides structured logging with environment-based levels and formatting.
 * Replaces scattered console.log/warn/error calls with consistent logging.
 * 
 * Usage:
 * import { logger } from '@/lib/logger'
 * 
 * logger.info('Order created', { orderId, userId })
 * logger.error('Payment failed', { error, context })
 * logger.debug('Auth state', { user, session })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment: boolean
  private isProduction: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isProduction = process.env.NODE_ENV === 'production'
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    
    if (context && Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(context)}`
    }
    
    return `${prefix} ${message}`
  }

  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  /**
   * Info level - all environments
   */
  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  /**
   * Warning level - all environments
   */
  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context))
  }

  /**
   * Error level - all environments, always logged
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error ? {
        error: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : { error: String(error) })
    }
    
    console.error(this.formatMessage('error', message, errorContext))
  }

  /**
   * API request logging helper
   */
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context)
  }

  /**
   * API response logging helper
   */
  apiResponse(method: string, path: string, status: number, duration?: number): void {
    const level = status >= 400 ? 'warn' : 'info'
    const message = `API ${method} ${path} → ${status}`
    
    if (level === 'warn') {
      this.warn(message, { status, duration })
    } else {
      this.info(message, { status, duration })
    }
  }

  /**
   * Database query logging helper
   */
  dbQuery(operation: string, table: string, context?: LogContext): void {
    this.debug(`DB ${operation} ${table}`, context)
  }

  /**
   * Authentication event logging
   */
  authEvent(event: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, context)
  }

  /**
   * Payment event logging
   */
  paymentEvent(event: string, context?: LogContext): void {
    this.info(`Payment: ${event}`, context)
  }

  /**
   * Notification event logging
   */
  notificationEvent(event: string, context?: LogContext): void {
    this.info(`Notification: ${event}`, context)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export type for consumers
export type { LogLevel, LogContext }
