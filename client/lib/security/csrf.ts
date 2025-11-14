/**
 * CSRF Protection Utility
 * 
 * Provides Cross-Site Request Forgery protection for TISCO APIs
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

// CSRF token expiry (1 hour)
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now()
  const randomBytes = crypto.randomBytes(32).toString('hex')
  const token = `${timestamp}.${randomBytes}`
  
  // Create HMAC signature
  const secret = process.env.CSRF_SECRET || 'default-secret-change-in-production'
  const signature = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex')
  
  return `${token}.${signature}`
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  if (!token) return false
  
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  const [timestamp, randomBytes, signature] = parts
  const tokenData = `${timestamp}.${randomBytes}`
  
  // Check if token is expired
  const tokenTime = parseInt(timestamp)
  if (isNaN(tokenTime) || Date.now() - tokenTime > CSRF_TOKEN_EXPIRY) {
    return false
  }
  
  // Verify signature
  const secret = process.env.CSRF_SECRET || 'default-secret-change-in-production'
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(tokenData)
    .digest('hex')
  
  return signature === expectedSignature
}

/**
 * Extract CSRF token from request
 */
export function extractCSRFToken(req: NextRequest): string | null {
  // Check header first (AJAX requests)
  const headerToken = req.headers.get('X-CSRF-Token') || req.headers.get('x-csrf-token')
  if (headerToken) return headerToken
  
  // Check body for form requests
  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    // For form data, we'd need to parse the body, but this is more complex in middleware
    // For now, prioritize header-based CSRF tokens
  }
  
  return null
}

/**
 * Check if request needs CSRF protection
 */
export function needsCSRFProtection(req: NextRequest): boolean {
  const method = req.method.toUpperCase()
  const pathname = req.nextUrl.pathname
  
  // Only protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false
  }
  
  // Skip webhook endpoints (they use other authentication)
  if (pathname.includes('/webhook')) {
    return false
  }
  
  // Skip auth endpoints (they have their own protection)
  if (pathname.startsWith('/api/auth/')) {
    return false
  }
  
  return true
}

/**
 * Safe origins for CSRF (same-origin policy)
 */
export function isSafeOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')
  
  if (!host) return false
  
  // Check origin header
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }
  
  // Fallback to referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }
  
  // If no origin/referer headers, it might be a same-origin request
  // or a request from a tool like curl - be conservative and deny
  return false
}
