import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from "next/cache";

export const runtime = 'nodejs';


type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('service_bookings')
      .select(`
        id, status, payment_status, preferred_date, preferred_time, notes, created_at, updated_at, total_amount,
        service_id, user_id, service_type, description, contact_email, contact_phone, customer_name,
        service:services(id, title),
        user:users(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as Partial<{
      scheduled_date: string | null;
      preferred_date: string | null;
      preferred_time: string | null;
      notes: string | null;
      total_amount: number | null;
      status: BookingStatus;
      payment_status: PaymentStatus;
    }>));

    const updates: Record<string, unknown> = {};
    
    // Handle scheduled_date conversion to preferred_date/preferred_time
    if ('scheduled_date' in body && body.scheduled_date) {
      const scheduledDate = new Date(body.scheduled_date);
      if (!isNaN(scheduledDate.getTime())) {
        updates.preferred_date = scheduledDate.toISOString().split('T')[0]; // YYYY-MM-DD
        updates.preferred_time = scheduledDate.toTimeString().split(' ')[0]; // HH:MM:SS
      }
    }
    
    // Handle direct preferred_date/preferred_time updates
    if ('preferred_date' in body) updates.preferred_date = body.preferred_date;
    if ('preferred_time' in body) updates.preferred_time = body.preferred_time;
    if ('notes' in body) updates.notes = body.notes;
    if ('status' in body) updates.status = body.status;
    if ('payment_status' in body) updates.payment_status = body.payment_status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('service_bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const msg = String(error.message || '').toLowerCase();
      // Gracefully handle missing column if migration not applied yet
      if (msg.includes('column') && msg.includes('payment_status') && msg.includes('does not exist')) {
        return NextResponse.json(
          {
            error: 'Migration required: add payment_status column to service_bookings.',
            hint:
              'Run the migration that adds payment_status to service_bookings (e.g. 2025-08-26_service_booking_payment_status.sql) and try again.',
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Revalidate caches for service bookings
    try {
      revalidateTag('service-bookings');
      revalidateTag('admin:service-bookings');
      revalidateTag(`service-booking:${id}`);
      if ((data as any)?.user_id) {
        revalidateTag(`user-service-bookings:${(data as any).user_id}`);
      }
    } catch {}
    return NextResponse.json({ data }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    // Best-effort cleanup of related cost records (if feature enabled)
    try {
      const { data: costs } = await supabase
        .from('service_booking_costs')
        .select('id')
        .eq('booking_id', id)
      const costIds = (costs || []).map((c: any) => c.id).filter(Boolean)
      if (costIds.length > 0) {
        await supabase.from('service_booking_cost_items').delete().in('cost_id', costIds)
        await supabase.from('service_booking_costs').delete().eq('booking_id', id)
      }
    } catch (e) {
      // Swallow errors if tables do not exist or cleanup fails; deletion of booking proceeds
      // Console only (non-fatal)
      console.warn('Service booking cost cleanup warning:', e)
    }

    const { error } = await supabase
      .from('service_bookings')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    try {
      revalidateTag('service-bookings');
      revalidateTag('admin:service-bookings');
      revalidateTag(`service-booking:${id}`);
    } catch {}
    return new Response(null, { status: 204 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
