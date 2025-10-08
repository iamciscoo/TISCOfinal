/**
 * TISCO Mobile Payment Service
 * Centralized payment logic with proper error handling and logging
 */

import { createClient } from '@supabase/supabase-js'
import { ZenoPayClient } from '@/lib/zenopay'
import type {
  PaymentSession,
  OrderData,
  CreateOrderInput,
  CreateOrderItemInput,
  PaymentLogEvent,
  PaymentProvider
} from './types'
import {
  ZenoPayError,
  OrderCreationError,
  ValidationError
} from './types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// ============================================================================
// Phone Number Utilities
// ============================================================================

/**
 * Normalize Tanzanian phone number to local format (0XXXXXXXXX)
 */
export function normalizeTzPhone(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '')
  
  if (digits.length === 10 && digits.startsWith('0')) return digits
  if (digits.length === 12 && digits.startsWith('255')) return `0${digits.slice(3)}`
  if (digits.length === 9) return `0${digits}`
  
  throw new ValidationError('Invalid Tanzania phone number format', { raw, digits })
}

/**
 * Map provider name to ZenoPay channel
 */
export function mapProviderToChannel(provider: PaymentProvider): string | undefined {
  const map: Record<PaymentProvider, string> = {
    'M-Pesa': 'vodacom',
    'Tigo Pesa': 'tigo',
    'Airtel Money': 'airtel',
    'Halopesa': 'halotel'
  }
  return map[provider]
}

/**
 * Generate unique transaction reference
 */
export function generateTransactionReference(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase()
  return `TISCO${ts}${rand}`.replace(/[^A-Z0-9]/g, '')
}

// ============================================================================
// Logging Utilities
// ============================================================================

