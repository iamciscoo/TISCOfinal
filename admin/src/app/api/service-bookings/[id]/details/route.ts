import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Fetch booking details with related service and user data
    const { data: booking, error: bookingError } = await supabase
      .from("service_bookings")
      .select(`
        id,
        service_id,
        user_id,
        service_type,
        description,
        preferred_date,
        preferred_time,
        contact_email,
        contact_phone,
        customer_name,
        status,
        notes,
        created_at,
        updated_at,
        total_amount,
        payment_status,
        services:service_id (
          id,
          title,
          description,
          features,
          duration,
          image,
          gallery,
          created_at,
          updated_at
        ),
        users:user_id (
          id,
          email,
          first_name,
          last_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country,
          created_at
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Service booking not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    // Fetch any service costs associated with this booking
    const { data: serviceCosts, error: costsError } = await supabase
      .from("service_booking_costs")
      .select(`
        id,
        service_fee,
        discount,
        tax,
        currency,
        subtotal,
        total,
        notes,
        created_at,
        updated_at,
        service_booking_cost_items(
          id,
          name,
          description,
          unit_price,
          quantity,
          unit,
          created_at
        )
      `)
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (costsError) {
      console.warn("Failed to fetch service costs:", costsError);
    }

    return NextResponse.json({
      data: {
        booking,
        serviceCosts: serviceCosts || []
      }
    });

  } catch (error) {
    console.error("Service booking details error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
