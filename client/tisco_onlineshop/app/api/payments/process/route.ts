import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      order_id, 
      payment_method_id, 
      amount, 
      currency = 'TZS',
      return_url 
    } = await req.json()

    if (!order_id || !payment_method_id || !amount) {
      return NextResponse.json({ 
        error: 'Order ID, payment method, and amount are required' 
      }, { status: 400 })
    }

    // Verify order ownership and status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total_amount, user_id')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Order cannot be paid. Current status: ' + order.status 
      }, { status: 400 })
    }

    if (Math.abs(order.total_amount - amount) > 0.01) {
      return NextResponse.json({ 
        error: 'Payment amount does not match order total' 
      }, { status: 400 })
    }

    // Get payment method details
    const { data: paymentMethod, error: methodError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (methodError || !paymentMethod) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    // Create payment transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        order_id,
        user_id: user.id,
        payment_method_id,
        amount,
        currency,
        status: 'pending',
        payment_type: paymentMethod.type,
        provider: paymentMethod.provider,
        transaction_reference: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    // Process payment based on method type
    let paymentResponse
    try {
      switch (paymentMethod.type) {
        case 'card':
          paymentResponse = await processCardPayment(transaction, paymentMethod, return_url)
          break
        case 'mobile_money':
          paymentResponse = await processMobileMoneyPayment(transaction, paymentMethod)
          break
        case 'bank_transfer':
          paymentResponse = await processBankTransferPayment(transaction, paymentMethod)
          break
        case 'cash_on_delivery':
          paymentResponse = await processCashOnDeliveryPayment(transaction)
          break
        default:
          throw new Error('Unsupported payment method')
      }
    } catch (error) {
      // Update transaction as failed
      await supabase
        .from('payment_transactions')
        .update({ 
          status: 'failed', 
          failure_reason: (error as Error).message,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.id)

      return NextResponse.json({ 
        error: 'Payment processing failed: ' + (error as Error).message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      transaction,
      payment_response: paymentResponse
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process payment' },
      { status: 500 }
    )
  }
}

// Payment processor implementations
async function processCardPayment(transaction: any, paymentMethod: any, returnUrl?: string) {
  // Mock card payment processing - integrate with actual payment gateway
  const mockSuccess = Math.random() > 0.1 // 90% success rate for demo

  if (mockSuccess) {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'processing',
        gateway_transaction_id: `card_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    return {
      status: 'processing',
      redirect_url: returnUrl || '/checkout/success',
      gateway_transaction_id: `card_${Date.now()}`,
      message: 'Card payment initiated successfully'
    }
  } else {
    throw new Error('Card payment declined')
  }
}

async function processMobileMoneyPayment(transaction: any, paymentMethod: any) {
  // Mock mobile money payment processing
  const mockSuccess = Math.random() > 0.05 // 95% success rate for demo

  if (mockSuccess) {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'processing',
        gateway_transaction_id: `mm_${Date.now()}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    return {
      status: 'processing',
      gateway_transaction_id: `mm_${Date.now()}`,
      message: `Mobile money payment request sent to ${paymentMethod.account_number}`,
      instructions: 'Please check your phone for payment confirmation prompt'
    }
  } else {
    throw new Error('Mobile money payment failed')
  }
}

async function processBankTransferPayment(transaction: any, paymentMethod: any) {
  // Bank transfer is typically manual verification
  await supabase
    .from('payment_transactions')
    .update({
      status: 'awaiting_verification',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  return {
    status: 'awaiting_verification',
    message: 'Bank transfer payment recorded. Please transfer funds and upload receipt.',
    bank_details: {
      account_name: 'TISCO Market Ltd',
      account_number: '1234567890',
      bank_name: 'Sample Bank',
      reference: transaction.transaction_reference
    }
  }
}

async function processCashOnDeliveryPayment(transaction: any) {
  // COD is confirmed on delivery
  await supabase
    .from('payment_transactions')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.id)

  // Update order status to confirmed
  await supabase
    .from('orders')
    .update({ 
      status: 'confirmed',
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', transaction.order_id)

  return {
    status: 'confirmed',
    message: 'Cash on delivery order confirmed. Payment will be collected upon delivery.'
  }
}
