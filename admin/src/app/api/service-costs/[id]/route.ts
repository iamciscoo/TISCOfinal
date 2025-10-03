import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

// GET /api/service-costs/[id]
// Returns cost header and items for a given service booking (id = booking_id)
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

      const { data: cost, error } = await supabase
      .from("service_booking_costs")
      .select(`*, service_booking_cost_items(*)`)
      .eq("booking_id", id)
      .single();

    // If table doesn't exist yet (migration not applied), return sensible defaults
    if (error) {
      const msg = String(error.message || "");
      if (
        error.code === "PGRST116" ||
        msg.includes("Could not find the table") ||
        msg.toLowerCase().includes("schema cache") ||
        msg.includes("relation") && msg.includes("does not exist")
      ) {
        return NextResponse.json({
          data: {
            id: null,
            booking_id: id,
            service_fee: 0,
            discount: 0,
            tax: 0,
            currency: "TZS",
            subtotal: 0,
            total: 0,
            notes: null,
            items: [],
          },
        }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!cost) {
      // Return sensible defaults so UI can render an empty editor
      return NextResponse.json({
        data: {
          id: null,
          booking_id: id,
          service_fee: 0,
          discount: 0,
          tax: 0,
          currency: "TZS",
          subtotal: 0,
          total: 0,
          notes: null,
          items: [],
        },
      }, { status: 200 });
    }

    // Transform the data to match expected structure in GET response
    const transformedCost = {
      ...cost,
      items: cost.service_booking_cost_items || []
    };
    
    return NextResponse.json({ data: transformedCost }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/service-costs/[id]
// Upserts the cost header + replaces items for a booking, recalculates totals,
// and updates service_bookings.total_amount accordingly.
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await context.params;
    if (!bookingId) {
      return NextResponse.json({ error: "Missing 'id' parameter" }, { status: 400 });
    }

    interface CostItemInput { name: string; unit_price: number; quantity: number; unit?: string }
    const body = await req.json().catch(() => ({} as Partial<{
      service_fee: number;
      discount: number;
      tax: number;
      currency: string;
      notes: string | null;
      items: Array<CostItemInput>;
    }>));

    const service_fee = Number(body.service_fee ?? 0) || 0;
    const discount = Number(body.discount ?? 0) || 0;
    const tax = Number(body.tax ?? 0) || 0;
    const currency = (body.currency || "TZS").toString().slice(0, 3).toUpperCase();
    const notes = body.notes ?? null;
    const items: CostItemInput[] = Array.isArray(body.items) ? body.items : [];

    // Basic validation
    for (const it of items) {
      if (!it || typeof it.name !== "string" || it.name.trim().length === 0) {
        return NextResponse.json({ error: "Each item requires a non-empty name" }, { status: 400 });
      }
      const up = Number(it.unit_price);
      const qty = Number(it.quantity);
      if (!(up >= 0) || !(qty > 0)) {
        return NextResponse.json({ error: "Invalid item unit_price or quantity" }, { status: 400 });
      }
    }

    // 1) Get or create the header row for this booking
    const { data: existingCost, error: fetchErr } = await supabase
      .from("service_booking_costs")
      .select("id")
      .eq("booking_id", bookingId)
      .single();

    if (fetchErr && fetchErr.code !== "PGRST116") {
      const msg = String(fetchErr.message || "");
      if (
        msg.includes("Could not find the table") ||
        msg.toLowerCase().includes("schema cache") ||
        msg.includes("relation") && msg.includes("does not exist")
      ) {
        return NextResponse.json({
          error: "Service booking costs feature not initialized. Please apply the migration '2025-08-25_service_booking_costs.sql' to your Supabase database.",
        }, { status: 409 });
      }
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    let costId: string | null = existingCost?.id ?? null;
    if (!costId) {
      const { data: inserted, error: insertErr } = await supabase
        .from("service_booking_costs")
        .insert({
          booking_id: bookingId,
          service_fee,
          discount,
          tax,
          currency,
          subtotal: 0,
          total: 0,
          notes,
        })
        .select("id")
        .single();
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
      costId = inserted.id;
    } else {
      // Update editable header fields (totals will be set later)
      const { error: updErr } = await supabase
        .from("service_booking_costs")
        .update({ service_fee, discount, tax, currency, notes })
        .eq("id", costId);
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // 2) Replace items for the cost
    //    (simple approach to avoid complex diffing; suitable for admin use)
    const { error: delErr } = await supabase
      .from("service_booking_cost_items")
      .delete()
      .eq("cost_id", costId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    if (items.length > 0) {
      const payload = items.map((it: CostItemInput) => ({
        cost_id: costId,
        name: it.name.trim(),
        unit_price: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 0,
        unit: (it.unit || "unit").toString().slice(0, 50),
      }));
      const { error: insErr } = await supabase
        .from("service_booking_cost_items")
        .insert(payload);
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // 3) Recalculate totals
    const subtotal = items.reduce((sum: number, it: CostItemInput) => sum + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0), 0);
    const total = Math.max(0, subtotal + service_fee + tax - discount);

    // 4) Persist totals on header and mirror onto booking.total_amount
    const { error: updTotalErr } = await supabase
      .from("service_booking_costs")
      .update({ subtotal, total })
      .eq("id", costId);
    if (updTotalErr) return NextResponse.json({ error: updTotalErr.message }, { status: 500 });

    const { error: updBookingErr } = await supabase
      .from("service_bookings")
      .update({ total_amount: total, updated_at: new Date().toISOString() })
      .eq("id", bookingId);
    if (updBookingErr) return NextResponse.json({ error: updBookingErr.message }, { status: 500 });

    // 5) Return new state
    const { data: cost, error: retErr } = await supabase
      .from("service_booking_costs")
      .select(`*, service_booking_cost_items(*)`)
      .eq("id", costId)
      .single();
    if (retErr) return NextResponse.json({ error: retErr.message }, { status: 500 });

    // Revalidate booking-related caches to sync list and edit pages
    try {
      revalidateTag('service-bookings');
      revalidateTag('admin:service-bookings');
      revalidateTag(`service-booking:${bookingId}`);
    } catch {}

    // Transform the data to match expected structure in PATCH response
    const transformedCost = {
      ...cost,
      items: cost.service_booking_cost_items || []
    };
    
    return NextResponse.json({ data: transformedCost }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
