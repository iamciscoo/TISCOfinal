import type { RequestInit } from 'next/dist/server/web/spec-extension/request'

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

async function getAccessToken(cfg: SendPulseConfig): Promise<string> {
  const url = 'https://api.sendpulse.com/oauth/access_token'
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  } satisfies RequestInit)

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`SendPulse token error: ${res.status} ${res.statusText} ${txt}`)
  }

  const json = await res.json().catch(() => ({} as Record<string, unknown>))
  const token = (json as Record<string, unknown>)?.access_token as string | undefined
  if (!token) throw new Error('SendPulse token missing in response')
  return token
}

export async function sendEmailViaSendPulse(cfg: SendPulseConfig, email: SendPulseEmail): Promise<void> {
  console.log('SendPulse: Starting email send process')
  
  try {
    const token = await getAccessToken(cfg)
    console.log('SendPulse: Access token obtained successfully')
    
    const url = 'https://api.sendpulse.com/smtp/emails'

    // Handle multiple recipients
    const recipients = Array.isArray(email.to) ? email.to : [email.to]
    const toArray = recipients.map(recipient => ({ email: recipient }))
    
    console.log('SendPulse: Sending to recipients:', recipients.length)

    const htmlB64 = Buffer.from(email.html, 'utf-8').toString('base64')

    const payload = {
      email: {
        subject: email.subject,
        from: {
          name: cfg.senderName || 'TISCO Market',
          email: cfg.senderEmail,
        },
        to: toArray,
        html: htmlB64,
        text: email.text || email.html.replace(/<[^>]*>/g, '').substring(0, 500) + '...',
        ...(email.replyTo && { reply_to: { email: email.replyTo } }),
        ...(email.attachments && { attachments: email.attachments }),
      },
    }

    console.log('SendPulse: Sending request to API')
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    } satisfies RequestInit)

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error('SendPulse API error:', { status: res.status, statusText: res.statusText, response: txt })
      throw new Error(`SendPulse send error: ${res.status} ${res.statusText} ${txt}`)
    }

    console.log('SendPulse: Email sent successfully')
  } catch (error: unknown) {
    console.error('SendPulse: Error sending email:', error)
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
