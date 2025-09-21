import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'

export const runtime = 'nodejs'

function signBody(body: string, secret: string) {
  const t = Math.floor(Date.now() / 1000).toString()
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(body, 'utf8')
  const v1 = hmac.digest('hex')
  return { header: `t=${t}, v1=${v1}`, t, v1 }
}

export async function POST(req: NextRequest) {
  try {
    const adminKeyHeader = req.headers.get('x-admin-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    const adminKey = process.env.ADMIN_DEBUG_KEY

    if (!adminKey || adminKeyHeader !== adminKey) {
      return NextResponse.json({
        error: 'Unauthorized. Set ADMIN_DEBUG_KEY in env and send x-admin-key header.'
      }, { status: 401 })
    }

    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    const ref = String(
      body.transaction_reference || body.ref || body.reference || ''
    )
    const status = String(body.status || 'COMPLETED').toUpperCase()
    const gatewayId = String(body.gateway_transaction_id || `admin_${Date.now()}`)

    if (!ref) {
      return NextResponse.json({ error: 'Missing transaction reference (transaction_reference or ref)' }, { status: 400 })
    }

    // Build a webhook-like payload that your handler expects
    const payload = {
      order_id: ref, // your webhook handler treats order_id as a reference candidate
      reference: `admin_${Date.now()}`,
      transaction_reference: ref,
      transaction_id: gatewayId,
      gateway_transaction_id: gatewayId,
      payment_status: status,
      data: {
        order_id: ref,
        payment_status: status,
        gateway_transaction_id: gatewayId,
      }
    }

    const raw = JSON.stringify(payload)

    // Compute HMAC signature if secret is available
    const secret = process.env.WEBHOOK_SECRET
    const signed = secret ? signBody(raw, secret) : null

    const origin = new URL(req.url).origin
    const webhookUrl = `${origin}/api/payments/webhooks`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (process.env.ZENOPAY_API_KEY) {
      headers['x-api-key'] = process.env.ZENOPAY_API_KEY
      headers['authorization'] = `Bearer ${process.env.ZENOPAY_API_KEY}`
    }
    if (signed) {
      headers['x-signature'] = signed.header
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: raw,
      cache: 'no-store',
    })

    const text = await response.text()

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      webhook_response: text,
      debug: {
        sent_to: webhookUrl,
        used_hmac: Boolean(signed),
        used_api_key: Boolean(process.env.ZENOPAY_API_KEY),
        ref,
        status,
      }
    }, { status: response.ok ? 200 : 500 })
  } catch (error) {
    console.error('Admin trigger error:', error)
    return NextResponse.json({ error: 'Admin trigger failed' }, { status: 500 })
  }
}
