/**
 * TISCO Security Sanitization Library
 * 
 * Provides comprehensive input sanitization and validation
 * to prevent XSS, injection attacks, and data corruption.
 */

// HTML sanitization patterns
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '\\': '&#x5C;',
  '`': '&#96;'
}

const SQL_INJECTION_PATTERNS = [
  /('|(\\')|(;)|(\\x00)|(\\n)|(\\r)|(\\x1a))/gi,
  /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi,
  /(script|javascript|vbscript|onload|onerror|onclick)/gi,
  /(<|>|&lt|&gt)/gi
]

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
  /@import/gi
]

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[&<>"'`\\\/]/g, (match) => HTML_ESCAPE_MAP[match] || match)
}

/**
 * Sanitize input for database operations
 */
export function sanitizeForDatabase(input: string): string {
  if (typeof input !== 'string') return ''
  
  let sanitized = input.trim()
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Check for SQL injection patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error('Invalid input: potentially malicious content detected')
    }
  }
  
  return sanitized
}

/**
 * Sanitize user input for general use
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') return ''
  
  const trimmed = input.trim()
  
  // Truncate to max length
  let sanitized = trimmed.substring(0, maxLength)
  
  // Remove dangerous XSS patterns
  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }
  
  // Escape remaining HTML
  sanitized = escapeHtml(sanitized)
  
  return sanitized
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }
  
  return sanitized
}

/**
 * Sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  // Remove all non-digit characters except +
  const sanitized = phone.replace(/[^\d+]/g, '')
  
  // Validate length (7-15 digits per E.164)
  const digitsOnly = sanitized.replace(/\+/g, '')
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new Error('Invalid phone number length')
  }
  
  return sanitized
}

/**
 * Sanitize JSON payloads
 */
export function sanitizeJsonPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(payload)) {
    const sanitizedKey = sanitizeInput(key, 100)
    
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeInput(value)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      )
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeJsonPayload(value as Record<string, unknown>)
    } else {
      sanitized[sanitizedKey] = value
    }
  }
  
  return sanitized
}

/**
 * Validate request size to prevent DoS
 */
export function validateRequestSize(content: string | object, maxSizeKB = 100): void {
  const size = typeof content === 'string' 
    ? new Blob([content]).size 
    : new Blob([JSON.stringify(content)]).size
  
  const maxSize = maxSizeKB * 1024 // Convert to bytes
  
  if (size > maxSize) {
    throw new Error(`Request too large: ${size} bytes (max: ${maxSize} bytes)`)
  }
}

/**
 * Sanitize file paths to prevent directory traversal
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') return ''
  
  // Remove dangerous path components
  let sanitized = path.replace(/\.\./g, '')
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '')
  sanitized = sanitized.replace(/^\/+/, '') // Remove leading slashes
  
  return sanitized
}

/**
 * Rate limiting helper - simple in-memory store
 */
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests = 10, 
  windowMs = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const key = identifier
  
  // Clean up old entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (now - v.timestamp > windowMs) {
      rateLimitStore.delete(k)
    }
  }
  
  const existing = rateLimitStore.get(key)
  
  if (!existing) {
    rateLimitStore.set(key, { count: 1, timestamp: now })
    return true
  }
  
  if (now - existing.timestamp > windowMs) {
    rateLimitStore.set(key, { count: 1, timestamp: now })
    return true
  }
  
  if (existing.count >= maxRequests) {
    return false // Rate limit exceeded
  }
  
  existing.count++
  return true
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  // Simple implementation - in production, use more sophisticated approach
  return Boolean(token && sessionToken && token === sessionToken)
}
