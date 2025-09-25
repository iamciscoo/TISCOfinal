import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZenoPayClient } from '@/lib/zenopay'
import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase-server'

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
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      order_id, 
      payment_method_id, 
      amount, 
      currency = 'TZS',
      provider,
      phone_number,
    } = await req.json()

    if (!order_id || !amount) {
      return NextResponse.json({ 
        error: 'Order ID and amount are required' 
      }, { status: 400 })
    }

    // Verify order ownership and status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total_amount, user_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Order cannot be paid. Current status: ' + order.status 
      }, { status: 400 })
    }

    if (Math.abs(order.total_amount - amount) > 0.01) {
      return NextResponse.json({ 
        error: 'Payment amount does not match order total' 
      }, { status: 400 })
    }

    // Resolve payment method details
    let paymentMethod: PaymentMethod | null = null
    if (payment_method_id) {
      const { data: found, error: methodError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('id', payment_method_id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      if (methodError || !found) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
      }
      paymentMethod = found as PaymentMethod
    } else {
      // Ephemeral method (no DB row yet) - requires provider and phone
      if (!provider || !phone_number) {
        return NextResponse.json({ error: 'provider and phone_number are required for mobile money' }, { status: 400 })
      }
      paymentMethod = {
        id: 'ephemeral',
        type: 'mobile_money',
        provider,
        account_number: phone_number,
      } as PaymentMethod
    }

    // Create payment transaction record
    // Create a clean, alphanumeric order reference for the gateway and our DB
    const cleanRef = generateOrderReference()

    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id,
        user_id: user.id,
        payment_method_id: payment_method_id || null,
        amount,
        currency,
        status: 'pending',
        payment_type: paymentMethod!.type,
        provider: paymentMethod!.provider || 'unknown',
        transaction_reference: cleanRef
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    // Derive buyer information from Supabase user
    const buyerName = user.user_metadata?.full_name || user.user_metadata?.name || 'Customer'
    const buyerEmail = user.email || 'no-reply@example.com'
    // Use current request origin for webhook URL to ensure proper environment routing
    const webhookUrl = `${req.nextUrl.origin}/api/payments/webhooks`

    // Process payment based on method type
    let paymentResponse: unknown
    try {
      switch (paymentMethod!.type) {
        case 'mobile_money':
          paymentResponse = await processMobileMoneyPayment(transaction, paymentMethod!, { buyerName, buyerEmail, webhookUrl })
          break
        case 'bank_transfer':
          paymentResponse = await processBankTransferPayment(transaction)
          break
        case 'cash_on_delivery':
          paymentResponse = await processCashOnDeliveryPayment(transaction)
          break
        default:
          throw new Error('Unsupported payment method')
      }
    } catch (error) {
      // Update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed', 
          failure_reason: (error as Error).message,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      // Log error details for debugging
      try {
        await supabase
          .from('payment_logs')
          .insert({
            transaction_id: transaction.id,
            event_type: 'payment_initiation_error',
            data: { message: (error as Error).message },
            user_id: user.id,
          })
      } catch {}

      return NextResponse.json({ 
        error: 'Payment processing failed: ' + (error as Error).message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      transaction,
      payment_response: paymentResponse
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// Payment processor implementations
type PaymentMethod = { id: string; type: 'mobile_money' | 'bank_transfer' | 'cash_on_delivery'; provider?: string; account_number?: string }
type PaymentTransaction = { id: string; order_id: string; user_id: string; amount: number; currency: string; status: string; payment_type?: string; provider?: string; transaction_reference: string; gateway_transaction_id?: string }

interface BuyerInfo { buyerName: string; buyerEmail: string; webhookUrl: string }

async function processMobileMoneyPayment(transaction: PaymentTransaction, paymentMethod: PaymentMethod, meta: BuyerInfo) {
  if (!paymentMethod.account_number) {
    throw new Error('Missing mobile phone number for payment method')
  }

  const localMsisdn = normalizeTzMsisdn(paymentMethod.account_number)
  const e164Msisdn = toE164Tz(paymentMethod.account_number)
  const plusE164Msisdn = toPlusE164Tz(paymentMethod.account_number)
  const client = new ZenoPayClient()

  // Many mobile money providers in TZ expect integer amounts; ensure integer payload
  const amountInt = Math.round(Number(transaction.amount))
  const channel = mapChannel(paymentMethod.provider)

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
        order_id: transaction.transaction_reference,
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
      order_id: transaction.transaction_reference,
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
    .from('payment_transactions')
    .update({
      status: 'processing',
      gateway_transaction_id: gatewayId,
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  // Log initiation for debugging
  await supabase
    .from('payment_logs')
    .insert({
      transaction_id: transaction.id,
      event_type: 'payment_initiated',
      data: {
        used_phone: usedPhone,
        channel: usedWithChannel && channel ? channel : undefined,
        amount: amountInt,
        response: resp,
      },
      user_id: transaction.user_id,
    })

  return {
    status: 'processing',
    gateway_transaction_id: gatewayId,
    message: `Mobile money request sent to ${usedPhone}. Please approve the prompt on your phone.`,
    raw: resp,
  }
}

async function processBankTransferPayment(transaction: PaymentTransaction) {
  // Bank transfer is typically manual verification
  await supabase
    .from('payment_transactions')
    .update({
      status: 'awaiting_verification',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  return {
    status: 'awaiting_verification',
    message: 'Bank transfer payment recorded. Please transfer funds and upload receipt.',
    bank_details: {
      account_name: 'TISCO Market Ltd',
      account_number: '1234567890',
      bank_name: 'Sample Bank',
      reference: transaction.transaction_reference
    }
  }
}

async function processCashOnDeliveryPayment(transaction: PaymentTransaction) {
  // COD is confirmed on delivery
  await supabase
    .from('payment_transactions')
    .update({
      status: 'awaiting_verification',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  // Update order status to confirmed
  await supabase
    .from('orders')
    .update({ 
      status: 'processing',
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.order_id)

  // Invalidate caches so client picks up the change
  try {
    revalidateTag('orders')
    revalidateTag(`order:${transaction.order_id}`)
    revalidateTag(`user-orders:${transaction.user_id}`)
  } catch (e) {
    console.warn('Revalidation error (non-fatal):', e)
  }

  return {
    status: 'awaiting_verification',
    message: 'Cash on delivery order confirmed. Payment will be collected upon delivery.'
  }
}
