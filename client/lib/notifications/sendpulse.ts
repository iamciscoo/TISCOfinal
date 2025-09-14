import type { RequestInit } from 'next/dist/server/web/spec-extension/request'

export type SendPulseConfig = {
  clientId: string
  clientSecret: string
  senderEmail: string
  senderName?: string
}

export type SendPulseEmail = {
  to: string
  subject: string
  html: string
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

  const json = await res.json().catch(() => ({} as any))
  const token = (json as any)?.access_token as string | undefined
  if (!token) throw new Error('SendPulse token missing in response')
  return token
}

export async function sendEmailViaSendPulse(cfg: SendPulseConfig, email: SendPulseEmail): Promise<void> {
  const token = await getAccessToken(cfg)
  const url = 'https://api.sendpulse.com/smtp/emails'

  const payload = {
    email: {
      subject: email.subject,
      from: {
        name: cfg.senderName || 'TISCO',
        email: cfg.senderEmail,
      },
      to: [
        {
          email: email.to,
        },
      ],
      html: email.html,
    },
  }

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
    throw new Error(`SendPulse send error: ${res.status} ${res.statusText} ${txt}`)
  }
}
