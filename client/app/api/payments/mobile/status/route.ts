/**
 * TISCO Mobile Payment Status Check
 * Check payment and order status by transaction reference
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/supabase-server'
import { getSessionByReference, getSessionByOrderId } from '@/lib/payments/service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const authUser = await getUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userProfile = await getUserProfile(authUser.id)
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Transaction reference required' },
        { status: 400 }
      )
    }

    // Get payment session - try by transaction_reference first (standard), then by order_id (for webhook flow)
    let session = await getSessionByReference(reference)
    
    if (!session) {
      console.log(`🔍 Trying to find session by order_id: ${reference}`)
      session = await getSessionByOrderId(reference)
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (session.user_id !== userProfile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find the associated order (always try to find it, not just when completed)
    let order_id: string | null = null
    let order_status: string | null = null
    
    // First, check if session has linked order_id (new flow)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any).order_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`📦 Session has linked order_id: ${(session as any).order_id}`)
      
      const { data: linkedOrder } = await supabase
        .from('orders')
        .select('id, status, payment_status')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .eq('id', (session as any).order_id)
        .single()
      
      if (linkedOrder) {
        order_id = linkedOrder.id
        order_status = linkedOrder.status
      }
    }
    
    // Fallback: search by matching criteria for completed payments (legacy flow)
    if (!order_id && session.status === 'completed') {
      console.log(`🔍 Searching for order by matching criteria...`)
      const fiveMinutesAfterSession = new Date(
        new Date(session.created_at).getTime() + 5 * 60 * 1000
      ).toISOString()
      
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, payment_status')
        .eq('user_id', userProfile.id)
        .eq('total_amount', session.amount)
        .eq('payment_status', 'paid')
        .gte('created_at', session.created_at)
        .lte('created_at', fiveMinutesAfterSession)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (order) {
        order_id = order.id
        order_status = order.status
      }
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      order_id,
      order_status,
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
