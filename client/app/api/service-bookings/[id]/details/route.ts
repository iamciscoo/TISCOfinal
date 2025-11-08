import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const bookingId = resolvedParams.id

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Get user session to verify ownership
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    const refreshToken = cookieStore.get('sb-refresh-token')?.value

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await authClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    })

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch booking details with user ownership verification
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
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
        services!service_bookings_service_id_fkey (
          id,
          title,
          description,
          features,
          duration,
          image
        ),
        users!service_bookings_user_id_fkey (
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
      .eq('id', bookingId)
      .eq('user_id', user.id) // Ensure user owns this booking
      .single()

    if (bookingError) {
      console.error('Booking fetch error:', bookingError)
      
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service booking not found or access denied' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Database error: ${bookingError.message}` },
        { status: 500 }
      )
    }
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Service booking not found or access denied' },
        { status: 404 }
      )
    }

    // Fetch service costs associated with this booking
    const { data: serviceCosts, error: costsError } = await supabase
      .from('service_booking_costs')
      .select(`
        id,
        service_fee,
        discount,
        currency,
        subtotal,
        total,
        notes,
        service_booking_cost_items(
          id,
          name,
          unit_price,
          quantity,
          unit
        )
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })

    if (costsError) {
      console.warn('Failed to fetch service costs:', costsError)
    }

    // Normalize service costs - take the most recent one if multiple exist
    let latestServiceCost = null
    try {
      if (serviceCosts && serviceCosts.length > 0) {
        const costData = serviceCosts[0]
        latestServiceCost = {
          id: costData.id,
          service_fee: costData.service_fee || 0,
          discount: costData.discount || 0,
          currency: costData.currency || 'TZS',
          subtotal: costData.subtotal || 0,
          total: costData.total || 0,
          notes: costData.notes || null,
          items: Array.isArray(costData.service_booking_cost_items) 
            ? costData.service_booking_cost_items 
            : []
        }
      }
    } catch (costErr) {
      console.error('Error normalizing service costs:', costErr)
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
    }

    console.log('Returning booking details for user:', {
      bookingId: normalizedBooking.id,
      userId: user.id,
      hasService: !!normalizedBooking.services,
      hasUser: !!normalizedBooking.users,
      hasCosts: !!latestServiceCost,
      itemsCount: latestServiceCost?.items?.length || 0
    })

    return NextResponse.json({
      booking: normalizedBooking,
      serviceCosts: latestServiceCost
    })

  } catch (error) {
    console.error('Service booking details error:', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
