import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('=== GET /api/services START ===')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!
    )
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true) // Only show active services
      .order('display_order', { ascending: true }) // Order by custom display order
      .order('created_at', { ascending: false }) // Then by creation date

    if (error) {
      console.error('Services fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ services: services || [] }, { status: 200 })
  } catch (error: unknown) {
    console.error('Services API error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
