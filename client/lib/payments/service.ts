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
  
  // Smart duplicate check with automatic timeout handling
  // Match frontend timeout (50s) + small buffer (10s) = 60s active window
  const { data: recentSessions } = await supabase
    .from('payment_sessions')
    .select('*')
    .eq('user_id', params.user_id)
    .eq('amount', params.amount)
    .eq('provider', params.provider)
    .eq('phone_number', params.phone_number)
    .eq('status', 'processing')
    .order('created_at', { ascending: false })
    .limit(5)

  if (recentSessions && recentSessions.length > 0) {
    for (const session of recentSessions) {
      const sessionAge = Date.now() - new Date(session.created_at).getTime()
      const activeWindowMs = 60 * 1000 // 60 seconds (frontend timeout 50s + 10s buffer)
      
      if (sessionAge < activeWindowMs) {
        // Session is fresh and actively processing - block duplicate
        console.log(`⚠️ Active payment in progress (${Math.round(sessionAge/1000)}s old), preventing duplicate: ${session.id}`)
        await logPaymentEvent('duplicate_prevented', {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          user_id: params.user_id,
          details: { reason: 'Active processing session found', age_seconds: Math.round(sessionAge/1000) }
        })
        
        return {
          session: session as PaymentSession,
          is_duplicate: true
        }
      } else {
        // Session is stale (timeout) - mark as failed and allow retry
        console.log(`⏳ Found stale processing session (${Math.round(sessionAge/1000)}s old), marking as failed: ${session.id}`)
        await supabase
          .from('payment_sessions')
          .update({
            status: 'failed',
            failure_reason: 'Payment timeout - exceeded 60 second window',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.id)
        
        await logPaymentEvent('session_expired', {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          user_id: params.user_id,
          details: { reason: 'Automatic timeout after 60 seconds', age_seconds: Math.round(sessionAge/1000) }
        })
      }
    }
  }
  
  console.log('✅ No active session found, creating new payment session')

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

  // CRITICAL: Always use session.transaction_reference for ZenoPay
  // This allows retries with the same DB order but different ZenoPay orders
  // Each payment session gets a unique transaction_reference
  const zenoOrderId = session.transaction_reference

  console.log(`📋 ZenoPay order_id: ${zenoOrderId} (session ref)`)
  if (order_id) {
    console.log(`📦 Linked to database order: ${order_id}`)
  }

  try {
    const response = await client.createOrder({
      buyer_name,
      buyer_phone: normalizedPhone,
      buyer_email,
      amount: amountInt,
      order_id: zenoOrderId, // Use unique session reference (allows retries)
      webhook_url,
      ...(channel ? { channel } : {})
    })

    const resp = response as {
      status?: string
      message?: string
      code?: string | number
      result_code?: string | number
      data?: { order_id?: string; transaction_id?: string }
      order_id?: string
      transaction_id?: string
    }

    // Check ZenoPay result codes
    const resultCode = String(resp?.code || resp?.result_code || '000')
    const retryableResultCodes = ['001', '002', '003', '004', '005', '999']
    
    console.log(`📊 ZenoPay result code: ${resultCode}`)
    
    // Handle non-success result codes
    if (resultCode !== '000') {
      const resultCodeMessages: Record<string, string> = {
        '001': 'Invalid API key - please contact support',
        '002': 'Missing required parameters - please retry',
        '003': 'Invalid phone number format - please check your phone number',
        '004': 'Insufficient funds - please top up your mobile money account',
        '005': 'Payment canceled - you can retry the payment',
        '999': 'Gateway error - please try again'
      }
      
      const errorMessage = resultCodeMessages[resultCode] || resp?.message || 'Payment failed'
      const isRetryable = retryableResultCodes.includes(resultCode)
      
      console.log(`❌ ZenoPay error - Code: ${resultCode}, Retryable: ${isRetryable}`)
      
      if (isRetryable) {
        // Mark as failed but allow retry
        await updateSessionStatus(session.id, 'failed', undefined, errorMessage)
        
        await logPaymentEvent('payment_failed_retryable', {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          user_id: session.user_id,
          error: errorMessage,
          details: { result_code: resultCode, retryable: true }
        })
        
        throw new ZenoPayError(errorMessage, true, {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          result_code: resultCode,
          retryable: true
        })
      } else {
        // Non-retryable error
        await updateSessionStatus(session.id, 'failed', undefined, errorMessage)
        
        await logPaymentEvent('payment_failed', {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          user_id: session.user_id,
          error: errorMessage,
          details: { result_code: resultCode, retryable: false }
        })
        
        throw new ZenoPayError(errorMessage, false, {
          session_id: session.id,
          transaction_reference: session.transaction_reference,
          result_code: resultCode,
          retryable: false
        })
      }
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
        response: resp,
        result_code: resultCode
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
 * Create order from payment session OR update existing linked order
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionWithOrderId = session as any

  // Check if session already has linked order (new flow with retry)
  if (sessionWithOrderId.order_id) {
    console.log(`♻️ Session has linked order, updating existing order: ${sessionWithOrderId.order_id}`)
    
    // Update existing order to paid status
    const { data: existingOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'processing',
        payment_status: 'paid',
        payment_method: `Mobile Money (${session.provider})`,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionWithOrderId.order_id)
      .select()
      .single()

    if (updateError || !existingOrder) {
      throw new OrderCreationError('Failed to update linked order', {
        session_id: session.id,
        order_id: sessionWithOrderId.order_id,
        error: updateError?.message
      })
    }

    order = existingOrder
    console.log(`✅ Updated existing order ${order.id} to paid status`)
    
  } else {
    // Legacy flow: Create new order
    console.log('📦 Creating new order (legacy flow - no linked order_id)')
    
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

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderInput)
      .select()
      .single()

    if (orderError || !newOrder) {
      throw new OrderCreationError('Failed to create order', {
        session_id: session.id,
        error: orderError?.message,
        order_input: orderInput
      })
    }

    order = newOrder
  }

  // Create order items (only if order was newly created, not updated)
  const orderItems: CreateOrderItemInput[] = orderData.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price
  }))

  // Check if items already exist (for reused orders)
  const { data: existingItems } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', order.id)
    .limit(1)

  if (!existingItems || existingItems.length === 0) {
    // Items don't exist, create them
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
    } else {
      console.log(`✅ Created ${orderItems.length} order items`)
    }
  } else {
    console.log(`♻️ Order items already exist, skipping creation`)
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
