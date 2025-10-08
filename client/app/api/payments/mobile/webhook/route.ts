/**
 * TISCO Mobile Payment Webhook Handler
 * Receives payment confirmations from ZenoPay and creates orders
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionByReference,
  getSessionByOrderId,
  isSessionProcessed,
  updateSessionStatus,
  createOrderFromSession,
  logPaymentEvent
} from '@/lib/payments/service'
import type { ZenoPayWebhookPayload } from '@/lib/payments/types'

export const runtime = 'nodejs'
export const maxDuration = 60 // Max 60 seconds for webhook processing
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const webhookId = `webhook-${startTime}-${Math.random().toString(36).slice(2, 8)}`
  
  console.log(`🔔 [${webhookId}] ZenoPay webhook received`)
  console.log(`📍 [${webhookId}] Timestamp: ${new Date().toISOString()}`)
  
  try {
    // Parse webhook payload
    const payload: ZenoPayWebhookPayload = await req.json()
    
    console.log(`📦 [${webhookId}] Payload:`, JSON.stringify(payload, null, 2))
    
    // Validate required fields
    if (!payload.order_id || !payload.payment_status) {
      console.error(`❌ [${webhookId}] Missing required fields`)
      return NextResponse.json(
        { error: 'Missing required fields: order_id, payment_status' },
        { status: 400 }
      )
    }

    const { order_id: transactionRef, payment_status, reference, transid } = payload

    // Process all success statuses from ZenoPay
    const successStatuses = ['COMPLETED', 'SUCCESSFUL', 'SUCCESS', 'SETTLED', 'APPROVED']
    const isPaymentSuccessful = successStatuses.includes(payment_status?.toUpperCase())
    
    if (!isPaymentSuccessful) {
      console.log(`⏳ [${webhookId}] Payment not successful: ${payment_status}`)
      return NextResponse.json({
        success: true,
        message: `Payment status: ${payment_status}`
      })
    }
    
    console.log(`🎉 [${webhookId}] Payment successful with status: ${payment_status}`)

    // Find payment session - try by order_id first (new flow), then by transaction_reference (legacy)
    let session = await getSessionByOrderId(transactionRef)
    
    if (!session) {
      console.log(`🔍 [${webhookId}] Session not found by order_id, trying transaction_reference...`)
      session = await getSessionByReference(transactionRef)
    }
    
    if (!session) {
      console.error(`❌ [${webhookId}] Session not found by either order_id or transaction_reference: ${transactionRef}`)
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

    console.log(`✅ [${webhookId}] Found session: ${session.id}`)

    // Check if already processed (idempotency)
    if (await isSessionProcessed(session.id)) {
      console.log(`⚠️ [${webhookId}] Already processed - idempotent response`)
      
      await logPaymentEvent('duplicate_prevented', {
        session_id: session.id,
        transaction_reference: transactionRef,
        user_id: session.user_id,
        details: { reason: 'Webhook already processed' }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        idempotent: true
      })
    }

    // Log webhook received
    await logPaymentEvent('webhook_received', {
      session_id: session.id,
      transaction_reference: transactionRef,
      user_id: session.user_id,
      details: {
        payment_status,
        reference,
        transid,
        webhook_id: webhookId
      }
    })

    // Update session with gateway transaction ID
    const gatewayTxId = transid || reference || transactionRef
    await updateSessionStatus(session.id, 'processing', gatewayTxId)

    console.log(`🚀 [${webhookId}] Creating order...`)

    // Create order from session
    let order_id: string
    let items_count: number

    try {
      const result = await createOrderFromSession(session)
      order_id = result.order_id
      items_count = result.items_count
      
      console.log(`✅ [${webhookId}] Order created: ${order_id} (${items_count} items)`)
      
    } catch (orderError) {
      console.error(`❌ [${webhookId}] Order creation failed:`, orderError)
      
      await updateSessionStatus(
        session.id,
        'failed',
        gatewayTxId,
        `Order creation failed: ${(orderError as Error).message}`
      )
      
      await logPaymentEvent('webhook_error', {
        session_id: session.id,
        transaction_reference: transactionRef,
        user_id: session.user_id,
        error: (orderError as Error).message,
        details: { stack: (orderError as Error).stack }
      })
      
      return NextResponse.json(
        {
          error: 'Order creation failed',
          message: (orderError as Error).message
        },
        { status: 500 }
      )
    }

    // Mark session as completed
    await updateSessionStatus(session.id, 'completed', gatewayTxId)

    // Queue notifications asynchronously (non-blocking for webhook response)
    // Use setImmediate for guaranteed async execution after webhook response
    console.log(`🚀 [${webhookId}] Queueing async notifications...`)
    
    setImmediate(async () => {
      try {
        console.log(`📧 [${webhookId}] Processing async notifications...`)
        
        const { notifyAdminOrderCreated, notifyOrderCreated } = await import('@/lib/notifications/service')
        
        const orderData = session.order_data
        const customerEmail = orderData.email || 'customer@example.com'
        const customerName = `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim() || 'Customer'
        
        // Get order items for notifications
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE!
        )
        
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            product_id,
            quantity,
            price,
            products (
              id,
              name
            )
          `)
          .eq('order_id', order_id)
        
        console.log(`🔍 [${webhookId}] Order items for notifications:`, {
          items_count: orderItems?.length || 0
        })
        
        // Send customer notification
        if (orderItems && orderItems.length > 0) {
          const items = orderItems.map((item: any) => ({
            name: item.products?.name || 'Product',
            quantity: item.quantity,
            price: item.price.toString()
          }))
          
          await notifyOrderCreated({
            order_id,
            customer_email: customerEmail,
            customer_name: customerName,
            total_amount: session.amount.toString(),
            currency: session.currency,
            items,
            order_date: new Date().toISOString(),
            payment_method: `Mobile Money (${session.provider})`,
            shipping_address: orderData.shipping_address || 'N/A'
          })
          
          console.log(`✅ [${webhookId}] Customer notification sent (async)`)
        }
        
        // Send admin notification
        const itemsWithProductIds = (orderItems || []).map((item: any) => ({
          product_id: item.product_id || (item.products?.id),
          name: item.products?.name || 'Product',
          quantity: item.quantity,
          price: item.price.toString()
        }))
        
        await notifyAdminOrderCreated({
          order_id,
          customer_email: customerEmail,
          customer_name: customerName,
          total_amount: session.amount.toString(),
          currency: session.currency,
          payment_method: 'Mobile Money',
          payment_status: 'paid',
          items_count: orderItems?.length || 0,
          items: itemsWithProductIds
        })
        
        console.log(`✅ [${webhookId}] Admin notification sent (async)`)
        
        await logPaymentEvent('notification_sent', {
          session_id: session.id,
          order_id,
          user_id: session.user_id,
          details: { 
            customer_email: customerEmail,
            notifications: ['customer', 'admin']
          }
        })
        
      } catch (notifError) {
        console.error(`❌ [${webhookId}] Async notification failed:`, notifError)
        
        // Log failure but don't affect order creation
        try {
          await logPaymentEvent('notification_failed', {
            session_id: session.id,
            order_id,
            user_id: session.user_id,
            error: (notifError as Error).message
          })
        } catch (logError) {
          console.error(`❌ Failed to log notification error:`, logError)
        }
      }
    })

    const processingTime = Date.now() - startTime
    console.log(`🎉 [${webhookId}] SUCCESS in ${processingTime}ms`)

    await logPaymentEvent('webhook_processed', {
      session_id: session.id,
      transaction_reference: transactionRef,
      order_id,
      user_id: session.user_id,
      details: {
        processing_time_ms: processingTime,
        items_count
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      order_id,
      transaction_reference: transactionRef,
      processing_time_ms: processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = (error as Error).message
    
    console.error(`💥 [${webhookId}] CRITICAL ERROR after ${processingTime}ms:`, error)
    console.error(`💥 [${webhookId}] Stack:`, (error as Error).stack)

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: errorMessage,
        processing_time_ms: processingTime
      },
      { status: 500 }
    )
  }
}
