import type { RequestInit } from 'next/dist/server/web/spec-extension/request'
import { logger } from '../logger'

export type SendPulseConfig = {
  clientId: string
  clientSecret: string
  senderEmail: string
  senderName?: string
  smtpServer?: string
  smtpPort?: number
  smtpLogin?: string
  smtpPassword?: string
}

export type SendPulseEmail = {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  attachments?: Array<{
    name: string
    content: string
    type: string
  }>
}

// Token cache to avoid too many concurrent requests
let tokenCache: { token: string; expiresAt: number } | null = null
let tokenPromise: Promise<string> | null = null

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000 // 1 second
const MAX_DELAY = 10000 // 10 seconds

// Sleep utility
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

// Check if error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const cause = (error as { cause?: { code?: string } })?.cause
    
    // Network connectivity issues
    if (message.includes('fetch failed') || message.includes('network error')) return true
    if (message.includes('timeout') || message.includes('connect timeout')) return true
    if (message.includes('econnreset') || message.includes('enotfound')) return true
    
    // Check cause for UND_ERR codes (undici errors)
    if (cause?.code === 'UND_ERR_CONNECT_TIMEOUT') return true
    if (cause?.code === 'UND_ERR_SOCKET') return true
    if (cause?.code === 'UND_ERR_REQUEST_TIMEOUT') return true
  }
  return false
}

// Fetch with retry logic and exponential backoff
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      logger.debug('SendPulse fetch attempt', { attempt: attempt + 1, totalAttempts: retries + 1, url })
      const response = await fetch(url, options)
      logger.debug('SendPulse request successful', { attempt: attempt + 1 })
      return response
    } catch (error) {
      lastError = error
      logger.warn('SendPulse fetch attempt failed', { attempt: attempt + 1, error })
      
      // Don't retry if it's not a retryable error or we're on the last attempt
      if (!isRetryableError(error) || attempt === retries) {
        break
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(INITIAL_DELAY * Math.pow(2, attempt), MAX_DELAY)
      const jitter = Math.random() * 0.1 * baseDelay // Add up to 10% jitter
      const delay = baseDelay + jitter
      
      logger.debug('SendPulse retry delay', { delayMs: Math.round(delay) })
      await sleep(delay)
    }
  }
  
  throw lastError
}

async function getAccessToken(cfg: SendPulseConfig): Promise<string> {
  // Check cache first
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    logger.debug('SendPulse using cached token')
    return tokenCache.token
  }

  // If there's already a token request in progress, wait for it
  if (tokenPromise) {
    logger.debug('SendPulse waiting for existing token request')
    return tokenPromise
  }

  // Start new token request
  tokenPromise = requestNewToken(cfg)
  
  try {
    const token = await tokenPromise
    return token
  } finally {
    tokenPromise = null
  }
}

async function requestNewToken(cfg: SendPulseConfig): Promise<string> {
  logger.debug('SendPulse requesting new access token')
  const url = 'https://api.sendpulse.com/oauth/access_token'
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  })

  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(30000), // 30 second timeout
  } satisfies RequestInit)

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    logger.error('SendPulse token request failed', null, { status: res.status, statusText: res.statusText, response: txt })
    throw new Error(`SendPulse token error: ${res.status} ${res.statusText} ${txt}`)
  }

  const json = await res.json().catch(() => ({} as Record<string, unknown>))
  logger.debug('SendPulse token response received', { keys: Object.keys(json) })
  
  const token = (json as Record<string, unknown>)?.access_token as string | undefined
  const expiresIn = Number((json as Record<string, unknown>)?.expires_in) || 3600
  
  if (!token) {
    logger.error('SendPulse token missing in response', null, { json })
    throw new Error('SendPulse token missing in response')
  }

  // Cache token for 90% of its lifetime to avoid expiry issues
  const expiresAt = Date.now() + (expiresIn * 900) // 90% of expires_in in ms
  tokenCache = { token, expiresAt }
  
  logger.debug('SendPulse token cached', { expiresInSeconds: expiresIn })
  return token
}

export async function sendEmailViaSendPulse(cfg: SendPulseConfig, email: SendPulseEmail): Promise<void> {
  logger.debug('SendPulse starting email send process')
  
  try {
    const token = await getAccessToken(cfg)
    logger.debug('SendPulse access token obtained successfully')
    
    const url = 'https://api.sendpulse.com/smtp/emails'

    // Handle multiple recipients
    const recipients = Array.isArray(email.to) ? email.to : [email.to]
    const toArray = recipients.map(recipient => ({ email: recipient }))
    
    logger.debug('SendPulse sending to recipients', { count: recipients.length })

    // Validate email content
    if (!email.html || email.html.trim().length === 0) {
      throw new Error('Email HTML content is empty or invalid')
    }

    // Clean and validate HTML content
    const cleanHtml = email.html.trim()
    const htmlB64 = Buffer.from(cleanHtml, 'utf-8').toString('base64')
    
    // Generate clean text content
    const textContent = email.text || cleanHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    
    // Validate recipient emails
    const validRecipients = toArray.filter(recipient => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return recipient.email && emailRegex.test(recipient.email)
    })
    
    if (validRecipients.length === 0) {
      throw new Error('No valid recipient emails found')
    }

    const payload = {
      email: {
        subject: email.subject,
        from: {
          name: cfg.senderName || 'TISCO Market',
          email: cfg.senderEmail,
        },
        to: validRecipients,
        html: htmlB64,
        text: textContent.substring(0, 1000), // Limit text length
        ...(email.replyTo && { reply_to: { email: email.replyTo } }),
        ...(email.attachments && { attachments: email.attachments }),
      },
    }

    logger.debug('SendPulse payload validation', {
      subject: payload.email.subject,
      recipientCount: validRecipients.length,
      htmlLength: cleanHtml.length,
      textLength: textContent.length
    })

    logger.debug('SendPulse sending request to API')
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: AbortSignal.timeout(30000), // 30 second timeout
    } satisfies RequestInit)

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      logger.error('SendPulse API error', null, { status: res.status, statusText: res.statusText, response: txt })
      throw new Error(`SendPulse send error: ${res.status} ${res.statusText} ${txt}`)
    }

    logger.info('SendPulse email sent successfully', { recipients: recipients.length })
  } catch (error: unknown) {
    logger.error('SendPulse error sending email', error)
    throw error
  }
}

// Get SendPulse configuration from environment variables
export function getSendPulseConfig(): SendPulseConfig {
  const config = {
    clientId: process.env.SENDPULSE_CLIENT_ID || '',
    clientSecret: process.env.SENDPULSE_CLIENT_SECRET || '',
    senderEmail: process.env.SENDPULSE_SENDER_EMAIL || 'info@tiscomarket.store',
    senderName: process.env.SENDPULSE_SENDER_NAME || 'TISCO Market',
    smtpServer: process.env.SENDPULSE_SMTP_SERVER || 'smtp-pulse.com',
    smtpPort: parseInt(process.env.SENDPULSE_SMTP_PORT || '2525'),
    smtpLogin: process.env.SENDPULSE_SMTP_LOGIN || '',
    smtpPassword: process.env.SENDPULSE_SMTP_PASSWORD || '',
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('SendPulse configuration missing: CLIENT_ID and CLIENT_SECRET are required')
  }

  return config
}
