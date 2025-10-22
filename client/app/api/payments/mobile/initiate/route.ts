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
    
    // 🔄 ORDER REUSE LOGIC: Check for existing pending order (prevents duplicates on retry)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, total_amount, created_at')
      .eq('user_id', userProfile.id)
      .eq('status', 'pending')
      .eq('payment_status', 'pending')
      .eq('total_amount', Number(amount))
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(3)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let order: any = null
    let isReusedOrder = false
    
    // Check if any recent order has the same items (verify it's the same cart)
    if (recentOrders && recentOrders.length > 0) {
      for (const recentOrder of recentOrders) {
        const { data: existingItems } = await supabase
          .from('order_items')
          .select('product_id, quantity, price')
          .eq('order_id', recentOrder.id)
        
        if (!existingItems || existingItems.length !== orderData.items.length) {
          continue
        }
        
        // Check if all items match
        const itemsMatch = orderData.items.every(cartItem =>
          existingItems.some(orderItem =>
            orderItem.product_id === cartItem.product_id &&
            orderItem.quantity === cartItem.quantity &&
            Number(orderItem.price) === Number(cartItem.price)
          )
        )
        
        if (itemsMatch) {
          console.log(`♻️ Reusing existing pending order: ${recentOrder.id}`)
          // Fetch the full order details
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('*')
            .eq('id', recentOrder.id)
            .single()
          
          if (existingOrder) {
            order = existingOrder
            isReusedOrder = true
            break
          }
        }
      }
    }
    
    // Create new order only if no matching pending order found
    if (!order) {
      console.log('📦 Creating new order...')
      const { data: newOrder, error: orderError } = await supabase
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
          customer_name: orderData.first_name && orderData.last_name ? 
            `${orderData.first_name} ${orderData.last_name}` : null,
          customer_email: orderData.email || null,
          customer_phone: orderData.contact_phone || orderData.phone || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (orderError || !newOrder) {
        console.error('❌ Failed to create order:', orderError)
        return NextResponse.json(
          { error: 'Failed to create order', details: orderError?.message },
          { status: 500 }
        )
      }
      
      order = newOrder
      console.log(`✅ New order created with ID: ${order.id}`)
    }

    // Create order items (skip if order was reused - items already exist)
    if (!isReusedOrder && orderData.items && orderData.items.length > 0) {
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
    } else if (isReusedOrder) {
      console.log(`♻️ Skipping order items creation - order reused`)
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
      console.error('❌ Payment initiation failed:', paymentError)
      console.error('❌ Error details:', {
        name: (paymentError as Error).name,
        message: (paymentError as Error).message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        details: (paymentError as any).details
      })

      // 🗑️ CLEANUP: Mark order as failed when ZenoPay fails
      // This prevents orphaned "pending" orders that will never be paid
      if (order && !isReusedOrder) {
        console.log(`🗑️ Marking order ${order.id} as cancelled due to payment failure`)
        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'failed',
            notes: order.notes ? 
              `${order.notes}\n\nPayment failed: ${(paymentError as Error).message}` :
              `Payment failed: ${(paymentError as Error).message}`
          })
          .eq('id', order.id)
      }

      // Provide user-friendly error messages with retry information
      let userMessage = 'Payment initiation failed. Please try again.'
      let isRetryable = true
      let resultCode = null
      
      if (paymentError instanceof ValidationError) {
        userMessage = 'Invalid phone number format. Please use Tanzania mobile numbers (07XX XXX XXX).'
        isRetryable = false
      } else if (paymentError instanceof ZenoPayError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
