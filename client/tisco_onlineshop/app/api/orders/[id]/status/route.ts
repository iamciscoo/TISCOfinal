import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type Params = {
  params: {
    id: string
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, reason } = await req.json()

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Validate status values
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // First, get the current order to check ownership and current status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status, order_items(*)')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns the order (for customer updates) or skip for admin
    if (currentOrder.user_id !== user.id) {
      // For now, only allow users to update their own orders
      // TODO: Add admin role checking here
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Validate status transitions
    const currentStatus = currentOrder.status
    const allowedTransitions: Record<string, string[]> = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [], // No further transitions
      'cancelled': [] // No further transitions
    }

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json({ 
        error: `Cannot change status from ${currentStatus} to ${status}` 
      }, { status: 400 })
    }

    // Handle stock restoration for cancelled orders
    if (status === 'cancelled' && currentStatus !== 'cancelled') {
      for (const item of currentOrder.order_items) {
        await supabase.rpc('restore_product_stock', {
          product_id: item.product_id,
          quantity: item.quantity
        })
      }
    }

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status,
        ...(reason && { notes: reason }),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // TODO: Send notification email/SMS about status change
    // TODO: Add order history/audit log entry

    return NextResponse.json({ 
      order,
      message: `Order status updated to ${status}` 
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Order status update error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to update order status' },
      { status: 500 }
    )
  }
}
