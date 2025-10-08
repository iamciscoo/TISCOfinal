/**
 * TISCO Mobile Payment Initiation
 * Creates payment session and initiates ZenoPay transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/supabase-server'
import {
  createPaymentSession,
  initiateZenoPayment
} from '@/lib/payments/service'
import type { InitiatePaymentRequest, OrderData } from '@/lib/payments/types'
import { ValidationError, ZenoPayError } from '@/lib/payments/types'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const authUser = await getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile from our users table
    const userProfile = await getUserProfile(authUser.id)
    if (!userProfile) {
      console.error('❌ User profile not found for auth user:', authUser.id)
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    console.log('🔐 Authenticated user:', { 
      authId: authUser.id, 
      profileId: userProfile.id,
      email: authUser.email || userProfile.email
    })

    // Parse request
    const body: InitiatePaymentRequest = await req.json()
    const { amount, currency = 'TZS', provider, phone_number, order_data } = body

    // Validate required fields
    if (!amount || !provider || !phone_number || !order_data) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['amount', 'provider', 'phone_number', 'order_data']
        },
        { status: 400 }
      )
    }

    // Validate order data
    if (!order_data.items || !Array.isArray(order_data.items) || order_data.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Validate amount matches cart total
    const calculatedTotal = order_data.items.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity))
    }, 0)

    if (Math.abs(calculatedTotal - Number(amount)) > 0.01) {
      return NextResponse.json(
        {
          error: 'Amount mismatch',
          calculated: calculatedTotal,
          provided: amount
        },
        { status: 400 }
      )
    }

    // First create order in database to get real order ID
    console.log('📦 Creating order in database first...')
    
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    const orderData = order_data as OrderData
    
    // Create order with pending status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userProfile.id,
        total_amount: Number(amount),
        currency,
        status: 'pending',
        payment_status: 'pending',
        payment_method: `Mobile Money (${provider})`,
        shipping_address: orderData.shipping_address || 'N/A',
        address_line_1: orderData.address_line_1 || '',
        phone: orderData.contact_phone || orderData.phone || null,
        notes: orderData.notes || '',
        // Store customer info from order data (for registered users)
        customer_name: orderData.first_name && orderData.last_name ? 
          `${orderData.first_name} ${orderData.last_name}` : null,
        customer_email: orderData.email || null,
        customer_phone: orderData.contact_phone || orderData.phone || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('❌ Failed to create order:', {
        error: orderError,
        code: orderError?.code,
        message: orderError?.message,
        details: orderError?.details,
        hint: orderError?.hint,
        orderData: {
          user_id: userProfile.id,
          total_amount: Number(amount),
          currency,
          shipping_address: orderData.shipping_address,
          address_line_1: orderData.address_line_1,
          phone: orderData.contact_phone || orderData.phone,
          customer_name: orderData.first_name && orderData.last_name ? 
            `${orderData.first_name} ${orderData.last_name}` : null,
          customer_email: orderData.email,
          customer_phone: orderData.contact_phone || orderData.phone
        }
      })
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError?.message },
        { status: 500 }
      )
    }

    console.log(`✅ Order created with ID: ${order.id}`)

    // Create order items
    if (orderData.items && orderData.items.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(
          orderData.items.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }))
        )

      if (itemsError) {
        console.error('⚠️ Failed to create order items:', itemsError)
      } else {
        console.log(`✅ Order items created: ${orderData.items.length} items`)
      }
    }

    // Create payment session with idempotency check, linked to order
    const { session, is_duplicate } = await createPaymentSession({
      user_id: userProfile.id,
      amount: Number(amount),
      currency,
      provider,
      phone_number,
      order_data: orderData,
      order_id: order.id // Link to real order
    })

    // If duplicate, return existing session
    if (is_duplicate) {
      console.log(`⚠️ Duplicate payment prevented, returning existing session: ${session.id}`)
      return NextResponse.json({
        success: true,
        transaction_reference: session.transaction_reference,
        status: session.status,
        message: 'Payment session already exists',
        session_id: session.id,
        order_id: order.id,
        is_duplicate: true
      })
    }

    // Derive buyer information
    const buyerName = 
      authUser.user_metadata?.full_name || 
      authUser.user_metadata?.name || 
      `${order_data.first_name} ${order_data.last_name}`.trim() ||
      'Customer'
    const buyerEmail = authUser.email || order_data.email || 'no-reply@tiscomarket.store'
    
    // Use production URL for webhook (ensures ZenoPay can reach us)
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://tiscomarket.store/api/payments/mobile/webhook'
      : `${req.nextUrl.origin}/api/payments/mobile/webhook`

    console.log(`🚀 Initiating payment for order: ${order.id}`)
    console.log(`📞 Webhook URL: ${webhookUrl}`)

    // Initiate payment with ZenoPay using REAL ORDER ID
    try {
      const result = await initiateZenoPayment({
        session,
        order_id: order.id, // Use real database order ID
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        webhook_url: webhookUrl
      })

      console.log(`✅ Payment initiated for order: ${order.id}`)
      console.log(`📋 Transaction reference: ${session.transaction_reference}`)

      return NextResponse.json({
        success: true,
        transaction_reference: session.transaction_reference,
        order_id: order.id,
        status: 'processing',
        message: result.message,
        session_id: session.id,
        gateway_transaction_id: result.gateway_transaction_id
      })

    } catch (paymentError) {
      console.error('Payment initiation failed:', paymentError)

      // Provide user-friendly error messages with retry information
      let userMessage = 'Payment initiation failed. Please try again.'
      let isRetryable = true
      let resultCode = null
      
      if (paymentError instanceof ValidationError) {
        userMessage = 'Invalid phone number format. Please use Tanzania mobile numbers (07XX XXX XXX).'
        isRetryable = false
      } else if (paymentError instanceof ZenoPayError) {
        const errorDetails = (paymentError as any).details || {}
        resultCode = errorDetails.result_code
        isRetryable = errorDetails.retryable !== false // Default to retryable unless explicitly false
        
        // Use the enhanced error message from ZenoPay handling
        userMessage = paymentError.message || userMessage
        
        if ((paymentError.message || '').includes('timeout')) {
          userMessage = 'Payment gateway timeout. Please try again.'
        } else if ((paymentError.message || '').includes('API key') || (paymentError.message || '').includes('403')) {
          userMessage = 'Payment service temporarily unavailable. Please contact support.'
          isRetryable = false
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          retryable: isRetryable,
          result_code: resultCode,
          transaction_reference: session?.transaction_reference,
          order_id: order?.id,
          session_id: session?.id
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Payment initiation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initiate payment',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}
