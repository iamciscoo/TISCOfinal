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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Max 100 products
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

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
