import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const debugId = `webhook-${startTime}`
  
  logger.paymentEvent('ZENOPAY WEBHOOK RECEIVED', {
    debugId,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(req.headers.entries())
  })
  
  try {
    // Parse webhook body
    const body = await req.json()
    logger.debug('Webhook payload received', { debugId, body })
    
    // Extract payment data
    const {
      order_id: transactionRef,
      payment_status,
      reference,
      amount,
      transid
    } = body
    
    if (!transactionRef || !payment_status) {
      logger.error('Missing required webhook fields', null, { debugId, transactionRef, payment_status })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    logger.paymentEvent('Processing payment', {
      debugId,
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
      logger.error('Payment session not found', sessionError, { debugId })
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }
    
    logger.info('Found payment session', { debugId, sessionId: session.id })
    
    // Skip if already processed
    if (session.status === 'completed') {
      logger.warn('Payment already processed', { debugId, sessionId: session.id })
      return NextResponse.json({ message: 'Already processed' })
    }
    
    // Process only COMPLETED payments
    if (payment_status !== 'COMPLETED') {
      logger.info('Payment not completed yet', { debugId, payment_status })
      return NextResponse.json({ message: 'Payment not completed yet' })
    }
    
    logger.info('Creating order for completed payment', { debugId })
    
    // Parse order data with comprehensive validation
    logger.debug('Session order_data', { debugId, order_data: session.order_data })
    
    const orderData = session.order_data as Record<string, unknown>
    if (!orderData) {
      logger.error('No order_data found in session', null, { debugId })
      return NextResponse.json({ error: 'No order data found' }, { status: 400 })
    }
    
    const items = (orderData.items as Array<Record<string, unknown>>) || []
    
    if (!items.length) {
      logger.error('No items in order data', null, { debugId, orderData })
      return NextResponse.json({ error: 'No items in order data' }, { status: 400 })
    }
    
    logger.info('Found order items', { debugId, itemCount: items.length, items })
    
    // Calculate total
    let totalAmount = 0
    for (const item of items) {
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 1
      totalAmount += price * quantity
    }
    
    logger.info('Order total calculated', { debugId, totalAmount, currency: session.currency })
    
    // Create order with enhanced data mapping
    const shippingAddress = String(orderData.shipping_address || orderData.address_line_1 || '')
    const customerNotes = String(orderData.notes || '')
    const paymentMethod = `Mobile Money (${session.provider}) - ${String(session.phone_number).replace(/^\+?255/, '***')}`
    
    logger.dbQuery('INSERT', 'orders', {
      debugId,
      user_id: session.user_id,
      total_amount: totalAmount,
      currency: session.currency,
      payment_method: paymentMethod,
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
      logger.error('Order creation failed', orderError, { debugId })
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }
    
    logger.info('Order created successfully', { debugId, orderId: order.id })
    
    // Create order items with validation
    const orderItems = items.map((item: Record<string, unknown>) => {
      const product_id = String(item.product_id || '')
      const quantity = Number(item.quantity) || 1
      const price = Number(item.price) || 0
      
      if (!product_id) {
        logger.warn('Item missing product_id', { debugId, item })
      }
      
      return {
        order_id: order.id,
        product_id,
        quantity,
        price,
        created_at: new Date().toISOString()
      }
    })
    
    logger.dbQuery('INSERT', 'order_items', { debugId, count: orderItems.length })
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) {
      logger.error('Order items creation failed', itemsError, { debugId, orderItems })
      // Don't fail the whole process for this - order is more important
    } else {
      logger.info('Order items created successfully', { debugId, count: orderItems.length })
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
      logger.error('Session update failed', updateError, { debugId })
    } else {
      logger.info('Payment session updated to completed', { debugId, sessionId: session.id })
    }
    
    // Send admin notification IMMEDIATELY (synchronous for instant emails)
    logger.notificationEvent('Sending admin notification', { debugId })
    
    // Extract customer information with fallbacks
    const customerEmail = String(orderData.email || 'customer@example.com')
    const customerName = `${String(orderData.first_name || '')} ${String(orderData.last_name || '')}`.trim() || 'Customer'
    
    logger.debug('Email details', {
      debugId,
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
      
      logger.notificationEvent('Admin notification sent', { debugId, recipient: customerEmail })
    } catch (emailError) {
      logger.error('Admin notification failed', emailError, { debugId, recipient: customerEmail })
      
      // Try fallback notification
      try {
        logger.info('Attempting fallback notification', { debugId })
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
          logger.info('Fallback notification sent successfully', { debugId })
        } else {
          const errorText = await fallbackResponse.text()
          logger.error('Fallback notification also failed', null, { debugId, error: errorText })
        }
      } catch (fallbackError) {
        logger.error('Fallback notification error', fallbackError, { debugId })
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
      logger.error('Payment log insertion failed', successLogError, { debugId })
    } else {
      logger.debug('Payment success logged', { debugId })
    }
    
    const processingTime = Date.now() - startTime
    logger.paymentEvent('WEBHOOK PROCESSED SUCCESSFULLY', { debugId, processingTime })
    
    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      order_id: order.id,
      transaction_reference: transactionRef,
      processing_time_ms: processingTime
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    logger.error('WEBHOOK ERROR', error, { debugId, processingTime })
    
    return NextResponse.json({
      error: 'Webhook processing failed',
      message: (error as Error).message,
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}
