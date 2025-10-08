import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from 'next/cache';
export const runtime = 'nodejs';


export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Partial<{
      status: string
      payment_status: string
      payment_method: string | null
      shipping_address: unknown
      notes: string | null
      currency: string
      total_amount: number
      shipping_amount: number
      tax_amount: number
      tracking_number: string | null
    }>));

    const allowedFields = [
      "status",
      "payment_status",
      "payment_method",
      "shipping_address",
      "notes",
      "currency",
      "total_amount",
      "shipping_amount",
      "tax_amount",
      "tracking_number",
    ] as const;

    const allowedPaymentStatuses = new Set([
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded',
    ])

    const updates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updates[key] = body[key as keyof typeof body];
    }
    // Validate and normalize payment_status changes
    if ('payment_status' in updates) {
      const ps = String(updates['payment_status'])
      if (!allowedPaymentStatuses.has(ps)) {
        return NextResponse.json(
          { error: "Invalid 'payment_status' value" },
          { status: 400 }
        )
      }
      const nowIso = new Date().toISOString()
      if (ps === 'paid') {
        // Auto-promote order status to processing if not explicitly provided (canonical post-payment state)
        if (!('status' in updates)) updates['status'] = 'processing'
        // Ensure paid_at is set when marking as paid
        const updatesWithPaidAt = updates as Record<string, unknown> & { paid_at?: string }
        updatesWithPaidAt['paid_at'] = updatesWithPaidAt['paid_at'] ?? nowIso
      } else if (ps === 'failed' || ps === 'cancelled') {
        // Clear paid_at for non-successful states unless explicitly set
        const updatesWithPaidAt = updates as Record<string, unknown> & { paid_at?: string | null }
        updatesWithPaidAt['paid_at'] = null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    let data: unknown | null = null
    const firstAttempt = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (firstAttempt.error) {
      let code: string | undefined
      let message = ''
      try {
        const errObj = firstAttempt.error as { code?: string; message?: string }
        code = errObj?.code
        message = errObj?.message ?? ''
      } catch {}
      const missingPaidAt = code === '42703' || /paid_at.*does not exist/i.test(message)
      const paymentStatusConstraint = code === '23514' || /payment_status.*check/i.test(message) || /violates.*check constraint/i.test(message)
      const paymentStatusEnumInvalid = code === '22P02' || /invalid input value for enum/i.test(message)
      if (missingPaidAt) {
        const updatesRetry: Record<string, unknown> = { ...updates }
        delete updatesRetry['paid_at']
        const retry = await supabase
          .from('orders')
          .update(updatesRetry)
          .eq('id', id)
          .select()
          .single()
        if (retry.error) {
          // If paid_at retry still fails, check for missing payment_status and fallback to status-only update
          let code2: string | undefined
          let message2 = ''
          try {
            const errObj2 = retry.error as { code?: string; message?: string }
            code2 = errObj2?.code
            message2 = errObj2?.message ?? ''
          } catch {}
          const missingPaymentStatus2 = code2 === '42703' || /payment_status.*does not exist/i.test(message2)
          const paymentStatusConstraint2 = code2 === '23514' || /payment_status.*check/i.test(message2) || /violates.*check constraint/i.test(message2)
          const paymentStatusEnumInvalid2 = code2 === '22P02' || /invalid input value for enum/i.test(message2)
          if (missingPaymentStatus2 || paymentStatusConstraint2 || paymentStatusEnumInvalid2) {
            const statusOnly: Record<string, unknown> = {}
            // Ensure order status is updated to processing at minimum
            statusOnly['status'] = (updates['status'] as string) || 'processing'
            statusOnly['updated_at'] = new Date().toISOString()
            const final = await supabase
              .from('orders')
              .update(statusOnly)
              .eq('id', id)
              .select()
              .single()
            if (final.error) {
              return NextResponse.json({ error: final.error.message }, { status: 500 })
            }
            data = final.data
            // Return success but include a warning about schema
            try {
              revalidateTag('admin:orders');
              revalidateTag('orders');
              revalidateTag(`order:${id}`);
              const orderData = data as Record<string, unknown> & { user_id?: string }
              if (orderData?.user_id) revalidateTag(`user-orders:${orderData.user_id}`);
              revalidateTag('payments');
            } catch {}
            return NextResponse.json({ data, warning: "orders.payment_status issue (missing/constraint/enum). Only order status was updated. Please run the migration 2025-08-27_orders_payment_status_unify.sql to add/align 'payment_status' and 'paid_at'." }, { status: 200 })
          }
          return NextResponse.json({ error: retry.error.message }, { status: 500 })
        }
        data = retry.data
      } else {
        // If first attempt fails due to payment_status issues, fallback to status-only update
        const missingPaymentStatus1 = code === '42703' || /payment_status.*does not exist/i.test(message)
        if (missingPaymentStatus1 || paymentStatusConstraint || paymentStatusEnumInvalid) {
          const statusOnly: Record<string, unknown> = {}
          statusOnly['status'] = (updates['status'] as string) || 'processing'
          statusOnly['updated_at'] = new Date().toISOString()
          const final = await supabase
            .from('orders')
            .update(statusOnly)
            .eq('id', id)
            .select()
            .single()
          if (final.error) {
            return NextResponse.json({ error: final.error.message }, { status: 500 })
          }
          data = final.data
          // We will continue to return success with a warning later
        } else {
          return NextResponse.json({ error: firstAttempt.error.message }, { status: 500 })
        }
      }
    } else {
      data = firstAttempt.data
    }

    // Revalidate caches so client account reflects admin updates immediately
    try {
      revalidateTag('admin:orders');
      revalidateTag('orders');
      revalidateTag(`order:${id}`);
      const orderData = data as Record<string, unknown> & { user_id?: string }
      if (orderData?.user_id) revalidateTag(`user-orders:${orderData.user_id}`);
      // Payments caches
      revalidateTag('payments');
    } catch (e) {
      console.warn('Admin revalidation warning:', e);
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // Delete related records first due to foreign key constraints
    // 1. Delete order_items
    const { error: itemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", id);
    
    if (itemsError) {
      console.error('Failed to delete order_items:', itemsError);
      return NextResponse.json({ 
        error: `Failed to delete order items: ${itemsError.message}` 
      }, { status: 500 });
    }

    // 2. Delete payment_sessions (if any)
    const { error: sessionsError } = await supabase
      .from("payment_sessions")
      .delete()
      .eq("order_id", id);
    
    if (sessionsError) {
      console.error('Failed to delete payment_sessions:', sessionsError);
      // Continue even if this fails - might not exist
    }

    // 3. Delete payment_transactions (if any)
    const { error: transactionsError } = await supabase
      .from("payment_transactions")
      .delete()
      .eq("order_id", id);
    
    if (transactionsError) {
      console.error('Failed to delete payment_transactions:', transactionsError);
      // Continue even if this fails - might not exist
    }

    // 4. Finally delete the order itself
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error('Failed to delete order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Successfully deleted order ${id} and all related records`);

    // Revalidate broad tags after deletion (order-specific and list caches)
    try {
      revalidateTag('admin:orders');
      revalidateTag('orders');
      revalidateTag(`order:${id}`);
    } catch (e) {
      console.warn('Admin revalidation warning:', e);
    }
    return new Response(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error('Delete order error:', e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

