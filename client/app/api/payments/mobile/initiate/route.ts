/**
 * TISCO Mobile Payment Initiation
 * Creates payment session and initiates ZenoPay transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
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
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Create payment session with idempotency check
    const { session, is_duplicate } = await createPaymentSession({
      user_id: user.id,
      amount: Number(amount),
      currency,
      provider,
      phone_number,
      order_data: order_data as OrderData
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
        is_duplicate: true
      })
    }

    // Derive buyer information
    const buyerName = 
      user.user_metadata?.full_name || 
      user.user_metadata?.name || 
      `${order_data.first_name} ${order_data.last_name}`.trim() ||
      'Customer'
    const buyerEmail = user.email || order_data.email || 'no-reply@tiscomarket.store'
    
    // Use request origin for webhook URL (ensures correct environment routing)
    const webhookUrl = `${req.nextUrl.origin}/api/payments/mobile/webhook`

    console.log(`🚀 Initiating payment for session: ${session.id}`)
    console.log(`📞 Webhook URL: ${webhookUrl}`)

    // Initiate payment with ZenoPay
    try {
      const result = await initiateZenoPayment({
        session,
        buyer_name: buyerName,
        buyer_email: buyerEmail,
        webhook_url: webhookUrl
      })

      console.log(`✅ Payment initiated: ${session.transaction_reference}`)

      return NextResponse.json({
        success: true,
        transaction_reference: session.transaction_reference,
        status: 'processing',
        message: result.message,
        session_id: session.id,
        gateway_transaction_id: result.gateway_transaction_id
      })

    } catch (paymentError) {
      console.error('Payment initiation failed:', paymentError)

      // Provide user-friendly error messages
      let userMessage = 'Payment initiation failed. Please try again.'
      
      if (paymentError instanceof ValidationError) {
        userMessage = 'Invalid phone number format. Please use Tanzania mobile numbers (07XX XXX XXX).'
      } else if (paymentError instanceof ZenoPayError) {
        if ((paymentError.message || '').includes('timeout')) {
          userMessage = 'Payment gateway timeout. Please try again.'
        } else if ((paymentError.message || '').includes('API key') || (paymentError.message || '').includes('403')) {
          userMessage = 'Payment service temporarily unavailable. Please contact support.'
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          technical_error: (paymentError as Error).message,
          transaction_reference: session.transaction_reference,
          session_id: session.id,
          retryable: paymentError instanceof ZenoPayError && paymentError.retryable
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
