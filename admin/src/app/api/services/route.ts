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
    
    const offset = (page - 1) * limit

    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

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
      gallery,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        title,
        description,
        features: features || [],
        duration,
        image,
        gallery: gallery || []
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

