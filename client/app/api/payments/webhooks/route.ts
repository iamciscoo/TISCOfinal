// TypeScript types for webhook handling
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { notifyPaymentSuccess, notifyPaymentFailed } from '@/lib/notifications/service'
import { logger } from '../../../../../shared/lib/logger'

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  logger.debug('Supabase config check', {
    hasUrl: !!url,
    hasServiceKey: !!serviceKey,
    urlPreview: url ? `${url.slice(0, 30)}...` : 'missing'
  })
  
  if (!url || !serviceKey) {
    logger.error('Missing Supabase configuration', undefined, {
      url: !!url,
      serviceKey: !!serviceKey
    })
    return null
  }
  return createClient(url!, serviceKey!)
}

export async function POST(req: NextRequest) {
  logger.webhook('webhook_received', 'zenopay', false)
  
  try {
    const supabase = getAdminSupabase()
    if (!supabase) {
      logger.error('Supabase not configured for webhook', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL || !!process.env.SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE || !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
    // Read raw body for signature verification
    const rawBody = await req.text()

    // Accept multiple common signature header variants from providers
    const sigHeaderNames = ['x-signature', 'x-zenopay-signature', 'x-webhook-signature', 'x-hub-signature-256', 'stripe-signature']
    let sig: string | null = null
    let sigHeaderUsed: string | null = null
    for (const name of sigHeaderNames) {
      const v = req.headers.get(name)
      if (v) {
        sig = v
        sigHeaderUsed = name
        break
      }
    }

    console.log('Webhook headers:', {
      signatureHeader: sigHeaderUsed || 'none',
      contentType: req.headers.get('content-type'),
      userAgent: req.headers.get('user-agent')
    })
    console.log('Webhook raw body:', rawBody)
    
    // Verify authentication:
    // - Primary: HMAC signature with WEBHOOK_SECRET
    // - Fallback: API key provided via x-api-key or Authorization: Bearer <key>
    const hmacOk = verifyWebhookSignature(rawBody, sig)
    const apiKey = process.env.ZENOPAY_API_KEY
    const tokenCandidates: string[] = []
    const xApiKey = req.headers.get('x-api-key') || req.headers.get('x-access-token') || req.headers.get('api-key')
    if (xApiKey) tokenCandidates.push(xApiKey.trim())
    const authHeader = req.headers.get('authorization') || ''
    if (authHeader) {
      const cleaned = authHeader
        .replace(/^Bearer\s+/i, '')
        .replace(/^Token\s+/i, '')
        .replace(/^ApiKey\s+/i, '')
        .trim()
      if (cleaned) tokenCandidates.push(cleaned)
    }
    const apiKeyOk = !!apiKey && tokenCandidates.some(t => t === apiKey)

    console.log('Authentication check:', { hmacOk, apiKeyOk, nodeEnv: process.env.NODE_ENV })

  // ZenoPay webhook authentication per documentation
  // "Verify the request by checking the x-api-key header to ensure it comes from ZenoPay"
  const authPassed = hmacOk || apiKeyOk
  
  console.log('🔐 ZenoPay Webhook Authentication:', {
    x_api_key_verified: apiKeyOk,
    hmac_verified: hmacOk,
    authentication_passed: authPassed,
    zenopay_api_key_configured: !!apiKey,
    x_api_key_header_present: !!req.headers.get('x-api-key'),
    node_env: process.env.NODE_ENV
  })

  if (!authPassed) {
    console.error('❌ ZenoPay webhook authentication failed!')
    console.error('🔍 Authentication details:', {
      x_api_key_header: req.headers.get('x-api-key') ? 'present' : 'missing',
      zenopay_api_key_env: !!apiKey ? 'configured' : 'missing',
      matches: apiKeyOk
    })
    
    // For production, be more lenient during the transition period
    if (process.env.NODE_ENV === 'production' && !apiKey) {
      console.warn('⚠️  ALLOWING webhook in production due to missing ZENOPAY_API_KEY configuration')
      console.warn('🚨 SECURITY WARNING: Configure ZENOPAY_API_KEY immediately!')
      console.warn('🔧 Temporary bypass enabled for ZenoPay integration testing')
    } else if (!authPassed) {
      return NextResponse.json({ 
        error: 'Webhook authentication failed', 
        message: 'x-api-key header must match ZENOPAY_API_KEY' 
      }, { status: 401 })
    }
  } else {
    console.log('✅ ZenoPay webhook authentication verified')
  }  
    console.log('✅ Webhook authentication passed')
    
    // Parse ZenoPay webhook payload
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('❌ Failed to parse webhook JSON:', parseError)
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('📥 ZenoPay Webhook Received:', {
      order_id: body?.order_id,
      payment_status: body?.payment_status, 
      reference: body?.reference,
      metadata: body?.metadata,
      full_payload: body
    })

    // Extract data according to ZenoPay documentation format
    // Expected: { "order_id": "our_transaction_ref", "payment_status": "COMPLETED", "reference": "zenopay_ref" }
    const ref = String(body?.order_id || '').trim()  // Our transaction_reference
    const gw = String(body?.reference || '').trim()  // ZenoPay's internal reference
    const paymentStatus = String(body?.payment_status || '').toUpperCase()

    console.log('🔍 Extracted ZenoPay data:', { 
      transaction_reference: ref,
      zenopay_reference: gw, 
      payment_status: paymentStatus
    })

    // Validate required fields per ZenoPay documentation
    if (!ref) {
      console.error('❌ Missing order_id (transaction_reference) in ZenoPay webhook')
      return NextResponse.json({ error: 'Missing order_id field' }, { status: 400 })
    }

    if (!paymentStatus) {
      console.error('❌ Missing payment_status in ZenoPay webhook')
      return NextResponse.json({ error: 'Missing payment_status field' }, { status: 400 })
    }

    // Check both payment_transactions (existing orders) and payment_sessions (new flow)
    let txnData: { id: string; user_id: string; order_id?: string; transaction_reference: string; status: string } | null = null
    let isSession = false

    // First try payment_transactions (existing flow)
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        orders(id, user_id, status)
      `)
      .limit(1)

    if (ref) {
      console.log('Looking up transaction/session for ref:', ref)
      const { data: txnResult } = await query.or(`transaction_reference.eq.${ref},gateway_transaction_id.eq.${ref}`).maybeSingle()
      if (txnResult) {
        console.log('Found payment transaction:', txnResult.id)
        txnData = txnResult
      } else {
        // Try payment_sessions (new flow)
        console.log('No payment transaction found, checking payment sessions')
        const { data: sessionResult } = await supabase
          .from('payment_sessions')
          .select('*')
          .or(`transaction_reference.eq.${ref},gateway_transaction_id.eq.${ref}`)
          .maybeSingle()
        if (sessionResult) {
          console.log('Found payment session:', sessionResult.id)
          txnData = sessionResult
          isSession = true
        } else {
          console.log('No payment session found for ref:', ref)
        }
      }
    } else if (gw) {
      query = query.eq('gateway_transaction_id', gw)
      const { data: txnResult } = await query.maybeSingle()
      if (txnResult) {
        txnData = txnResult
      } else {
        // Try payment_sessions (new flow)
        let sessionQuery = supabase
          .from('payment_sessions')
          .select('*')
          .limit(1)
        sessionQuery = sessionQuery.eq('gateway_transaction_id', gw)
        const { data: sessionResult } = await sessionQuery.maybeSingle()
        if (sessionResult) {
          txnData = sessionResult
          isSession = true
        }
      }
    }

    if (!txnData) {
      console.error('Transaction/Session not found:', ref, gw)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    console.log('Processing webhook for:', { 
      type: isSession ? 'session' : 'transaction',
      id: txnData.id,
      user_id: txnData.user_id,
      current_status: txnData.status 
    })

    // Process webhook by normalized status/event (ZenoPay format)
    const rawStatusCandidates = [
      paymentStatus,  // Already extracted from body?.payment_status
      body?.status,
      body?.result,
      body?.event_type,
      body?.event,
      body?.type,
    ].filter(Boolean)

    const rawStatus = String(rawStatusCandidates[0] || '').toUpperCase()

    console.log('Webhook status processing:', { rawStatus, rawStatusCandidates })

    // Normalize status to standard values
    const successSet = new Set(['SUCCESS', 'SUCCESSFUL', 'SUCCEEDED', 'COMPLETED', 'PAID', 'APPROVED', 'SETTLED', 'CONFIRMED'])
    const failSet = new Set(['FAILED', 'FAILURE', 'DECLINED', 'REJECTED', 'ERROR', 'CANCELLED', 'CANCELED', 'TIMEOUT'])
    const pendingSet = new Set(['PENDING', 'PROCESSING', 'AWAITING', 'INITIATED', 'QUEUED'])

    let normalizedStatus = 'unknown'
    if (successSet.has(rawStatus)) normalizedStatus = 'success'
    else if (failSet.has(rawStatus)) normalizedStatus = 'failed'
    else if (pendingSet.has(rawStatus)) normalizedStatus = 'pending'

    console.log('Normalized status:', normalizedStatus)

    // Handle webhook events
    if (isSession) {
      console.log('Processing session webhook')
      if (normalizedStatus === 'success') {
        console.log('Handling session payment success')
        await handleSessionPaymentSuccess(txnData as unknown as PaymentSession, body)
      } else if (normalizedStatus === 'failed') {
        console.log('Handling session payment failure')
        await handleSessionPaymentFailure(txnData as unknown as PaymentSession, rawStatus)
      } else {
        console.log('Session status not actionable:', normalizedStatus)
      }
    } else {
      console.log('Processing transaction webhook')
      // Legacy transaction handling
      if (normalizedStatus === 'success') {
        console.log('Handling transaction success')
        await handlePaymentSuccess(txnData as TransactionRow, body)
      } else if (normalizedStatus === 'failed') {
        console.log('Handling transaction failure')
        await handlePaymentFailure(txnData as TransactionRow, rawStatus)
      } else {
        console.log('Transaction status not actionable:', normalizedStatus)
      }
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
type OrderWithUser = { 
  total_amount: number; 
  payment_method: string; 
  users: { email: string; first_name: string; last_name: string } 
}

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
    // Idempotency: If already completed, log duplicate and return
    if (String(transaction.status).toLowerCase() === 'completed') {
      try {
        await supabase
          .from('payment_logs')
          .insert({
            transaction_id: transaction.id,
            event_type: 'duplicate_webhook_success',
            data: { message: 'Transaction already completed, skipping', webhookData },
            user_id: transaction.user_id,
          })
      } catch {}
      console.log('Duplicate webhook success for already completed transaction:', transaction.transaction_reference)
      return
    }
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

    // Send payment success notification
    try {
      console.log('Starting notification process for transaction:', transaction.id)
      
      // Get user and order details for notification
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('auth_user_id', transaction.user_id)
        .single()

      console.log('User data fetch:', { found: !!userData, error: userError })

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('total_amount, currency')
        .eq('id', transaction.order_id)
        .single()

      console.log('Order data fetch:', { found: !!orderData, error: orderError })

      if (userData?.email && orderData) {
        const customerName = userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : 'Customer'

        console.log('Sending payment success notification:', {
          order_id: transaction.order_id,
          customer_email: userData.email,
          customer_name: customerName
        })

        // Send payment success notification
        await notifyPaymentSuccess({
          order_id: transaction.order_id,
          customer_email: userData.email,
          customer_name: customerName,
          amount: orderData.total_amount?.toString() || '0',
          currency: orderData.currency || 'TZS',
          payment_method: 'Mobile Money',
          transaction_id: transaction.transaction_reference
        })
        console.log('Payment success notification sent successfully')

        // Note: Customer already received order confirmation when order was created
        // Payment success notification is sufficient here

        // Note: For legacy transactions, admin was already notified when order was created
        // via /api/orders endpoint (e.g., "Pay at Office" orders that get paid later)
        // No need to send duplicate admin notification on payment success for existing orders
      } else {
        console.error('Missing user data or order data for notifications:', {
          hasUserData: !!userData,
          hasUserEmail: !!userData?.email,
          hasOrderData: !!orderData
        })
      }
    } catch (emailError) {
      console.error('Failed to send payment success notification:', {
        error: emailError,
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined
      })
    }
    
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

    // Send payment failure notification
    try {
      // Get user details for notification
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('auth_user_id', transaction.user_id)
        .single()

      const { data: orderData } = await supabase
        .from('orders')
        .select('total_amount, currency')
        .eq('id', transaction.order_id)
        .single()

      if (userData?.email && orderData) {
        const customerName = userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : 'Customer'

        await notifyPaymentFailed({
          order_id: transaction.order_id,
          customer_email: userData.email,
          customer_name: customerName,
          amount: orderData.total_amount?.toString() || '0',
          currency: orderData.currency || 'TZS',
          payment_method: 'Mobile Money',
          failure_reason: reason || 'Payment processing failed'
        })
        console.log('Payment failure notification sent')
      }
    } catch (emailError) {
      console.error('Failed to send payment failure notification:', emailError)
    }

    // Log payment failure
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_failed',
        data: { reason },
        user_id: transaction.user_id
      })

    // Send failure notification to customer
    try {
      // Get order and user details for notification
      const supabase = getAdminSupabase()
      if (supabase) {
        const { data: order } = await supabase
          .from('orders')
          .select('*, users(email, first_name, last_name)')
          .eq('id', transaction.order_id)
          .single()
        
        if (order) {
          const orderData = order as unknown as OrderWithUser
          const user = orderData.users
          await notifyPaymentFailed({
            order_id: transaction.order_id,
            customer_email: user?.email || '',
            customer_name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Customer',
            amount: orderData.total_amount?.toString() || '0',
            currency: 'TZS',
            payment_method: orderData.payment_method || 'Mobile Money',
            failure_reason: reason || 'Payment failed'
          })
          logger.info('Payment failure notification sent', { transaction_id: transaction.id })
        }
      }
    } catch (notifError) {
      logger.error('Failed to send payment failure notification', notifError, { transaction_id: transaction.id })
    }
    
    logger.payment('payment_failed', { 
      transaction_reference: transaction.transaction_reference, 
      reason 
    })
    invalidateOrderCaches(transaction)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Removed unused handlePaymentPending function

// Commented out unused function to fix build warnings
// async function handlePaymentCancellation(transaction: TransactionRow) {
//   try {
//     const supabase = getAdminSupabase()
//     if (!supabase) return
//     // Update transaction status
//     await supabase
//       .from('payment_transactions')
//       .update({
//         status: 'cancelled',
//         cancelled_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', transaction.id)

//     // Update order status if no other successful payments
//     const { data: otherPayments } = await supabase
//       .from('payment_transactions')
//       .select('status')
//       .eq('order_id', transaction.order_id)
//       .in('status', ['completed', 'processing'])

//     if (!otherPayments || otherPayments.length === 0) {
//       await supabase
//         .from('orders')
//         .update({
//           payment_status: 'cancelled',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', transaction.order_id)
//     }

//     // Log cancellation
//     await supabase
//       .from('payment_logs')
//       .insert({
//         transaction_id: transaction.id,
//         event_type: 'payment_cancelled',
//         data: { message: 'Payment was cancelled' },
//         user_id: transaction.user_id
//       })

//     console.log('Payment cancelled:', transaction.transaction_reference)
//     invalidateOrderCaches(transaction)
//   } catch (error) {
//     console.error('Error handling payment cancellation:', error)
//   }
// }

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

// Session-based payment handlers (new flow)
type PaymentSession = { 
  id: string; 
  user_id: string; 
  transaction_reference: string; 
  gateway_transaction_id?: string;
  order_data: string;
  amount: number;
  currency: string;
  provider?: string;
  status?: string;
  order_id?: string;
}

async function handleSessionPaymentSuccess(session: PaymentSession, webhookData: WebhookData) {
  console.log('🔄 === HANDLING SESSION PAYMENT SUCCESS ===', {
    session_id: session.id,
    transaction_reference: session.transaction_reference,
    user_id: session.user_id,
    amount: session.amount,
    currency: session.currency,
    provider: session.provider
  })
  
  try {
    const supabase = getAdminSupabase()
    if (!supabase) {
      console.error('❌ No supabase client available for session success')
      return
    }

    // Enhanced idempotency check with detailed logging
    console.log('🔍 Checking for existing transactions/orders...')
    const { data: existingTx } = await supabase
      .from('payment_transactions')
      .select('id, order_id, status, created_at')
      .eq('transaction_reference', session.transaction_reference)
      .in('status', ['completed', 'processing'])
      .maybeSingle()
      
    if (existingTx?.id) {
      console.log('⚠️  IDEMPOTENCY: Transaction already exists, preventing duplicate processing:', {
        existing_transaction_id: existingTx.id,
        existing_order_id: existingTx.order_id,
        existing_status: existingTx.status,
        created_at: existingTx.created_at,
        session_reference: session.transaction_reference
      })
      
      // Ensure session marked completed  
      await supabase
        .from('payment_sessions')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', session.id)
        
      // Log detailed duplicate webhook info for debugging
      try {
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            transaction_id: existingTx.id,
            event_type: 'duplicate_webhook_success_prevented',
            data: { 
              message: 'Prevented duplicate order creation - transaction already exists',
              existing_transaction: existingTx,
              webhook_data: webhookData,
              prevention_timestamp: new Date().toISOString()
            },
            user_id: session.user_id
          })
      } catch (logError) {
        console.warn('Failed to log duplicate prevention:', logError)
      }
      
      console.log('✅ Duplicate prevented - session marked completed')
      return
    }

    console.log('✅ No existing transaction found, proceeding with order creation')

    // If webhook included a specific order_id (e.g., from client mock webhook), link to that order instead of creating a new one
    const linkOrderId = (webhookData as Record<string, unknown>)?.order_id || (webhookData?.data as Record<string, unknown>)?.order_id
    if (typeof linkOrderId === 'string' && linkOrderId.length > 0) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id, user_id, status, payment_status')
        .eq('id', linkOrderId)
        .maybeSingle()
      if (existingOrder && existingOrder.user_id === session.user_id) {
        // Upsert payment transaction for this order reference
        const { data: txExists } = await supabase
          .from('payment_transactions')
          .select('id')
          .eq('transaction_reference', session.transaction_reference)
          .maybeSingle()
        if (!txExists?.id) {
          await supabase
            .from('payment_transactions')
            .insert({
              order_id: existingOrder.id,
              user_id: session.user_id,
              amount: session.amount,
              currency: session.currency,
              status: 'completed',
              payment_type: 'mobile_money',
              provider: session.provider || 'zenopay',
              transaction_reference: session.transaction_reference,
              gateway_transaction_id: webhookData.gateway_transaction_id || session.gateway_transaction_id,
              completed_at: new Date().toISOString(),
              webhook_data: webhookData
            })
        }

        // Update order status to paid/processing if needed
        await supabase
          .from('orders')
          .update({
            status: 'processing',
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOrder.id)

        // Complete the session and clear cart
        await supabase
          .from('payment_sessions')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', session.id)

        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', session.user_id)

        // Log and revalidate
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'payment_completed',
            data: webhookData,
            user_id: session.user_id
          })

        try {
          revalidateTag('orders')
          revalidateTag(`order:${existingOrder.id}`)
          revalidateTag(`user-orders:${session.user_id}`)
        } catch (e) {
          console.warn('Revalidation error (non-fatal):', e)
        }
        return
      }
    }

    // Parse order data from session (client-provided) with enhanced validation
    console.log('📋 Parsing order data from session...')
    console.log('Raw order_data type:', typeof session.order_data)
    console.log('Raw order_data preview:', JSON.stringify(session.order_data).substring(0, 200) + '...')
    
    let orderData: Record<string, unknown> = {}
    try {
      const raw = (session as unknown as { order_data?: unknown }).order_data
      if (raw && typeof raw === 'string') {
        orderData = JSON.parse(raw)
        console.log('✅ Parsed order data from JSON string')
      } else if (raw && typeof raw === 'object') {
        orderData = raw as Record<string, unknown>
        console.log('✅ Used order data as object')
      } else {
        orderData = {}
        console.warn('⚠️  No valid order data found, using empty object')
      }
      console.log('📋 Final parsed order data:', {
        has_items: Array.isArray(orderData.items),
        items_count: Array.isArray(orderData.items) ? orderData.items.length : 0,
        payment_method: orderData.payment_method,
        shipping_address: !!orderData.shipping_address,
        notes: !!orderData.notes
      })
    } catch (e) {
      console.error('❌ Failed to parse order data from session:', e)
      orderData = {}
    }

    // Normalize items from orderData; support product_id or productId
    const orderDataTyped = orderData as Record<string, unknown>
    const itemsRaw = Array.isArray(orderDataTyped?.items) ? orderDataTyped.items : []
    const items = (itemsRaw as Array<Record<string, unknown>>)
      .map((it) => {
        const itemTyped = it as Record<string, unknown>
        const pid = String(itemTyped.product_id || itemTyped.productId || itemTyped.id || '')
        const qty = Number(itemTyped.quantity || 0)
        return { product_id: pid, quantity: qty }
      })
      .filter((it) => it.product_id && it.quantity > 0)
    if (items.length === 0) {
      console.error('Session has no order items; aborting order creation')
      await supabase
        .from('payment_sessions')
        .update({ status: 'failed', failure_reason: 'No items in session', updated_at: new Date().toISOString() })
        .eq('id', session.id)
      return
    }

    // Enhanced product fetching with validation and logging
    console.log('🛍️  Fetching current product prices and availability...')
    const productIds = items.map(i => i.product_id)
    console.log('Product IDs to fetch:', productIds)
    
    const { data: productsData, error: productsErr } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, is_active')
      .in('id', productIds)
      
    if (productsErr) {
      console.error('❌ Products fetch failed for session order:', {
        error: productsErr,
        product_ids: productIds,
        session_id: session.id
      })
      
      // Update session with failure reason
      await supabase
        .from('payment_sessions')
        .update({ 
          status: 'failed', 
          failure_reason: `Product fetch failed: ${productsErr.message}`,
          updated_at: new Date().toISOString() 
        })
        .eq('id', session.id)
        
      return
    }
    
    console.log(`✅ Fetched ${productsData?.length || 0} products from database`)
    
    const productMap = new Map<string, { id: string; name: string; price: number; stock_quantity?: number | null; is_active?: boolean }>()
    for (const p of productsData || []) {
      productMap.set(p.id as string, {
        id: p.id as string,
        name: p.name as string || 'Unknown Product',
        price: Number(p.price) || 0,
        stock_quantity: (p as Record<string, unknown>)?.stock_quantity as number ?? null,
        is_active: (p as Record<string, unknown>)?.is_active as boolean ?? true
      })
    }
    
    // Validate all requested products exist
    const missingProducts = productIds.filter(id => !productMap.has(id))
    if (missingProducts.length > 0) {
      console.error('❌ Missing products detected:', {
        missing_product_ids: missingProducts,
        session_id: session.id,
        requested_ids: productIds,
        found_ids: Array.from(productMap.keys())
      })
      
      await supabase
        .from('payment_sessions')
        .update({ 
          status: 'failed', 
          failure_reason: `Products not found: ${missingProducts.join(', ')}`,
          updated_at: new Date().toISOString() 
        })
        .eq('id', session.id)
        
      return
    }

    let total_amount = 0
    const orderItems = [] as Array<{ order_id?: string; product_id: string; quantity: number; price: number }>
    for (const it of items) {
      const prod = productMap.get(it.product_id)
      if (!prod) {
        console.error('Product not found during session order creation:', it.product_id)
        continue
      }
      // Note: is_active column doesn't exist in current schema, so we skip this validation
      const serverPrice = prod.price
      orderItems.push({ product_id: it.product_id, quantity: it.quantity, price: serverPrice })
      total_amount += serverPrice * it.quantity
    }

    if (orderItems.length === 0) {
      await supabase
        .from('payment_sessions')
        .update({ status: 'failed', failure_reason: 'No valid items after validation', updated_at: new Date().toISOString() })
        .eq('id', session.id)
      return
    }

    // Create the order using server-computed total with enhanced logging
    const insertOrderPayload: Record<string, unknown> = {
      user_id: session.user_id,
      total_amount,
      currency: session.currency,
      payment_method: orderData.payment_method || 'Mobile Money',
      shipping_address: orderData.shipping_address || 'Will be contacted for delivery arrangements',
      notes: orderData.notes || null,
      status: 'processing',
      payment_status: 'paid',
    }

    console.log('📝 Creating order with payload:', {
      user_id: insertOrderPayload.user_id,
      total_amount: insertOrderPayload.total_amount,
      currency: insertOrderPayload.currency,
      payment_method: insertOrderPayload.payment_method,
      items_count: orderItems.length,
      session_reference: session.transaction_reference
    })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(insertOrderPayload)
      .select()
      .single()

    if (orderError || !order) {
      console.error('❌ CRITICAL: Failed to create order after successful payment:', {
        error: orderError,
        session_id: session.id,
        transaction_reference: session.transaction_reference,
        user_id: session.user_id,
        total_amount,
        payload: insertOrderPayload
      })
      
      // Update session with detailed failure reason
      await supabase
        .from('payment_sessions')
        .update({
          status: 'failed',
          failure_reason: `Order creation failed: ${orderError?.message || 'Unknown error'}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
        
      // Log critical failure for monitoring
      try {
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'critical_order_creation_failure',
            data: { 
              error: orderError,
              payload: insertOrderPayload,
              items: orderItems,
              failure_timestamp: new Date().toISOString()
            },
            user_id: session.user_id
          })
      } catch {}
      
      return
    }

    console.log('✅ Order created successfully:', {
      order_id: order.id,
      total_amount: order.total_amount,
      currency: order.currency,
      payment_status: order.payment_status,
      status: order.status
    })

    // Insert order items (server-verified prices)
    const insertItems = orderItems.map(oi => ({ ...oi, order_id: order.id }))
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(insertItems)
    if (itemsError) {
      console.error('Failed to create order items:', itemsError)
      await supabase.from('orders').delete().eq('id', order.id)
      await supabase
        .from('payment_sessions')
        .update({
          status: 'failed',
          failure_reason: 'Order items creation failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)
      return
    }

    // Inventory policy: do not decrement stock at payment time.
    // Stock will be decremented when the order is marked as 'delivered'.

    // Create payment transaction record for the completed order
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id: order.id,
        user_id: session.user_id,
        amount: total_amount,
        currency: session.currency,
        status: 'completed',
        payment_type: 'mobile_money',
        provider: session.provider || 'zenopay',
        transaction_reference: session.transaction_reference,
        gateway_transaction_id: webhookData.gateway_transaction_id || session.gateway_transaction_id,
        completed_at: new Date().toISOString(),
        webhook_data: webhookData
      })
      .select()
      .single()
    if (txError) {
      console.warn('Failed to create payment transaction record:', txError)
    }

    // Update session as completed
    await supabase
      .from('payment_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', session.id)

    // Clear user's cart after successful paid order (server-side for mobile flow)
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', session.user_id)

    // Log payment completion
    await supabase
      .from('payment_logs')
      .insert({
        session_id: session.id,
        transaction_id: transaction?.id,
        event_type: 'payment_completed',
        data: webhookData,
        user_id: session.user_id
      })

    // Enhanced notification flow with comprehensive tracking and logging
    console.log('📧 === STARTING NOTIFICATION FLOW ===')
    console.log('Getting user details for notifications...')
    
    try {
      // Get user details for notification with error handling
      const { data: authUser, error: userFetchError } = await supabase.auth.admin.getUserById(session.user_id)
      
      if (userFetchError) {
        console.error('❌ Failed to fetch user details for notifications:', {
          error: userFetchError,
          user_id: session.user_id,
          session_id: session.id
        })
        // Continue with order completion even if notifications fail
      }
      
      const userEmail = authUser?.user?.email
      const userName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name
      
      console.log('👤 User details for notifications:', {
        user_id: session.user_id,
        email: userEmail ? 'present' : 'missing',
        name: userName ? 'present' : 'missing',
        has_user_data: !!authUser?.user
      })
      
      if (userEmail) {
        console.log('✅ Valid user email found, proceeding with notifications...')
        // Step 1: Send payment success notification to customer
        console.log('📧 Step 1: Sending payment success notification to customer...')
        try {
          await notifyPaymentSuccess({
            order_id: order.id,
            customer_email: userEmail,
            customer_name: userName || 'Customer',
            amount: total_amount.toString(),
            currency: session.currency,
            payment_method: 'Mobile Money',
            transaction_id: session.transaction_reference
          })
          console.log('✅ Payment success notification sent to customer')
        } catch (paymentNotifyError) {
          console.error('❌ Failed to send payment success notification:', paymentNotifyError)
          // Continue with other notifications
        }

        // Step 2: Send order confirmation email to customer
        console.log('📧 Step 2: Preparing order confirmation email...')
        try {
          const { notifyOrderCreated } = await import('@/lib/notifications/service')
          
          // Get actual product names for better order confirmation
          console.log('🛍️  Fetching product names for order confirmation...')
          const { data: productDetails } = await supabase
            .from('products')
            .select('id, name')
            .in('id', orderItems.map(oi => oi.product_id))
          
          const productMap = new Map(productDetails?.map(p => [p.id, p.name]) || [])
          const items = orderItems.map(oi => ({
            name: productMap.get(oi.product_id) || `Product ${oi.product_id}`,
            quantity: oi.quantity,
            price: oi.price.toString()
          }))

          console.log('📧 Sending order confirmation with items:', items.map(i => `${i.name} x${i.quantity}`))

          await notifyOrderCreated({
            order_id: order.id,
            customer_email: userEmail,
            customer_name: userName || 'Customer',
            total_amount: total_amount.toString(),
            currency: session.currency,
            items,
            order_date: new Date().toLocaleDateString(),
            payment_method: 'Mobile Money',
            shipping_address: (orderData.shipping_address || 'Will be contacted for delivery arrangements') as string
          })
          console.log('✅ Order confirmation email sent to customer')
        } catch (orderNotifyError) {
          console.error('❌ Failed to send order confirmation email:', orderNotifyError)
          // Continue with admin notifications
        }

        // Step 3: Send admin notification for mobile payment orders
        console.log('📧 Step 3: Sending admin notifications for mobile payment order...')
        console.log('💡 Note: Mobile payment orders created directly in webhook require admin notifications here')
        try {
          const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
          
          console.log('📧 Preparing admin notification with product details...')
          const adminNotificationData = {
            order_id: order.id,
            customer_email: userEmail,
            customer_name: userName || 'Customer',
            total_amount: total_amount.toString(),
            currency: session.currency,
            payment_method: 'Mobile Money',
            payment_status: 'paid', // Mobile payments are already paid when webhook fires
            items_count: orderItems.length,
            // CRITICAL: Ensure items array includes product_id for product-specific filtering
            items: orderItems.map(oi => ({
              product_id: oi.product_id,  // Essential for product-specific notifications
              name: productMap.get(oi.product_id)?.name || `Product ${oi.product_id}`,
              quantity: oi.quantity,
              price: oi.price.toString()
            }))
          }
          
          console.log('📧 Admin notification data prepared:', {
            order_id: adminNotificationData.order_id,
            customer_email: adminNotificationData.customer_email,
            items_count: adminNotificationData.items_count,
            product_ids: adminNotificationData.items.map(i => i.product_id),
            total_amount: adminNotificationData.total_amount
          })
          
          await notifyAdminOrderCreated(adminNotificationData)
          console.log('✅ Admin order notification sent successfully for mobile payment')
          console.log('🛍️  Product IDs included:', orderItems.map(oi => oi.product_id))
          
        } catch (adminEmailError) {
          console.error('❌ FAILED to send admin order notification for mobile payment:', {
            error: adminEmailError,
            order_id: order.id,
            session_id: session.id,
            user_email: userEmail
          })
          
          // Log admin notification failure for monitoring
          try {
            await supabase
              .from('payment_logs')
              .insert({
                session_id: session.id,
                transaction_id: transaction?.id,
                event_type: 'admin_notification_failure',
                data: { 
                  error: adminEmailError instanceof Error ? adminEmailError.message : String(adminEmailError),
                  order_id: order.id,
                  failure_step: 'admin_notification',
                  failure_timestamp: new Date().toISOString()
                },
                user_id: session.user_id
              })
          } catch {}
          
          // Don't fail the order creation if admin email fails - this is non-critical
          console.log('⚠️  Continuing despite admin notification failure - order creation successful')
        }
      }
    } catch (emailError) {
      console.error('Failed to send mobile payment notifications:', emailError)
    }

    // Final success logging and cache invalidation
    console.log('🎉 === MOBILE PAYMENT FLOW COMPLETED SUCCESSFULLY ===')
    console.log('📊 Final Summary:', {
      session_id: session.id,
      transaction_reference: session.transaction_reference,
      order_id: order.id,
      user_id: session.user_id,
      total_amount: total_amount,
      currency: session.currency,
      items_count: orderItems.length,
      payment_method: 'Mobile Money',
      order_status: 'processing',
      payment_status: 'paid',
      completion_timestamp: new Date().toISOString()
    })
    
    console.log('🔄 Invalidating caches...')
    try {
      revalidateTag('orders')
      revalidateTag('admin:orders')
      revalidateTag(`order:${order.id}`)
      revalidateTag(`user-orders:${session.user_id}`)  
      console.log('✅ Cache invalidation completed')
    } catch (e) {
      console.warn('⚠️  Cache revalidation error (non-fatal):', e)
    }
    
    console.log('✅ Mobile payment session completed successfully:', session.transaction_reference)
  } catch (error) {
    console.error('❌ CRITICAL ERROR in session payment success handler:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      session_id: session.id,
      transaction_reference: session.transaction_reference,
      user_id: session.user_id
    })
    
    // Log critical error for monitoring
    try {
      const supabase = getAdminSupabase()
      if (supabase) {
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'critical_session_handler_error',
            data: { 
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              failure_timestamp: new Date().toISOString()
            },
            user_id: session.user_id
          })
      }
    } catch (logError) {
      console.error('Failed to log critical error:', logError)
    }
  }
}

