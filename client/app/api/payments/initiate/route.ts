import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZenoPayClient } from '@/lib/zenopay'
import { getUser } from '@/lib/supabase-server'
import crypto from 'node:crypto'
export const runtime = 'nodejs'

function normalizeTzMsisdn(raw: string): string {
  // ZenoPay examples use local format 0XXXXXXXXX (10 digits)
  // Accept various inputs and normalize to 0-leading local number
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('0')) return digits
  if (digits.length === 12 && digits.startsWith('255')) return `0${digits.slice(3)}`
  if (digits.length === 9) return `0${digits}`
  if (String(raw || '').startsWith('+255')) return `0${String(raw).replace(/\D/g, '').slice(3)}`
  throw new Error('Invalid phone format. Use 0XXXXXXXXX (TZ)')
}

// Map UI/provider labels to ZenoPay channel keywords
function mapChannel(provider?: string): string | undefined {
  const p = (provider || '').toLowerCase().trim()
  if (!p) return undefined
  if (p.includes('vodacom') || p.includes('m-pesa') || p.includes('mpesa')) return 'vodacom'
  if (p.includes('tigo') || p.includes('mixx')) return 'tigo'
  if (p.includes('airtel')) return 'airtel'
  // Extras (in case we add more later)
  if (p.includes('halotel') || p.includes('halopesa')) return 'halotel'
  if (p.includes('ttcl') || p.includes('t-pesa') || p.includes('tpesa')) return 'ttcl'
  return undefined
}

// Convert any TZ mobile input to E.164 digits-only without plus sign (2557XXXXXXXX)
function toE164Tz(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '')
  const last9 = digits.slice(-9)
  if (last9.length !== 9) throw new Error('Invalid phone format for E.164 conversion')
  return `255${last9}`
}

// Same as toE164Tz but with a leading plus sign (+2557XXXXXXXX)
function toPlusE164Tz(raw: string): string {
  return `+${toE164Tz(raw)}`
}

