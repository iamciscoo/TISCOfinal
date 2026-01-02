import { NextRequest, NextResponse } from 'next/server'

// Lazy Supabase client creator
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.trim()
    const ids = searchParams.get('ids')?.split(',').filter(Boolean) // Support fetching by specific IDs
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000) // Increased max to 1000
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    // If specific IDs are requested, fetch those directly (bypasses limit/offset)
    if (ids && ids.length > 0) {
      const { data, error } = await sb
        .from('products')
        .select('id, name, price, image_url')
        .in('id', ids)

      if (error) {
        console.error('Error fetching products by IDs:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        products: data || [],
        total: data?.length || 0,
        offset: 0,
        limit: ids.length
      })
    }

    let query = sb
      .from('products')
      .select('id, name, price, image_url')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Add search filter if provided
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      products: data || [],
      total: count || 0,
      offset,
      limit
    })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to fetch products'
    }, { status: 500 })
  }
}
