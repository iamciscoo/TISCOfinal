/**
 * TISCO Mobile Payment Status Check
 * Check payment and order status by transaction reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { getSessionByReference } from '@/lib/payments/service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Transaction reference required' },
        { status: 400 }
      )
    }

    // Get payment session
    const session = await getSessionByReference(reference)

    if (!session) {
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (session.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If completed, try to find the order
    let order_id: string | null = null
    
    if (session.status === 'completed') {
      const fiveMinutesAfterSession = new Date(
        new Date(session.created_at).getTime() + 5 * 60 * 1000
      ).toISOString()
      
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', session.user_id)
        .eq('total_amount', session.amount)
        .eq('payment_status', 'paid')
        .gte('created_at', session.created_at)
        .lte('created_at', fiveMinutesAfterSession)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (order) {
        order_id = order.id
      }
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      order_id,
      transaction_reference: reference,
      amount: session.amount,
      currency: session.currency,
      provider: session.provider,
      created_at: session.created_at,
      updated_at: session.updated_at,
      message: getStatusMessage(session.status, !!order_id)
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        message: (error as Error).message
      },
      { status: 500 }
    )
  }
}

function getStatusMessage(status: string, hasOrder: boolean): string {
  switch (status) {
    case 'completed':
      return hasOrder 
        ? 'Payment completed and order created successfully'
        : 'Payment completed, order is being processed'
    case 'processing':
      return 'Payment is being processed. Please check your phone for confirmation.'
    case 'pending':
      return 'Waiting for payment confirmation from mobile money provider.'
    case 'failed':
      return 'Payment failed. Please try again or use a different payment method.'
    case 'expired':
      return 'Payment session expired. Please start a new payment.'
    default:
      return 'Payment status unknown'
  }
}