async function handleSessionPaymentFailure(session: PaymentSession, reason: string) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return

    // Update session status
    await supabase
      .from('payment_sessions')
      .update({
        status: 'failed',
        failure_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)

    // Send payment failure notification for mobile payment
    try {
      // Get user details for notification
      const { data: authUser } = await supabase.auth.admin.getUserById(session.user_id)
      const userEmail = authUser?.user?.email
      const userName = authUser?.user?.user_metadata?.full_name || authUser?.user?.user_metadata?.name
      
      if (userEmail) {
        await notifyPaymentFailed({
          order_id: 'PENDING', // No order created yet for failed session
          customer_email: userEmail,
          customer_name: userName || 'Customer',
          amount: session.amount.toString(),
          currency: session.currency,
          payment_method: 'Mobile Money',
          failure_reason: reason || 'Mobile payment processing failed'
        })
        console.log('Mobile payment failure notification sent')
      }
    } catch (emailError) {
      console.error('Failed to send mobile payment failure notification:', emailError)
    }

    // Log payment failure
    await supabase
      .from('payment_logs')
      .insert({
        session_id: session.id,
        event_type: 'payment_failed',
        data: { reason },
        user_id: session.user_id
      })

    console.log('Session payment failed:', session.transaction_reference, reason)
  } catch (error) {
    console.error('Error handling session payment failure:', error)
  }
}

// Removed unused handleSessionPaymentPending function

// Commented out unused function to fix build warnings
// async function handleSessionPaymentCancellation(session: PaymentSession) {
//   try {
//     const supabase = getAdminSupabase()
//     if (!supabase) return

//     // Update session status
//     await supabase
//       .from('payment_sessions')
//       .update({
//         status: 'cancelled',
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', session.id)

//     // Log cancellation
//     await supabase
//       .from('payment_logs')
//       .insert({
//         session_id: session.id,
//         event_type: 'payment_cancelled',
//         data: { message: 'Payment was cancelled' },
//         user_id: session.user_id
//       })

//     console.log('Session payment cancelled:', session.transaction_reference)
//   } catch (error) {
//     console.error('Error handling session payment cancellation:', error)
//   }
// }
