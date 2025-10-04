/**
 * TISCO Mobile Payment Webhook Handler
 * Receives payment confirmations from ZenoPay and creates orders
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSessionByReference,
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

    // Only process completed payments
    if (payment_status !== 'COMPLETED') {
      console.log(`⏳ [${webhookId}] Payment not completed: ${payment_status}`)
      return NextResponse.json({
        success: true,
        message: `Payment status: ${payment_status}`
      })
    }

    // Find payment session
    const session = await getSessionByReference(transactionRef)
    
    if (!session) {
      console.error(`❌ [${webhookId}] Session not found: ${transactionRef}`)
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

    // Send notifications synchronously but with timeout protection
    // CRITICAL: In Vercel serverless functions, we must await async operations
    // setImmediate doesn't work reliably - the function returns before it executes
    const notificationPromise = (async () => {
      try {
        console.log(`📧 [${webhookId}] Sending notifications...`)
        
        const { notifyAdminOrderCreated, notifyOrderCreated } = await import('@/lib/notifications/service')
        
        const orderData = session.order_data
        const customerEmail = orderData.email || 'customer@example.com'
        const customerName = `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim() || 'Customer'
        
        // Get order items for customer notification
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
        
        console.log(`🔍 [${webhookId}] Order items query result:`, {
          items_count: orderItems?.length || 0,
          items: orderItems?.map((item: any) => ({
            product_id: item.product_id,
            products_id: item.products?.id,
            name: item.products?.name
          }))
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
          
          console.log(`✅ [${webhookId}] Customer notification sent to ${customerEmail}`)
        }
        
        // Send admin notification with items for product-specific filtering
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
          items_count,
          items: itemsWithProductIds // CRITICAL: Pass items with product_id for filtering
        })
        
        console.log(`✅ [${webhookId}] Admin notifications sent`)
        
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
        console.error(`⚠️ [${webhookId}] Notification failed (non-blocking):`, notifError)
        console.error(`⚠️ [${webhookId}] Notification error stack:`, (notifError as Error).stack)
        
        await logPaymentEvent('notification_failed', {
          session_id: session.id,
          order_id,
          user_id: session.user_id,
          error: (notifError as Error).message
        })
      }
    })()
    
    // Wait for notifications with timeout (don't block indefinitely)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Notification timeout after 25 seconds')), 25000)
    )
    
    try {
      await Promise.race([notificationPromise, timeoutPromise])
      console.log(`📧 [${webhookId}] Notifications completed successfully`)
    } catch (timeoutError) {
      console.warn(`⚠️ [${webhookId}] Notification timeout (non-critical):`, (timeoutError as Error).message)
      // Continue - order is created, notifications will retry via database
    }

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
