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
        payment_type: 'direct_pay',
        provider: 'direct_pay',
        transaction_reference: `OFFICE_${id.slice(0, 8)}_${Date.now()}`,
        completed_at: new Date().toISOString()
      })

    console.log('Order updated successfully, sending payment confirmation email...')

    // Send payment success notification email to customer
    try {
      const notificationPayload = {
        event: 'payment_success',
        recipient_email: customerEmail,
        recipient_name: customerName,
        data: {
          order_id: id,
          customer_email: customerEmail,
          customer_name: customerName,
          amount: orderData.total_amount?.toString() || '0',
          currency: orderData.currency || 'TZS',
          payment_method: 'Direct Payment - Confirmed by Admin',
          transaction_id: `OFFICE_${id.slice(0, 8)}_${Date.now()}`,
          order_items: orderData.order_items?.map((item: any) => ({
            name: item.products?.name || 'Product',
            quantity: item.quantity,
            price: item.price
          })) || []
        }
      }

      // Send notification via client backend API
      const clientApiUrl = process.env.NEXT_PUBLIC_CLIENT_URL || 'https://tiscomarket.store'
      const notificationResponse = await fetch(`${clientApiUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationPayload)
      })

      if (notificationResponse.ok) {
        const notificationResult = await notificationResponse.json()
        console.log('✅ Payment confirmation email sent successfully:', notificationResult)
      } else {
        const errorText = await notificationResponse.text()
        console.error('❌ Failed to send payment confirmation email:', errorText)
      }
    } catch (emailError) {
      console.error('❌ Error sending payment confirmation email:', emailError)
      // Don't fail the order update if email fails - email is nice-to-have
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
