/**
 * Webhook Security Utilities
 * 
 * Provides signature verification and security for webhook endpoints
 */

import crypto from 'crypto'
import { NextRequest } from 'next/server'

/**
 * Verify ZenoPay webhook signature
 */
export function verifyZenoPayWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!payload || !signature || !secret) {
    return false
  }
  
  try {
    // ZenoPay uses HMAC-SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex')
    
    // Compare signatures securely (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Verify webhook timestamp to prevent replay attacks
 */
export function verifyWebhookTimestamp(
  timestamp: string | number,
  tolerance: number = 300 // 5 minutes in seconds
): boolean {
  const webhookTime = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const currentTime = Math.floor(Date.now() / 1000)
  
  return Math.abs(currentTime - webhookTime) <= tolerance
}

/**
 * Extract and validate webhook headers
 */
export function extractWebhookHeaders(req: NextRequest): {
  signature?: string
  timestamp?: string
  valid: boolean
} {
  const signature = req.headers.get('x-zenopay-signature') || 
                   req.headers.get('x-signature') ||
                   req.headers.get('signature')
  
  const timestamp = req.headers.get('x-zenopay-timestamp') ||
                   req.headers.get('x-timestamp') ||
                   req.headers.get('timestamp')
  
  return {
    signature: signature || undefined,
    timestamp: timestamp || undefined,
    valid: Boolean(signature && timestamp)
  }
}

/**
 * Validate webhook source IP
 */
export function validateWebhookSource(req: NextRequest, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) return true // No IP restrictions
  
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   req.headers.get('cf-connecting-ip') || // Cloudflare
                   'unknown'
  
  return allowedIPs.includes(clientIP)
}

/**
 * Rate limiting for webhook endpoints
 */
const webhookRateLimit = new Map<string, { count: number; window: number }>()

export function checkWebhookRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const key = `webhook_${identifier}`
  
  // Clean up old entries
  for (const [k, v] of webhookRateLimit.entries()) {
    if (now - v.window > windowMs) {
      webhookRateLimit.delete(k)
    }
  }
  
  const current = webhookRateLimit.get(key)
  
  if (!current) {
    webhookRateLimit.set(key, { count: 1, window: now })
    return true
  }
  
  if (now - current.window > windowMs) {
    webhookRateLimit.set(key, { count: 1, window: now })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(payload: Record<string, unknown>): boolean {
  // Basic payload structure validation
  if (!payload || typeof payload !== 'object') {
    return false
  }
  
  // Check for required fields (customize based on your webhook structure)
  const requiredFields = ['order_id', 'payment_status']
  
  for (const field of requiredFields) {
    if (!payload[field]) {
      return false
    }
  }
  
  // Validate field types and formats
  if (typeof payload.order_id !== 'string' || payload.order_id.length === 0) {
    return false
  }
  
  if (typeof payload.payment_status !== 'string') {
    return false
  }
  
  return true
}

/**
 * Comprehensive webhook security check
 */
export function validateWebhookSecurity(
  req: NextRequest,
  payload: string,
  options: {
    secret?: string
    allowedIPs?: string[]
    maxRequests?: number
    windowMs?: number
    requireSignature?: boolean
  } = {}
): { valid: boolean; error?: string } {
  const {
    secret,
    allowedIPs = [],
    maxRequests = 100,
    windowMs = 60000,
    requireSignature = true
  } = options
  
  // Rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkWebhookRateLimit(clientIP, maxRequests, windowMs)) {
    return { valid: false, error: 'Rate limit exceeded' }
  }
  
  // IP validation
  if (allowedIPs.length > 0 && !validateWebhookSource(req, allowedIPs)) {
    return { valid: false, error: 'Invalid source IP' }
  }
  
  // Signature verification
  if (requireSignature && secret) {
    const headers = extractWebhookHeaders(req)
    
    if (!headers.valid) {
      return { valid: false, error: 'Missing signature or timestamp' }
    }
    
    if (!verifyWebhookTimestamp(headers.timestamp!)) {
      return { valid: false, error: 'Invalid or expired timestamp' }
    }
    
    if (!verifyZenoPayWebhook(payload, headers.signature!, secret)) {
      return { valid: false, error: 'Invalid signature' }
    }
  }
  
  return { valid: true }
}
