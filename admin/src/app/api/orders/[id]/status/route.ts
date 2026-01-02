import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from "next/cache";

export const runtime = 'nodejs';


type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Partial<{ status: OrderStatus; reason?: string }>));
    const status = body.status;

    const allowedStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid or missing 'status'" }, { status: 400 });
    }

    // Fetch current order to validate transition and handle inventory
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status, notes, order_items(*)')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate status transitions for admin: allow forward-only transitions and cancel from any non-final state
    const currentStatus = (currentOrder as { status: OrderStatus }).status;
    const orderRank: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
      cancelled: 5, // treat cancelled as terminal
    }
    const isForward = (a: OrderStatus, b: OrderStatus) => orderRank[b] >= orderRank[a]
    const isTerminal = (s: OrderStatus) => s === 'delivered' || s === 'cancelled'

    const canTransition = (
      (status === 'cancelled' && !isTerminal(currentStatus)) ||
      (!isTerminal(currentStatus) && status !== 'cancelled' && isForward(currentStatus, status))
    )

    if (!canTransition) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Inventory policy: decrement stock and set delivered atomically via RPC
    let deliveredViaRpc = false
    if (status === 'delivered' && !isTerminal(currentStatus)) {
      const { error: deliverErr } = await supabase.rpc('deliver_order', { p_order_id: id })
      if (deliverErr) {
        return NextResponse.json({ error: `Failed to deliver order: ${deliverErr.message}` }, { status: 500 });
      }
      deliveredViaRpc = true
    }

    // Compose notes: preserve existing notes, append admin reason and any stock warnings
    const existingNotes = (currentOrder as any)?.notes as string | null | undefined
    const reasonText = body.reason ? String(body.reason) : ''
    const combinedNotes = `${(existingNotes || '').trim()}${existingNotes ? '\n' : ''}${reasonText}`.trim()

    const updates: Record<string, unknown> = deliveredViaRpc
      ? {
        ...(combinedNotes ? { notes: combinedNotes } : {}),
        updated_at: new Date().toISOString(),
      }
      : {
        status,
        ...(combinedNotes ? { notes: combinedNotes } : {}),
        updated_at: new Date().toISOString(),
      };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Invalidate caches for orders across admin and client
    try {
      revalidateTag('orders', 'default');
      revalidateTag('admin:orders', 'default');
      revalidateTag(`order:${id}`, 'default');
      const orderData = data as Record<string, unknown> & { user_id?: string }
      if (orderData?.user_id) {
        revalidateTag(`user-orders:${orderData.user_id}`, 'default');
      }
      // Payments caches may depend on order status
      revalidateTag('payments', 'default');
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e);
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