export async function logPaymentEvent(
  event_type: PaymentLogEvent,
  data: {
    session_id?: string
    transaction_reference?: string
    order_id?: string
    user_id?: string
    error?: string
    details?: Record<string, unknown>
  }
): Promise<void> {
  try {
    await supabase.from('payment_logs').insert({
      session_id: data.session_id || null,
      event_type,
      data: {
        transaction_reference: data.transaction_reference,
        order_id: data.order_id,
        error: data.error,
        ...data.details
      },
      user_id: data.user_id || null,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to log payment event:', error)
    // Don't throw - logging failures shouldn't break payment flow
  }
}

// ============================================================================
// Payment Session Management
// ============================================================================

/**
 * Create payment session with idempotency check
 */
export async function createPaymentSession(params: {
  user_id: string
  amount: number
  currency: string
  provider: PaymentProvider
  phone_number: string
  order_data: OrderData
  order_id?: string
}): Promise<{ session: PaymentSession; is_duplicate: boolean }> {
  const transaction_reference = generateTransactionReference()
  
  // Check for recent duplicate (within 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: recentSession } = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('user_id', params.user_id)
    .eq('amount', params.amount)
    .eq('provider', params.provider)
    .eq('phone_number', params.phone_number)
    .in('status', ['pending', 'processing'])
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentSession) {
    await logPaymentEvent('duplicate_prevented', {
      session_id: recentSession.id,
      transaction_reference: recentSession.transaction_reference,
      user_id: params.user_id,
      details: { reason: 'Recent identical session found' }
    })
    
    return {
      session: recentSession as PaymentSession,
      is_duplicate: true
    }
  }

  // Create new session
  const { data: session, error } = await supabase
    .from('payment_sessions')
    .insert({
      user_id: params.user_id,
      amount: params.amount,
      currency: params.currency,
      provider: params.provider,
      phone_number: params.phone_number,
      transaction_reference,
      order_data: params.order_data,
      order_id: params.order_id || null, // Link to order if provided
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error || !session) {
    throw new Error(`Failed to create payment session: ${error?.message}`)
  }

  await logPaymentEvent('payment_initiated', {
    session_id: session.id,
    transaction_reference: session.transaction_reference,
    user_id: params.user_id,
    details: {
      amount: params.amount,
      currency: params.currency,
      provider: params.provider
    }
  })

  return {
    session: session as PaymentSession,
    is_duplicate: false
  }
}

/**
 * Update payment session status
 */
export async function updateSessionStatus(
  session_id: string,
  status: PaymentSession['status'],
  gateway_transaction_id?: string,
  failure_reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('payment_sessions')
    .update({
      status,
      gateway_transaction_id: gateway_transaction_id || null,
      failure_reason: failure_reason || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', session_id)

  if (error) {
    console.error('Failed to update session status:', error)
  }
}

// ============================================================================
// ZenoPay Integration
// ============================================================================

/**
 * Initiate payment with ZenoPay
 */
export async function initiateZenoPayment(params: {
  session: PaymentSession
  buyer_name: string
  buyer_email: string
  webhook_url: string
  order_id?: string
}): Promise<{ gateway_transaction_id: string | null; message: string }> {
  const { session, buyer_name, buyer_email, webhook_url, order_id } = params
  
  const client = new ZenoPayClient()
  const normalizedPhone = normalizeTzPhone(session.phone_number)
  const channel = mapProviderToChannel(session.provider)
  const amountInt = Math.round(Number(session.amount))

  // Use real order ID if provided, otherwise fallback to transaction reference
  const zenoOrderId = order_id || session.transaction_reference

  console.log(`📋 ZenoPay order_id: ${zenoOrderId} (${order_id ? 'real DB order' : 'transaction reference'})`)

  try {
    const response = await client.createOrder({
      buyer_name,
      buyer_phone: normalizedPhone,
      buyer_email,
      amount: amountInt,
      order_id: zenoOrderId, // Use real database order ID
      webhook_url,
      ...(channel ? { channel } : {})
    })

    const resp = response as {
      status?: string
      message?: string
      data?: { order_id?: string; transaction_id?: string }
      order_id?: string
      transaction_id?: string
    }

    const gateway_transaction_id = 
      resp?.data?.order_id ?? 
      resp?.data?.transaction_id ?? 
      resp?.order_id ?? 
      resp?.transaction_id ?? 
      null

    await updateSessionStatus(session.id, 'processing', gateway_transaction_id || undefined)

    await logPaymentEvent('payment_processing', {
      session_id: session.id,
      transaction_reference: session.transaction_reference,
      user_id: session.user_id,
      details: {
        gateway_transaction_id,
        phone: normalizedPhone,
        channel,
        response: resp
      }
    })

    return {
      gateway_transaction_id,
      message: `Payment request sent to ${normalizedPhone}. Please approve on your phone.`
    }

  } catch (error) {
    const errorMessage = (error as Error).message
    
    await updateSessionStatus(session.id, 'failed', undefined, errorMessage)
    
    await logPaymentEvent('payment_failed', {
      session_id: session.id,
      transaction_reference: session.transaction_reference,
      user_id: session.user_id,
      error: errorMessage
    })

    throw new ZenoPayError(errorMessage, true, {
      session_id: session.id,
      transaction_reference: session.transaction_reference
    })
  }
}

// ============================================================================
// Order Creation
// ============================================================================

/**
 * Create order from payment session
 * This is called by webhook when payment is confirmed
 */
export async function createOrderFromSession(
  session: PaymentSession
): Promise<{ order_id: string; items_count: number }> {
  const orderData = session.order_data

  // Validate order data
  if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new OrderCreationError('Invalid order data - no items found', {
      session_id: session.id,
      order_data: orderData
    })
  }

  // Calculate total
  const totalAmount = orderData.items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity))
  }, 0)

  // Create order
  const orderInput: CreateOrderInput = {
    user_id: session.user_id,
    total_amount: totalAmount,
    currency: session.currency,
    status: 'processing',
    payment_status: 'paid',
    payment_method: `Mobile Money (${session.provider})`,
    shipping_address: orderData.shipping_address,
    notes: orderData.notes || '',
    paid_at: new Date().toISOString()
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderInput)
    .select()
    .single()

  if (orderError || !order) {
    throw new OrderCreationError('Failed to create order', {
      session_id: session.id,
      error: orderError?.message,
      order_input: orderInput
    })
  }

  // Create order items
  const orderItems: CreateOrderItemInput[] = orderData.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    console.error('Order items creation failed:', itemsError)
    // Log but don't fail - order is more important
    await logPaymentEvent('order_creation_failed', {
      session_id: session.id,
      order_id: order.id,
      user_id: session.user_id,
      error: `Items insertion failed: ${itemsError.message}`,
      details: { items: orderItems }
    })
  }

  await logPaymentEvent('order_created', {
    session_id: session.id,
    transaction_reference: session.transaction_reference,
    order_id: order.id,
    user_id: session.user_id,
    details: {
      total_amount: totalAmount,
      items_count: orderItems.length
    }
  })

  return {
    order_id: order.id,
    items_count: orderItems.length
  }
}

/**
 * Get payment session by transaction reference
 */
export async function getSessionByReference(
  transaction_reference: string
): Promise<PaymentSession | null> {
  const { data, error } = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('transaction_reference', transaction_reference)
    .single()

  if (error || !data) {
    return null
  }

  return data as PaymentSession
}

/**
 * Get payment session by order ID (for ZenoPay webhook)
 */
export async function getSessionByOrderId(
  order_id: string
): Promise<PaymentSession | null> {
  const { data, error } = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('order_id', order_id)
    .single()

  if (error || !data) {
    return null
  }

  return data as PaymentSession
}

/**
 * Check if session is already processed
 */
export async function isSessionProcessed(session_id: string): Promise<boolean> {
  const { data } = await supabase
    .from('payment_sessions')
    .select('status')
    .eq('id', session_id)
    .single()

  return data?.status === 'completed'
}
