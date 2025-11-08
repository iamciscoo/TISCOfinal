import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    serviceRole: !!supabaseServiceRole
  })
}

const supabase = createClient(
  supabaseUrl!,
  supabaseServiceRole!
)

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseServiceRole) {
      console.error('Supabase not configured properly')
      return NextResponse.json({ 
        error: 'Database configuration error',
        services: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const includeArchived = searchParams.get('include_archived') === 'true'
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
    
    // Only filter for active services if not explicitly including archived
    if (!includeArchived) {
      query = query.eq('is_active', true)
    }
    
    query = query
      .order('display_order', { ascending: true }) // Order by custom display order
      .order('created_at', { ascending: false }) // Then by creation date

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error fetching services:', error)
      return NextResponse.json({ 
        error: error.message,
        services: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page
      }, { status: 500 })
    }

    return NextResponse.json({
      services: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Unexpected error in services GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      services: [],
      totalCount: 0,
      totalPages: 0,
      currentPage: 1
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      features,
      duration,
      image,
      display_order,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Handle smart ordering for new services
    const finalDisplayOrder = display_order ?? 0

    if (display_order !== undefined && display_order > 0) {
      // Check if another service already has this display_order
      const { data: conflictingService } = await supabase
        .from('services')
        .select('id, display_order')
        .eq('display_order', display_order)
        .maybeSingle()

      if (conflictingService) {
        // Get the maximum display_order
        const { data: maxService } = await supabase
          .from('services')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1)
          .maybeSingle()

        const maxOrder = maxService?.display_order ?? 0
        
        // Move conflicting service to the bottom (max + 1)
        await supabase
          .from('services')
          .update({ display_order: maxOrder + 1 })
          .eq('id', conflictingService.id)

        console.log(`✓ New service: Moved conflicting service ${conflictingService.id} to bottom (${maxOrder + 1})`)
        
        // Shift all services at or after the new position down by 1
        const { data: servicesToShift } = await supabase
          .from('services')
          .select('id, display_order')
          .gte('display_order', display_order)
          .neq('id', conflictingService.id)
          .order('display_order', { ascending: false }) // Update in reverse order to avoid conflicts

        if (servicesToShift && servicesToShift.length > 0) {
          for (const service of servicesToShift) {
            await supabase
              .from('services')
              .update({ display_order: service.display_order + 1 })
              .eq('id', service.id)
          }
          console.log(`✓ Shifted ${servicesToShift.length} services down to make room`)
        }
      }
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        title,
        description,
        features: features || [],
        duration,
        image,
        display_order: finalDisplayOrder,
        is_active: true // New services are active by default
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in services POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

