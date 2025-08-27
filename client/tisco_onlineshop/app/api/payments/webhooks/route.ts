import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { revalidateTag } from 'next/cache'

export const runtime = 'nodejs'

interface WebhookPayload {
  order_id?: string
  reference?: string
  transaction_reference?: string
  transaction_id?: string
  gateway_transaction_id?: string
  status?: string
  payment_status?: string
  event_type?: string
  event?: string
  type?: string
  failure_reason?: string
  data?: WebhookPayload | Record<string, unknown>
  [key: string]: unknown
}

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Webhook disabled: missing SUPABASE_SERVICE_ROLE' }, { status: 503 })
    }
    // Read raw body for signature verification
    const rawBody = await req.text()
    const signature = req.headers.get('x-signature') || req.headers.get('x-webhook-signature')
    const xApiKey = req.headers.get('x-api-key')

    // Primary: verify HMAC signature with WEBHOOK_SECRET.
    // Fallback: accept requests carrying ZenoPay API key via x-api-key header (per ZenoPay docs).
    const hmacOk = verifyWebhookSignature(rawBody, signature)
    const apiKey = process.env.ZENOPAY_API_KEY
    const apiKeyOk = Boolean(xApiKey && apiKey && xApiKey === apiKey)

    if (!hmacOk && !apiKeyOk) {
      return NextResponse.json({ error: 'Invalid webhook authentication' }, { status: 401 })
    }
    const body = JSON.parse(rawBody) as WebhookPayload

    // ZenoPay payloads typically include order_id (we sent our transaction_reference),
    // and may include transaction_id and status/payment_status. Some variants nest under `data`.
    const data = (body?.data || {}) as WebhookPayload
    const refCandidates = [body?.order_id, data?.order_id, body?.reference, body?.transaction_reference].filter(Boolean)
    const gwCandidates = [body?.transaction_id, data?.transaction_id, body?.gateway_transaction_id].filter(Boolean)

    const ref = String(refCandidates[0] || '')
    const gw = String(gwCandidates[0] || '')

    // Find the transaction using our reference (preferred) or the gateway id
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        orders(id, user_id, status)
      `)
      .limit(1)

    if (ref && gw) {
      query = query.or(`transaction_reference.eq.${ref},gateway_transaction_id.eq.${gw}`)
    } else if (ref) {
      query = query.eq('transaction_reference', ref)
    } else if (gw) {
      query = query.eq('gateway_transaction_id', gw)
    }

    const { data: transaction, error: findError } = await query.single()

    if (findError || !transaction) {
      console.error('Transaction not found:', ref, gw)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Process webhook by normalized status/event
    const rawStatusCandidates = [
      body?.status,
      data?.status,
      body?.payment_status,
      data?.payment_status,
      body?.event_type,
      body?.event,
      body?.type,
    ].filter(Boolean)

    const statusRaw = String(rawStatusCandidates[0] || '').toUpperCase()
    const successSet = new Set(['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'APPROVED', 'PAID', 'SETTLED', 'SUCCESSFUL'])
    const pendingSet = new Set(['PENDING', 'PROCESSING', 'AWAITING', 'QUEUED'])
    const cancelSet = new Set(['CANCELLED', 'CANCELED'])
    const failSet = new Set(['FAILED', 'DECLINED', 'ERROR', 'REJECTED', 'TIMEOUT'])

    // Normalize body to ensure we persist the gateway transaction id when available
    const normalizedBody = { ...body, gateway_transaction_id: gw || body?.gateway_transaction_id || data?.transaction_id }

    if (successSet.has(statusRaw)) {
      await handlePaymentSuccess(transaction, normalizedBody)
    } else if (pendingSet.has(statusRaw)) {
      await handlePaymentPending(transaction)
    } else if (cancelSet.has(statusRaw)) {
      await handlePaymentCancellation(transaction)
    } else if (failSet.has(statusRaw)) {
      await handlePaymentFailure(transaction, body?.failure_reason || 'Payment failed')
    } else {
      console.log('Unhandled webhook status/event:', statusRaw || '(empty)')
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: unknown) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

type WebhookData = { gateway_transaction_id?: string; [key: string]: unknown }
type TransactionRow = { id: string; order_id: string; user_id: string; status: string; transaction_reference: string; gateway_transaction_id?: string }

function invalidateOrderCaches(t: TransactionRow) {
  try {
    // Global orders lists and per-entity tags used across client/admin
    revalidateTag('orders')
    revalidateTag('admin:orders')
    revalidateTag(`order:${t.order_id}`)
    revalidateTag(`user-orders:${t.user_id}`)
    // Payments
    revalidateTag('payments')
    revalidateTag(`payment:${t.id}`)
  } catch (e) {
    console.warn('Revalidation error (non-fatal):', e)
  }
}

async function handlePaymentSuccess(transaction: TransactionRow, webhookData: WebhookData) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    const { error: txUpdateError } = await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        gateway_transaction_id: webhookData.gateway_transaction_id || transaction.gateway_transaction_id,
        completed_at: new Date().toISOString(),
        webhook_data: webhookData,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    if (txUpdateError) {
      console.error('payment_transactions update error:', {
        transaction_id: transaction.id,
        reference: transaction.transaction_reference,
        error: txUpdateError
      })
    }

    // Update order status and payment status (fallback if paid_at column is missing)
    const orderUpdateBase = {
      status: 'processing' as const,
      payment_status: 'paid' as const,
      updated_at: new Date().toISOString(),
    }

    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        ...orderUpdateBase,
        paid_at: new Date().toISOString(),
      })
      .eq('id', transaction.order_id)

    if (orderUpdateError) {
      let code: string | undefined
      let message = ''
      if (orderUpdateError && typeof orderUpdateError === 'object') {
        const errObj = orderUpdateError as { code?: string; message?: string }
        code = errObj.code
        message = errObj.message ?? ''
      }
      const missingPaidAt = code === '42703' || /paid_at.*does not exist/i.test(message)
      console.warn('orders update error (first attempt with paid_at):', {
        order_id: transaction.order_id,
        reference: transaction.transaction_reference,
        code,
        message,
      })

      if (missingPaidAt) {
        // Retry without paid_at column
        const { error: orderUpdateRetryError } = await supabase
          .from('orders')
          .update({ ...orderUpdateBase })
          .eq('id', transaction.order_id)

        if (orderUpdateRetryError) {
          console.error('orders update retry error (without paid_at):', {
            order_id: transaction.order_id,
            reference: transaction.transaction_reference,
            error: orderUpdateRetryError,
          })
        }
      }
    }

    // Log payment completion
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_completed',
        data: webhookData,
        user_id: transaction.user_id
      })

    if (logError) {
      console.warn('payment_logs insert error:', {
        transaction_id: transaction.id,
        reference: transaction.transaction_reference,
        error: logError,
      })
    }

    // TODO: Send confirmation email/SMS
    // TODO: Trigger order fulfillment process
    
    console.log('Payment completed successfully:', transaction.transaction_reference)
    invalidateOrderCaches(transaction)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(transaction: TransactionRow, reason: string) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: reason,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Update order payment status
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    // Log payment failure
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_failed',
        data: { reason },
        user_id: transaction.user_id
      })

    // TODO: Send failure notification
    // TODO: Restore product stock if needed
    
    console.log('Payment failed:', transaction.transaction_reference, reason)
    invalidateOrderCaches(transaction)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentPending(transaction: TransactionRow) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status if not already pending
    if (transaction.status !== 'pending') {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)
    }

    // Log pending status
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_pending',
        data: { message: 'Payment is pending confirmation' },
        user_id: transaction.user_id
      })

    console.log('Payment pending:', transaction.transaction_reference)
    invalidateOrderCaches(transaction)
  } catch (error) {
    console.error('Error handling payment pending:', error)
  }
}

async function handlePaymentCancellation(transaction: TransactionRow) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Update order status if no other successful payments
    const { data: otherPayments } = await supabase
      .from('payment_transactions')
      .select('status')
      .eq('order_id', transaction.order_id)
      .in('status', ['completed', 'processing'])

    if (!otherPayments || otherPayments.length === 0) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.order_id)
    }

    // Log cancellation
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_cancelled',
        data: { message: 'Payment was cancelled' },
        user_id: transaction.user_id
      })

    console.log('Payment cancelled:', transaction.transaction_reference)
    invalidateOrderCaches(transaction)
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false

  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    console.warn('WEBHOOK_SECRET not configured')
    // In production, fail closed; in dev/test allow for easier local testing
    if (process.env.NODE_ENV === 'production') return false
    return true
  }

  // Some providers send compound headers like: "t=timestamp,v1=hexdigest"
  // We'll try to extract a v1/sha256 component if present. Otherwise treat header as the digest itself.
  const parsed = parseSignatureHeader(signature)
  const provided = parsed?.v1 || parsed?.sha256 || signature

  // If a timestamp is present, enforce a freshness window to mitigate replay attacks.
  // We allow a 5 minute window (300 seconds). If missing, we only enforce when present to avoid breaking providers
  // that don't include a timestamp field.
  try {
    const nowSec = Math.floor(Date.now() / 1000)
    const tStr = parsed?.t
    if (tStr) {
      const ts = /^\d+$/.test(tStr) ? parseInt(tStr, 10) : Math.floor(new Date(tStr).getTime() / 1000)
      const skew = Math.abs(nowSec - ts)
      // 5 minute window
      if (!Number.isFinite(ts) || skew > 300) {
        console.warn('Webhook timestamp outside allowed window')
        if (process.env.NODE_ENV === 'production') return false
      }
    } else {
      // If no timestamp provided, warn (we won't fail hard to preserve compatibility)
      console.warn('Webhook signature missing timestamp; skipping freshness check')
    }
  } catch (e) {
    console.warn('Webhook timestamp parse error; skipping freshness check', e)
  }

  try {
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(rawBody, 'utf8')
    const expectedHex = hmac.digest('hex')

    // Compare against hex or base64 variants using constant-time comparison
    const providedBufHex = safeToBuffer(provided, 'hex')
    const expectedBufHex = Buffer.from(expectedHex, 'hex')
    if (providedBufHex && timingSafeEqualLenient(providedBufHex, expectedBufHex)) return true

    // Try base64 compare if header uses base64
    const hmacB64 = Buffer.from(expectedHex, 'hex').toString('base64')
    const providedBufB64 = safeToBuffer(provided, 'base64')
    const expectedBufB64 = Buffer.from(hmacB64, 'utf8')
    if (providedBufB64 && timingSafeEqualLenient(providedBufB64, expectedBufB64)) return true

    return false
  } catch (e) {
    console.error('Signature verification error:', e)
    return false
  }
}

function parseSignatureHeader(header: string | null): { t?: string; v1?: string; sha256?: string } | null {
  if (!header) return null
  const parts = header.split(',').map(s => s.trim())
  const obj: Record<string, string> = {}
  for (const p of parts) {
    const [k, v] = p.split('=')
    if (k && v) obj[k] = v
  }
  return { t: obj['t'], v1: obj['v1'], sha256: obj['sha256'] }
}

function safeToBuffer(value: string, encoding: BufferEncoding): Buffer | null {
  try {
    return Buffer.from(value, encoding)
  } catch {
    return null
  }
}

function timingSafeEqualLenient(a: Buffer, b: Buffer): boolean {
  // Buffers must be same length for timingSafeEqual
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
