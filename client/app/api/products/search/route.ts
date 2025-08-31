import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')
    const category = searchParams.get('category')

    let supabaseQuery = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        ),
        product_images (
          id,
          url,
          is_main,
          sort_order
        )
      `)
      // limit applied conditionally below

    // Search filter (tokenized OR across name/description). Sanitize commas/parentheses to avoid Postgrest .or parsing issues
    if (query) {
      const safe = query.replace(/[(),%]/g, ' ').trim()
      const tokens = safe.split(/\s+/).filter(Boolean).slice(0, 5)
      const orClauses = (tokens.length > 0 ? tokens : [safe])
        .map((t) => `name.ilike.%${t}%,description.ilike.%${t}%`)
        .join(',')
      supabaseQuery = supabaseQuery.or(orClauses)
    }

    // Category filter
    if (category && category !== 'all') {
      supabaseQuery = supabaseQuery.eq('category_id', category)
    }

    // Stock filter removed to return all products

    // Apply limit only if provided
    if (limitParam) {
      const parsed = parseInt(limitParam)
      if (!Number.isNaN(parsed) && parsed > 0) {
        supabaseQuery = supabaseQuery.limit(parsed)
      }
    }

    const { data: products, error } = await supabaseQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
    }

    // Sort product_images by sort_order and is_main
    const productsWithSortedImages = products?.map(product => ({
      ...product,
      product_images: product.product_images?.sort((a: { is_main: boolean; sort_order: number | null }, b: { is_main: boolean; sort_order: number | null }) => {
        if (a.is_main && !b.is_main) return -1
        if (!a.is_main && b.is_main) return 1
        return (a.sort_order || 0) - (b.sort_order || 0)
      })
    }))

    return NextResponse.json(productsWithSortedImages || [])
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
