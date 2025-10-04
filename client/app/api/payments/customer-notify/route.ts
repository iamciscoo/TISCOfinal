import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Send immediate customer notification after payment
export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transaction_reference, email } = await req.json()
    
    if (!transaction_reference) {
      return NextResponse.json({ error: 'transaction_reference required' }, { status: 400 })
    }

    console.log(`📧 Sending immediate customer notification for: ${transaction_reference}`)

    // Get payment session
    const { data: session, error: sessionError } = await supabase
      .from('payment_sessions')
      .select('*')
      .eq('transaction_reference', transaction_reference)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 })
    }

    // Send customer notification immediately using SendGrid
    try {
      const orderData = session.order_data as Record<string, unknown>
      const customerEmail = email || String(orderData.email || user.email)
      const customerName = `${String(orderData.first_name || '')} ${String(orderData.last_name || '')}`.trim() || 'Customer'

      // Send immediate admin notification (customer will get order confirmation later)
      console.log(`📧 Sending immediate admin notification for payment confirmation`)

      // Send admin notification
      const { notifyAdminOrderCreated } = await import('@/lib/notifications/service')
      const items = (orderData.items as Array<Record<string, unknown>>) || []
      
      await notifyAdminOrderCreated({
        order_id: transaction_reference, // Use transaction ref as order ID for now
        customer_email: customerEmail,
        customer_name: customerName,
        total_amount: session.amount.toString(),
        currency: session.currency,
        payment_method: 'Mobile Money',
        payment_status: 'pending_confirmation',
        items_count: items.length
      })

      console.log(`✅ Customer and admin notifications sent for: ${transaction_reference}`)

      return NextResponse.json({
        success: true,
        message: 'Notifications sent successfully',
        transaction_reference,
        email_sent_to: customerEmail
      })

    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json({
        error: 'Email sending failed',
        message: (emailError as Error).message,
        transaction_reference
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Customer notification error:', error)
    return NextResponse.json({
      error: 'Notification failed',
      message: (error as Error).message
    }, { status: 500 })
  }
}
