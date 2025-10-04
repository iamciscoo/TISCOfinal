import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const debugId = `webhook-${startTime}`
  
  console.log(`🚨 [${debugId}] ZENOPAY WEBHOOK RECEIVED - PROCESSING IMMEDIATELY`)
  console.log(`📍 [${debugId}] Timestamp: ${new Date().toISOString()}`)
  console.log(`📍 [${debugId}] Headers:`, Object.fromEntries(req.headers.entries()))
  
  try {
    // Parse webhook body
    const body = await req.json()
    console.log(`📦 [${debugId}] Webhook payload:`, body)
    
    // Extract payment data
    const {
      order_id: transactionRef,
      payment_status,
      reference,
      amount,
      transid
    } = body
    
    if (!transactionRef || !payment_status) {
      console.error(`❌ [${debugId}] Missing required fields:`, { transactionRef, payment_status })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    console.log(`🔍 [${debugId}] Processing payment:`, {
      transactionRef,
      payment_status,
      reference,
      amount
    })
    
    // Find the payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transactionRef)
      .single()
    
    if (sessionError || !session) {
      console.error(`❌ [${debugId}] Payment session not found:`, sessionError)
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }
    
    console.log(`✅ [${debugId}] Found payment session:`, session.id)
    
    // Skip if already processed
    if (session.status === 'completed') {
      console.log(`⚠️ [${debugId}] Payment already processed`)
      return NextResponse.json({ message: 'Already processed' })
    }
    
    // Process only COMPLETED payments
    if (payment_status !== 'COMPLETED') {
      console.log(`⏳ [${debugId}] Payment not completed yet: ${payment_status}`)
      return NextResponse.json({ message: 'Payment not completed yet' })
    }
    
    console.log(`🚀 [${debugId}] Creating order for completed payment...`)
    
    // Parse order data with comprehensive validation
    console.log(`📊 [${debugId}] Session order_data:`, JSON.stringify(session.order_data, null, 2))
    
    const orderData = session.order_data as Record<string, unknown>
    if (!orderData) {
      console.error(`❌ [${debugId}] No order_data found in session`)
      return NextResponse.json({ error: 'No order data found' }, { status: 400 })
    }
    
    const items = (orderData.items as Array<Record<string, unknown>>) || []
    
    if (!items.length) {
      console.error(`❌ [${debugId}] No items in order data. Full orderData:`, orderData)
      return NextResponse.json({ error: 'No items in order data' }, { status: 400 })
    }
    
    console.log(`📮 [${debugId}] Found ${items.length} items:`, items)
    
    // Calculate total
    let totalAmount = 0
    for (const item of items) {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 1
      totalAmount += price * quantity
    }
    
    console.log(`💰 [${debugId}] Order total: ${totalAmount} ${session.currency}`)
    
    // Create order with enhanced data mapping
    const shippingAddress = String(orderData.shipping_address || orderData.address_line_1 || '')
    const customerNotes = String(orderData.notes || '')
    const paymentMethod = `Mobile Money (${session.provider}) - ${String(session.phone_number).replace(/^\+?255/, '***')}`
    
    console.log(`📝 [${debugId}] Creating order with:`, {
      user_id: session.user_id,
      total_amount: totalAmount,
      currency: session.currency,
      payment_method: paymentMethod,
      shipping_address: shippingAddress,
      items_count: items.length
    })
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user_id,
        total_amount: totalAmount,
        currency: session.currency,
        status: 'processing',
        payment_status: 'paid',
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        notes: customerNotes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (orderError || !order) {
      console.error(`❌ [${debugId}] Order creation failed:`, orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }
    
    console.log(`✅ [${debugId}] Order created:`, order.id)
    
    // Create order items with validation
    const orderItems = items.map((item: Record<string, unknown>) => {
      const product_id = String(item.product_id || '')
      const quantity = Number(item.quantity) || 1
      const price = Number(item.price) || 0
      
      if (!product_id) {
        console.warn(`⚠️ [${debugId}] Item missing product_id:`, item)
      }
      
      return {
        order_id: order.id,
        product_id,
        quantity,
        price,
        created_at: new Date().toISOString()
      }
    })
    
    console.log(`📦 [${debugId}] Creating ${orderItems.length} order items...`)
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      console.error(`❌ [${debugId}] Order items creation failed:`, itemsError)
      console.error(`❌ [${debugId}] Failed items data:`, orderItems)
      // Don't fail the whole process for this - order is more important
    } else {
      console.log(`✅ [${debugId}] Successfully created ${orderItems.length} order items`)
    }
    
    // Update payment session to completed
    const { error: updateError } = await supabase
      .from('payment_sessions')
      .update({
        status: 'completed',
        gateway_transaction_id: transid || reference || transactionRef,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id)
    
    if (updateError) {
      console.error(`❌ [${debugId}] Session update failed:`, updateError)
    } else {
      console.log(`✅ [${debugId}] Payment session updated to completed`)
    }
    
    // Send admin notification IMMEDIATELY (synchronous for instant emails)
    console.log(`📧 [${debugId}] Sending admin notification IMMEDIATELY...`)
    
    // Extract customer information with fallbacks
    const customerEmail = String(orderData.email || 'customer@example.com')
    const customerName = `${String(orderData.first_name || '')} ${String(orderData.last_name || '')}`.trim() || 'Customer'
    
    console.log(`📧 [${debugId}] Email details:`, {
      customer_email: customerEmail,
      customer_name: customerName,
      order_id: order.id,
      total_amount: totalAmount,
      items_count: orderItems.length
    })
    
    try {
      const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
      await notifyAdminOrderCreated({
        order_id: order.id,
        customer_email: customerEmail,
        customer_name: customerName,
        total_amount: totalAmount.toString(),
        currency: session.currency,
        payment_method: 'Mobile Money',
        payment_status: 'paid',
        items_count: orderItems.length
      })
      
      console.log(`✅ [${debugId}] Admin notification sent IMMEDIATELY to: ${customerEmail}`)
    } catch (emailError) {
      console.error(`❌ [${debugId}] Admin notification failed for ${customerEmail}:`, emailError)
      console.error(`❌ [${debugId}] Email error stack:`, (emailError as Error).stack)
      
      // Try fallback notification
      try {
        console.log(`🔄 [${debugId}] Attempting fallback notification...`)
        const fallbackResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://tiscomarket.store'}/api/notifications/admin-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            customer_email: customerEmail,
            customer_name: customerName,
            total_amount: totalAmount.toString(),
            currency: session.currency,
            payment_method: 'Mobile Money',
            payment_status: 'paid',
            items_count: orderItems.length
          })
        })
        
        if (fallbackResponse.ok) {
          console.log(`✅ [${debugId}] Fallback notification sent successfully`)
        } else {
          console.error(`❌ [${debugId}] Fallback notification also failed:`, await fallbackResponse.text())
        }
      } catch (fallbackError) {
        console.error(`❌ [${debugId}] Fallback notification error:`, fallbackError)
      }
    }
    
    // Log success
    const { error: successLogError } = await supabase
      .from('payment_logs')
      .insert({
        session_id: session.id,
        event_type: 'payment_completed',
        data: {
          order_id: order.id,
          transaction_reference: transactionRef,
          payment_status,
          amount: totalAmount,
          webhook_processed_at: new Date().toISOString()
        },
        user_id: session.user_id
      })
    
    if (successLogError) {
      console.error(`❌ [${debugId}] Logging failed:`, successLogError)
    } else {
      console.log(`✅ [${debugId}] Success logged`)
    }
    
    const processingTime = Date.now() - startTime
    console.log(`🎉 [${debugId}] WEBHOOK PROCESSED SUCCESSFULLY in ${processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      order_id: order.id,
      transaction_reference: transactionRef,
      processing_time_ms: processingTime
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`💥 [${debugId}] WEBHOOK ERROR after ${processingTime}ms:`, error)
    
    return NextResponse.json({
      error: 'Webhook processing failed',
      message: (error as Error).message,
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}
