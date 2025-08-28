import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fresh parameter for cache busting if needed
    const { searchParams } = new URL(request.url)
    searchParams.get('fresh')

    const { data: bookings, error } = await supabase
      .from('service_bookings')
      .select(`
        *,
        services(id, title, description, duration, image)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [] }, { status: 200 })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch bookings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const contact_email = String(body.contact_email || user.emailAddresses?.[0]?.emailAddress || '').trim()
    const contact_phone = String(body.contact_phone || '').trim() || null
    const customer_name = String(body.customer_name || [user.firstName, user.lastName].filter(Boolean).join(' ')).trim()

    if (!service_id) {
      return NextResponse.json({ error: 'service_id is required' }, { status: 400 })
    }
    if (!description || !preferred_date || !preferred_time || !contact_email || !customer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    const { data, error } = await supabase
      .from('service_bookings')
      .insert({
        service_id,
        user_id: user.id,
        service_type,
        description,
        preferred_date,
        preferred_time,
        contact_email,
        contact_phone,
        customer_name,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ booking: data }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message || 'Failed to create booking' }, { status: 500 })
  }
}



