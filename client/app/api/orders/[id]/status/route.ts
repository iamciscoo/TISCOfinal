import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidateTag } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type CurrentOrderRow = {
  user_id: string
  status: OrderStatus
  notes?: string | null
  order_items?: Array<{ product_id: string | number; quantity: number }>
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      .select('user_id, status, notes, order_items(*)')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns the order (for customer updates) or skip for admin
    const orderRow = currentOrder as CurrentOrderRow
    if (orderRow.user_id !== user.id) {
      // For now, only allow users to update their own orders
      // TODO: Add admin role checking here
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Validate status transitions (customer cannot mark as paid; that is done via webhook)
    const currentStatus = orderRow.status
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

    // Inventory policy: decrement stock and set delivered atomically via RPC
    let deliveredViaRpc = false
    if (status === 'delivered' && currentStatus !== 'delivered') {
      const { error: deliverErr } = await supabase.rpc('deliver_order', { p_order_id: id })
      if (deliverErr) {
        return NextResponse.json({ error: `Failed to deliver order: ${deliverErr.message}` }, { status: 500 })
      }
      deliveredViaRpc = true
    }

    // Compose notes and update accordingly. If delivered via RPC, do not update status again.
    const existingNotes = orderRow.notes
    const combinedNotes = reason
      ? `${(existingNotes || '').trim()}${existingNotes ? '\n' : ''}${String(reason)}`.trim()
      : (existingNotes || '')

    const updatePayload = deliveredViaRpc
      ? { ...(combinedNotes ? { notes: combinedNotes } : {}), updated_at: new Date().toISOString() }
      : { status, ...(combinedNotes ? { notes: combinedNotes } : {}), updated_at: new Date().toISOString() }

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // TODO: Send notification email/SMS about status change
    // TODO: Add order history/audit log entry

    // Invalidate caches across client and admin
    try {
      revalidateTag('orders')
      revalidateTag('admin:orders')
      revalidateTag(`order:${id}`)
      revalidateTag(`user-orders:${user.id}`)
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e)
    }

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
