import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Webhook disabled: missing SUPABASE_SERVICE_ROLE' }, { status: 503 })
    }
    const body = await req.json()
    const signature = req.headers.get('x-webhook-signature')
    
    // Verify webhook signature (implement based on payment provider)
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const { event_type, transaction_id, status, gateway_transaction_id, amount, failure_reason } = body

    // Find the transaction using reference or gateway id (conditionally)
    let query = supabase
      .from('payment_transactions')
      .select(`
        *,
        orders(id, user_id, status)
      `)
    if (gateway_transaction_id) {
      query = query.or(`transaction_reference.eq.${transaction_id},gateway_transaction_id.eq.${gateway_transaction_id}`)
    } else {
      query = query.eq('transaction_reference', transaction_id)
    }
    const { data: transaction, error: findError } = await query.single()

    if (findError || !transaction) {
      console.error('Transaction not found:', transaction_id, gateway_transaction_id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Process webhook event
    switch (event_type) {
      case 'payment.completed':
      case 'payment.success':
        await handlePaymentSuccess(transaction, body)
        break
        
      case 'payment.failed':
      case 'payment.declined':
        await handlePaymentFailure(transaction, failure_reason || 'Payment failed')
        break
        
      case 'payment.pending':
        await handlePaymentPending(transaction)
        break
        
      case 'payment.cancelled':
        await handlePaymentCancellation(transaction)
        break
        
      default:
        console.log('Unhandled webhook event:', event_type)
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: unknown) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

type WebhookData = { gateway_transaction_id?: string; [key: string]: unknown }
type TransactionRow = { id: string; order_id: string; user_id: string; status: string; transaction_reference: string }

async function handlePaymentSuccess(transaction: TransactionRow, webhookData: WebhookData) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'completed',
        gateway_transaction_id: webhookData.gateway_transaction_id || transaction.gateway_transaction_id,
        completed_at: new Date().toISOString(),
        webhook_data: webhookData,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Update order status and payment status
    await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    // Log payment completion
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_completed',
        data: webhookData,
        user_id: transaction.user_id
      })

    // TODO: Send confirmation email/SMS
    // TODO: Trigger order fulfillment process
    
    console.log('Payment completed successfully:', transaction.transaction_reference)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailure(transaction: TransactionRow, reason: string) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'failed',
        failure_reason: reason,
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Update order payment status
    await supabase
      .from('orders')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.order_id)

    // Log payment failure
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_failed',
        data: { reason },
        user_id: transaction.user_id
      })

    // TODO: Send failure notification
    // TODO: Restore product stock if needed
    
    console.log('Payment failed:', transaction.transaction_reference, reason)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentPending(transaction: TransactionRow) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status if not already pending
    if (transaction.status !== 'pending') {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)
    }

    // Log pending status
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_pending',
        data: { message: 'Payment is pending confirmation' },
        user_id: transaction.user_id
      })

    console.log('Payment pending:', transaction.transaction_reference)
  } catch (error) {
    console.error('Error handling payment pending:', error)
  }
}

async function handlePaymentCancellation(transaction: TransactionRow) {
  try {
    const supabase = getAdminSupabase()
    if (!supabase) return
    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Update order status if no other successful payments
    const { data: otherPayments } = await supabase
      .from('payment_transactions')
      .select('status')
      .eq('order_id', transaction.order_id)
      .in('status', ['completed', 'processing'])

    if (!otherPayments || otherPayments.length === 0) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.order_id)
    }

    // Log cancellation
    await supabase
      .from('payment_logs')
      .insert({
        transaction_id: transaction.id,
        event_type: 'payment_cancelled',
        data: { message: 'Payment was cancelled' },
        user_id: transaction.user_id
      })

    console.log('Payment cancelled:', transaction.transaction_reference)
  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}

function verifyWebhookSignature(_body: unknown, signature: string | null): boolean {
  // Implement signature verification based on your payment provider
  // This is a placeholder implementation
  
  if (!signature) {
    return false
  }

  const expectedSignature = process.env.WEBHOOK_SECRET
  if (!expectedSignature) {
    console.warn('WEBHOOK_SECRET not configured')
    return true // Allow in development
  }

  // TODO: Implement actual signature verification
  // For now, just check if signature exists
  return signature.length > 10
}
