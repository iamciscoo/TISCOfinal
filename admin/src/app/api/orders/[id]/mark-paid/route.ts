import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  
  try {
    console.log('Admin marking order as paid:', id)
    
    // Get the order with customer details
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          products(name, price)
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !orderData) {
      console.error('Order not found:', fetchError)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order is already paid
    if (orderData.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order is already marked as paid' }, { status: 400 })
    }

    // Get customer details (handle both registered and guest customers)
    let customerEmail: string
    let customerName: string
    
    if (orderData.user_id) {
      // Registered customer - fetch from users table
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('auth_user_id', orderData.user_id)
        .single()

      if (!userData?.email) {
        console.error('Registered customer not found for order:', id)
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
      }

      customerEmail = userData.email
      customerName = userData.first_name && userData.last_name 
        ? `${userData.first_name} ${userData.last_name}` 
        : 'Customer'
    } else {
      // Guest customer - use guest fields from order
      if (!orderData.customer_email && !orderData.customer_name) {
        console.error('Guest customer information missing for order:', id)
        return NextResponse.json({ error: 'Customer information missing' }, { status: 404 })
      }

      customerEmail = orderData.customer_email || 'no-email@guest.order'
      customerName = orderData.customer_name || 'Guest Customer'
    }

    // Update order payment status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Create payment transaction record
    await supabase
      .from('payment_transactions')
      .insert({
        order_id: id,
        user_id: orderData.user_id,
        amount: orderData.total_amount,
        currency: orderData.currency || 'TZS',
        status: 'completed',
        payment_type: 'office_payment',
        provider: 'office',
        transaction_reference: `OFFICE_${id.slice(0, 8)}_${Date.now()}`,
        completed_at: new Date().toISOString()
      })

    console.log('Order updated successfully, sending notifications...')

    // Send payment success notification using client backend notification service
    try {
      const notificationData = {
        order_id: id,
        customer_email: customerEmail,
        customer_name: customerName,
        amount: orderData.total_amount?.toString() || '0',
        currency: orderData.currency || 'TZS',
        payment_method: 'Office Payment - Confirmed',
        transaction_id: `OFFICE_${id.slice(0, 8)}_${Date.now()}`
      }

      // Create notification record in database
      await supabase
        .from('notifications')
        .insert({
          event: 'payment_success',
          recipient_email: customerEmail,
          recipient_name: customerName,
          subject: 'Payment Confirmed - Order Processing',
          content: `Your payment for order #${id.slice(0, 8)} has been confirmed. Order is now processing.`,
          metadata: notificationData,
          status: 'pending'
        })

      console.log('✅ Payment success notification queued')

      // Trigger notification processing on client backend
      try {
        const processResponse = await fetch('https://tiscomarket.store/api/notifications/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (processResponse.ok) {
          const processResult = await processResponse.json()
          console.log('📬 Notification processing triggered:', processResult)
        } else {
          console.warn('⚠️ Failed to trigger notification processing')
        }
      } catch (processError) {
        console.warn('⚠️ Could not trigger notification processing:', processError)
      }
    } catch (emailError) {
      console.error('❌ Failed to queue payment success notification:', emailError)
      // Don't fail the operation if email fails
    }

    return NextResponse.json({ 
      order: updatedOrder,
      message: 'Order marked as paid and customer notified'
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Mark order as paid error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to mark order as paid' },
      { status: 500 }
    )
  }
}