function generateOrderReference(): string {
  // Alphanumeric only; used as external gateway reference
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `TX${ts}${rand}`.replace(/[^A-Z0-9]/g, '')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      amount, 
      currency = 'TZS',
      provider,
      phone_number,
      order_data,
      idempotency_key: bodyIdempotencyKey,
    } = await req.json()

    if (!amount || !provider || !phone_number || !order_data) {
      return NextResponse.json({ 
        error: 'Amount, provider, phone_number, and order_data are required' 
      }, { status: 400 })
    }

    // Idempotency: accept Idempotency-Key header/body or compute a stable fallback
    const headerIdemKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key')
    const providedIdem = (headerIdemKey || '').trim() || (bodyIdempotencyKey ? String(bodyIdempotencyKey) : '')

    const hashHex = (s: string) => crypto.createHash('sha256').update(s).digest('hex').toUpperCase()
    const deriveRefFromKey = (k: string) => `TX${hashHex(k).slice(0, 24)}` // alphanumeric, stable

    let computedIdem: string | null = null
    try {
      // Compute a deterministic key from user + normalized payload for fallback
      const od = (order_data || {}) as Record<string, unknown>
      const itemsRaw = Array.isArray(od?.items) ? od.items as Array<Record<string, unknown>> : []
      const items = itemsRaw
        .map((it) => {
          const pid = String(it.product_id || it.productId || it.id || '')
          const qty = Number(it.quantity || 0)
          return { product_id: pid, quantity: qty }
        })
        .filter((it) => it.product_id && it.quantity > 0)
        .sort((a, b) => a.product_id.localeCompare(b.product_id))
      let e164 = ''
      try { e164 = toE164Tz(phone_number) } catch { e164 = String(phone_number || '') }
      const channel = mapChannel(provider) || provider
      const fingerprint = JSON.stringify({ user_id: user.id, amount: Number(amount), currency, channel, phone: e164, items })
      computedIdem = hashHex(fingerprint)
    } catch { computedIdem = null }

    const idemKey = providedIdem || computedIdem || ''
    const deterministicRef = idemKey ? deriveRefFromKey(idemKey) : null

    // If deterministic ref exists and a session already exists, reuse it (idempotent)
    if (deterministicRef) {
      const { data: existing } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_reference', deterministicRef)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        // Only reuse if the existing session is successful or still processing
        // Allow retries for failed sessions
        if (existing.status === 'failed') {
          console.log('Previous session failed, allowing retry:', {
            existing_session: existing.id,
            failure_reason: existing.failure_reason,
            transaction_reference: deterministicRef
          })
          
          // Log retry attempt
          try {
            await supabase
              .from('payment_logs')
              .insert({
                session_id: existing.id,
                event_type: 'failed_session_retry_attempt',
                data: { 
                  message: 'Retrying failed payment session', 
                  previous_failure: existing.failure_reason,
                  idemKey, 
                  transaction_reference: deterministicRef 
                },
                user_id: existing.user_id,
              })
          } catch {}
          
          // Continue to create new session for retry
        } else {
          // Reuse existing successful/processing session
          try {
            await supabase
              .from('payment_logs')
              .insert({
                session_id: existing.id,
                event_type: 'duplicate_initiate_attempt',
                data: { message: 'Idempotent reuse', idemKey, transaction_reference: deterministicRef },
                user_id: existing.user_id,
              })
          } catch {}

          return NextResponse.json({
            transaction: {
              transaction_reference: deterministicRef,
              status: existing.status || 'processing',
            },
            payment_response: null,
            reused: true,
          }, { status: 200 })
        }
      }
    }

    // Use deterministic ref when present; otherwise generate a fresh one
    const cleanRef = deterministicRef || generateOrderReference()

    // Create payment session record (without order_id since order doesn't exist yet)
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .insert({
        user_id: user.id,
        amount,
        currency,
        provider,
        phone_number,
        transaction_reference: cleanRef,
        order_data,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // Derive buyer information from Supabase user
    const buyerName = user.user_metadata?.full_name || user.user_metadata?.name || 'Customer'
    const buyerEmail = user.email || 'no-reply@example.com'
    // Use current request origin for webhook URL to ensure proper environment routing
    const webhookUrl = `${req.nextUrl.origin}/api/payments/webhooks`

    // Process mobile money payment
    try {
      const paymentResponse = await processMobileMoneyPayment(session, { buyerName, buyerEmail, webhookUrl })
      
      return NextResponse.json({ 
        transaction: {
          transaction_reference: cleanRef,
          status: 'processing'
        },
        payment_response: paymentResponse
      }, { status: 200 })

    } catch (error) {
      console.error('Mobile payment initiation failed:', error)
      
      const errorMessage = (error as Error).message
      let userFriendlyError = errorMessage
      
      // Provide user-friendly error messages
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('403')) {
        userFriendlyError = 'Payment service temporarily unavailable. Please try again later or contact support.'
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        userFriendlyError = 'Network timeout. Please check your connection and try again.'
      } else if (errorMessage.includes('phone') || errorMessage.includes('msisdn')) {
        userFriendlyError = 'Invalid phone number format. Please use the format 07XXXXXXXX.'
      }
      
      // Update session as failed
      await supabase
        .from('payment_sessions')
        .update({ 
          status: 'failed', 
          failure_reason: errorMessage,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

      // Log the failure for debugging
      try {
        await supabase
          .from('payment_logs')
          .insert({
            session_id: session.id,
            event_type: 'payment_initiation_failed',
            data: { 
              error: errorMessage, 
              stack: (error as Error).stack,
              user_friendly_error: userFriendlyError,
              session_reference: cleanRef
            },
            user_id: session.user_id
          })
      } catch {
        // Don't fail if logging fails
      }

      return NextResponse.json({ 
        error: userFriendlyError,
        technical_error: errorMessage,
        session_reference: cleanRef,
        retry_allowed: true
      }, { status: 500 })
    }

  } catch (error: unknown) {
    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}

// Payment processor for mobile money
type PaymentSession = { 
  id: string; 
  user_id: string; 
  amount: number; 
  currency: string; 
  provider: string;
  phone_number: string;
  transaction_reference: string; 
  order_data: unknown;
}

interface BuyerInfo { 
  buyerName: string; 
  buyerEmail: string; 
  webhookUrl: string; 
}

async function processMobileMoneyPayment(session: PaymentSession, meta: BuyerInfo) {
  const localMsisdn = normalizeTzMsisdn(session.phone_number)
  const e164Msisdn = toE164Tz(session.phone_number)
  const plusE164Msisdn = toPlusE164Tz(session.phone_number)
  const client = new ZenoPayClient()

  // Many mobile money providers in TZ expect integer amounts; ensure integer payload
  const amountInt = Math.round(Number(session.amount))
  const channel = mapChannel(session.provider)

  type ZenoCreateOrderResponse = {
    status?: string
    message?: string
    data?: { order_id?: string; payment_status?: string; transaction_id?: string }
    order_id?: string
    transaction_id?: string
  }

  const okStatuses = new Set(['success', 'processing', 'pending', 'queued', 'initiated', 'created', 'ok'])

  const tryCreate = async (buyer_phone: string, withChannel: boolean): Promise<ZenoCreateOrderResponse> => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('ZenoPay createOrder request', {
        order_id: session.transaction_reference,
        buyer_phone,
        channel: withChannel && channel ? channel : undefined,
        amount: amountInt,
      })
    }
    const res = await client.createOrder({
      buyer_name: meta.buyerName,
      buyer_phone,
      buyer_email: meta.buyerEmail,
      amount: amountInt,
      order_id: session.transaction_reference,
      webhook_url: meta.webhookUrl,
      ...(withChannel && channel ? { channel } : {}),
    })
    const resp = res as ZenoCreateOrderResponse
    const code = String(resp?.status || '').toLowerCase()
    if (code && !okStatuses.has(code)) {
      throw new Error(resp?.message || `Gateway returned status=${code}`)
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('ZenoPay createOrder response', resp)
    }
    return resp
  }

  // Attempts: phone formats [local, 255..., +255...] and for each try with channel then without
  const phones = [localMsisdn, e164Msisdn, plusE164Msisdn]
  const withChannelVariants = channel ? [false, true] : [false]

  let resp: ZenoCreateOrderResponse | null = null
  let usedPhone = phones[0]
  let usedWithChannel = Boolean(channel)
  let lastError: unknown = null

  outer: for (const phone of phones) {
    for (const useChan of withChannelVariants) {
      try {
        const r = await tryCreate(phone, useChan)
        resp = r
        usedPhone = phone
        usedWithChannel = useChan
        break outer
      } catch (e) {
        lastError = e
        // continue to next variant
      }
    }
  }

  if (!resp) {
    throw lastError instanceof Error ? lastError : new Error('Failed to initiate mobile money payment')
  }

  const gatewayId = resp?.data?.order_id ?? resp?.order_id ?? resp?.transaction_id ?? null

  await supabase
    .from('payment_sessions')
    .update({
      status: 'processing',
      gateway_transaction_id: gatewayId,
      updated_at: new Date().toISOString()
    })
    .eq('id', session.id)

  // Log initiation for debugging
  await supabase
    .from('payment_logs')
    .insert({
      session_id: session.id,
      event_type: 'payment_initiated',
      data: {
        used_phone: usedPhone,
        channel: usedWithChannel && channel ? channel : undefined,
        amount: amountInt,
        response: resp,
      },
      user_id: session.user_id,
    })

  return {
    status: 'processing',
    gateway_transaction_id: gatewayId,
    message: `Mobile money request sent to ${usedPhone}. Please approve the prompt on your phone.`,
    raw: resp,
  }
}
