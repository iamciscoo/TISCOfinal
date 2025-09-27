import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'
import { notifyPaymentSuccess } from '@/lib/notifications/service'

// Add CORS headers for cross-origin requests from admin
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type Params = { params: Promise<{ id: string }> }

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return addCorsHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    }

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
      return addCorsHeaders(NextResponse.json({ error: 'Order not found' }, { status: 404 }))
    }

    // Check if order is already paid
    if (orderData.payment_status === 'paid') {
      return addCorsHeaders(NextResponse.json({ error: 'Order is already marked as paid' }, { status: 400 }))
    }

    // Get customer details
    const { data: userData } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('auth_user_id', orderData.user_id)
      .single()

    if (!userData?.email) {
      return addCorsHeaders(NextResponse.json({ error: 'Customer not found' }, { status: 404 }))
    }

    const customerName = userData.first_name && userData.last_name 
      ? `${userData.first_name} ${userData.last_name}` 
      : 'Customer'

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
      return addCorsHeaders(NextResponse.json({ error: updateError.message }, { status: 500 }))
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

    // Send customer payment success notification
    try {
      await notifyPaymentSuccess({
        order_id: id,
        customer_email: userData.email,
        customer_name: customerName,
        amount: orderData.total_amount?.toString() || '0',
        currency: orderData.currency || 'TZS',
        payment_method: 'Office Payment - Confirmed',
        transaction_id: `OFFICE_${id.slice(0, 8)}_${Date.now()}`
      })
      console.log('Customer payment success notification sent')
    } catch (emailError) {
      console.warn('Failed to send customer payment success notification:', emailError)
    }

    // Note: Admin was already notified when order was initially created
    // This is just a payment status update, no need for duplicate admin notification

    // Invalidate caches
    try {
      revalidateTag('orders')
      revalidateTag('admin:orders')
      revalidateTag(`order:${id}`)
      revalidateTag(`user-orders:${orderData.user_id}`)
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e)
    }

    return addCorsHeaders(NextResponse.json({ 
      order: updatedOrder,
      message: 'Order marked as paid and notifications sent'
    }, { status: 200 }))

  } catch (error: unknown) {
    console.error('Mark order as paid error:', error)
    return addCorsHeaders(NextResponse.json(
      { error: (error as Error).message || 'Failed to mark order as paid' },
      { status: 500 }
    ))
  }
}
