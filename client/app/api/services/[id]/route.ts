import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`=== GET /api/services/${id} START ===`)
    
    if (!id) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )

    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Service fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service }, { status: 200 })
  } catch (error: unknown) {
    console.error('Service API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch service' },
      { status: 500 }
    )
  }
}
