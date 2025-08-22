import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    let supabaseQuery = supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name,
          slug
        ),
        product_images (
          id,
          url,
          is_main,
          sort_order
        )
      `)
      .limit(limit)

    // Search filter
    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Category filter
    if (category && category !== 'all') {
      supabaseQuery = supabaseQuery.eq('category_id', category)
    }

    // Price filters
    if (minPrice) {
      supabaseQuery = supabaseQuery.gte('price', parseFloat(minPrice))
    }
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte('price', parseFloat(maxPrice))
    }

    // Only show products with stock
    supabaseQuery = supabaseQuery.gt('stock_quantity', 0)

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
