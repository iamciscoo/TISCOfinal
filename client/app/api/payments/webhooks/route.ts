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
    
    // Parse order data
    const orderData = session.order_data as Record<string, unknown>
    const items = (orderData.items as Array<Record<string, unknown>>) || []
    
    if (!items.length) {
      console.error(`❌ [${debugId}] No items in order data`)
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }
    
    // Calculate total
    let totalAmount = 0
    for (const item of items) {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 1
      totalAmount += price * quantity
    }
    
    console.log(`💰 [${debugId}] Order total: ${totalAmount} ${session.currency}`)
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: session.user_id,
        total_amount: totalAmount,
        currency: session.currency,
        status: 'processing',
        payment_status: 'paid',
        payment_method: `Mobile Money (${session.provider})`,
        shipping_address: orderData.shipping_address || '',
        notes: orderData.notes || '',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (orderError || !order) {
      console.error(`❌ [${debugId}] Order creation failed:`, orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }
    
    console.log(`✅ [${debugId}] Order created:`, order.id)
    
    // Create order items
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity || 1,
      price: item.price || 0,
      created_at: new Date().toISOString()
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      console.error(`❌ [${debugId}] Order items creation failed:`, itemsError)
      // Don't fail the whole process for this
    } else {
      console.log(`✅ [${debugId}] Order items created: ${orderItems.length}`)
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
    try {
      const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
      await notifyAdminOrderCreated({
        order_id: order.id,
        customer_email: String(orderData.email || 'customer@example.com'),
        customer_name: `${String(orderData.first_name || '')} ${String(orderData.last_name || '')}`.trim() || 'Customer',
        total_amount: totalAmount.toString(),
        currency: session.currency,
        payment_method: 'Mobile Money',
        payment_status: 'paid',
        items_count: orderItems.length
      })
      
      console.log(`✅ [${debugId}] Admin notification sent IMMEDIATELY`)
    } catch (emailError) {
      console.error(`❌ [${debugId}] Admin notification failed:`, emailError)
      // Don't fail the webhook for email issues - but log extensively
      console.error(`❌ [${debugId}] Email error details:`, emailError)
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
