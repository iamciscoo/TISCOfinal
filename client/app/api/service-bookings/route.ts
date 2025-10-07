import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'
// Dynamic import of notification service to avoid build issues

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Increase timeout for better reliability
          signal: AbortSignal.timeout(25000), // 25 second timeout
        })
      },
    }
  }
)

export async function GET(request: NextRequest) {
  console.log('=== GET /api/service-bookings START ===')
  try {
    console.log('Getting user...')
    const user = await getUser()
    console.log('User result:', user ? `User ID: ${user.id}` : 'No user found')
    if (!user?.id) {
      console.log('No user, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fresh parameter for cache busting if needed
    const { searchParams } = new URL(request.url)
    searchParams.get('fresh')

    console.log('Fetching service bookings for user:', user.id)
    const { data, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        services(
          id,
          title,
          description,
          duration,
          image,
          features
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('Service bookings query result:', { data: data?.length || 0, error: error?.message })
    if (error) {
      console.error('Service bookings fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Returning service bookings:', data?.length || 0)
    return NextResponse.json({ bookings: data || [] }, { status: 200 })
  } catch (error: unknown) {
    console.error('=== GET /api/service-bookings ERROR ===', error)
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('=== POST /api/service-bookings START ===')
    console.log('Request headers:', {
      'content-type': req.headers.get('content-type'),
      'cookie': req.headers.get('cookie') ? 'Present' : 'Missing',
      'authorization': req.headers.get('authorization') ? 'Present' : 'Missing'
    })
    
    console.log('Getting user...')
    const user = await getUser()
    console.log('User result:', user ? `User ID: ${user.id}, Email: ${user.email}` : 'No user found')
    
    if (!user) {
      console.log('No user found, returning 401')
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be signed in to book a service. Please sign in and try again.',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    let body: Record<string, unknown> = {}
    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await req.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      form.forEach((v, k) => (body[k] = typeof v === 'string' ? v : String(v)))
    }

    const service_id = String(body.service_id || '').trim()
    const service_type = String(body.service_type || '').trim() || 'standard'
    const description = String(body.description || '').trim()
    const preferred_date = String(body.preferred_date || '').trim()
    const preferred_time = String(body.preferred_time || '').trim()
    const contact_email = String(body.contact_email || user.email || '').trim()
    const customer_name = String(body.customer_name || body.full_name || '').trim() 
      || user.user_metadata?.full_name 
      || user.user_metadata?.name 
      || 'Customer'

    console.log('Validating booking data...')
    if (!service_id) {
      return NextResponse.json({ error: 'service_id is required' }, { status: 400 })
    }
    if (!description || !preferred_date || !preferred_time || !contact_email || !customer_name) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: { description: !!description, preferred_date: !!preferred_date, preferred_time: !!preferred_time, contact_email: !!contact_email, customer_name: !!customer_name }
      }, { status: 400 })
    }

    // Verify service exists
    const { data: svc, error: svcErr } = await supabase
      .from('services')
      .select('id')
      .eq('id', service_id)
      .single()
    if (svcErr || !svc) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const contact_phone = String(body.contact_phone || '').trim()

    console.log('Creating service booking in database...')
    const { data, error } = await supabase
      .from('service_bookings')
      .insert({
        user_id: user.id,
        service_id,
        service_type,
        description,
        preferred_date,
        preferred_time,
        customer_name,
        contact_email,
        contact_phone,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating booking:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Service booking created successfully:', data?.id)

    // Get service details for notification
    const { data: serviceData } = await supabase
      .from('services')
      .select('title')
      .eq('id', service_id)
      .single()

    // Send booking confirmation notification
    try {
      // Import notification service dynamically to avoid build issues
      const { notifyBookingCreated } = await import('@/lib/notifications/service')
      
      await notifyBookingCreated({
        booking_id: data.id,
        contact_email: contact_email,
        customer_name,
        service_name: serviceData?.title || 'Service',
        preferred_date,
        preferred_time,
        description,
        service_type
      })
      console.log('Booking confirmation email sent successfully')
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError)
      // Don't fail the booking creation if email fails
    }

    return NextResponse.json({ booking: data }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to create booking' }, { status: 500 })
  }
}



