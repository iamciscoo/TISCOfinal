import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Fetch booking details using correct foreign key constraint names
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
        services!fk_service_bookings_service_id (
          id,
          title,
          description,
          features,
          duration,
          image
        ),
        users!fk_service_bookings_user_id (
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
          country
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError) {
      console.error('Booking fetch error details:', {
        code: bookingError.code,
        message: bookingError.message,
        details: (bookingError as any).details,
        hint: (bookingError as any).hint
      });
      
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Service booking not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: `Database error: ${bookingError.message}` },
        { status: 500 }
      );
    }
    
    if (!booking) {
      console.error('No booking data returned for ID:', bookingId);
      return NextResponse.json(
        { error: "Service booking not found" },
        { status: 404 }
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

    // Normalize service costs - take the most recent one if multiple exist
    let latestServiceCost = null;
    try {
      if (serviceCosts && serviceCosts.length > 0) {
        const costData = serviceCosts[0];
        latestServiceCost = {
          id: costData.id,
          service_fee: costData.service_fee || 0,
          discount: costData.discount || 0,
          currency: costData.currency || 'TZS',
          subtotal: costData.subtotal || 0,
          total: costData.total || 0,
          notes: costData.notes || null,
          items: Array.isArray(costData.service_booking_cost_items) 
            ? costData.service_booking_cost_items.map((item: any) => ({
                id: item.id,
                name: item.name,
                unit_price: item.unit_price,
                quantity: item.quantity,
                unit: item.unit
              }))
            : []
        };

        console.log('Admin API: Service costs normalized:', {
          bookingId: bookingId,
          hasServiceCosts: true,
          itemsCount: latestServiceCost.items.length,
          subtotal: latestServiceCost.subtotal,
          serviceFee: latestServiceCost.service_fee,
          discount: latestServiceCost.discount,
          total: latestServiceCost.total
        });
      } else {
        console.log('Admin API: No service costs found for booking:', bookingId);
      }
    } catch (costErr) {
      console.error('Error normalizing service costs:', costErr);
      // Continue without costs if there's an error
    }

    // Normalize booking data
    const normalizedBooking = {
      ...booking,
      services: Array.isArray(booking.services) 
        ? (booking.services[0] || null) 
        : (booking.services || null),
      users: booking.users 
        ? (Array.isArray(booking.users) ? booking.users[0] : booking.users)
        : undefined
    };

    console.log('Admin API: Returning booking details:', {
      bookingId: normalizedBooking.id,
      hasService: !!normalizedBooking.services,
      serviceTitle: normalizedBooking.services?.title,
      hasUser: !!normalizedBooking.users,
      userName: normalizedBooking.users ? `${normalizedBooking.users.first_name} ${normalizedBooking.users.last_name}` : 'N/A',
      hasCosts: !!latestServiceCost,
      itemsCount: latestServiceCost?.items?.length || 0,
      subtotal: latestServiceCost?.subtotal,
      serviceFee: latestServiceCost?.service_fee,
      discount: latestServiceCost?.discount,
      total: latestServiceCost?.total || normalizedBooking.total_amount
    });

    return new NextResponse(
      JSON.stringify({
        booking: normalizedBooking,
        serviceCosts: latestServiceCost
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          // Ensure no caching so latest service costs are returned immediately after save
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error("Service booking details error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return new NextResponse(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
