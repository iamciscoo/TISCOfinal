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

    const body = await req.json().catch(() => ({} as Partial<{ status: OrderStatus; reason?: string } >));
    const status = body.status;

    const allowed: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid or missing 'status'" }, { status: 400 });
    }

    // Fetch current order to validate transition and handle inventory
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status, order_items(*)')
      .eq('id', id)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate status transitions for admin to prevent impossible states
    const currentStatus = (currentOrder as { status: OrderStatus }).status;
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'processing', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot change status from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Restore stock when cancelling an order
    if (status === 'cancelled' && currentStatus !== 'cancelled' && Array.isArray((currentOrder as any).order_items)) {
      for (const item of (currentOrder as any).order_items as Array<{ product_id: string | number; quantity: number }>) {
        try {
          await supabase.rpc('restore_product_stock', {
            product_id: item.product_id,
            quantity: item.quantity,
          });
        } catch (e) {
          console.warn('Stock restore rpc failed:', e);
        }
      }
    }

    const updates: Record<string, unknown> = {
      status,
      ...(body.reason ? { notes: body.reason } : {}),
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
      revalidateTag('orders');
      revalidateTag('admin:orders');
      revalidateTag(`order:${id}`);
      const orderData = data as Record<string, unknown> & { user_id?: string }
      if (orderData?.user_id) {
        revalidateTag(`user-orders:${orderData.user_id}`);
      }
      // Payments caches may depend on order status
      revalidateTag('payments');
    } catch (e) {
      console.warn('Revalidation error (non-fatal):', e);
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

