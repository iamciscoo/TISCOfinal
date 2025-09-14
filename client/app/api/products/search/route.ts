import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limitParam = searchParams.get('limit')
    const category = searchParams.get('category')

    const buildQuery = (withSlug: boolean) => {
      let q = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name${withSlug ? ', slug' : ''}
          ),
          product_images (
            id,
            url,
            is_main,
            sort_order
          )
        `)

      // Search filter (tokenized OR across name/description). Sanitize commas/parentheses to avoid Postgrest .or parsing issues
      if (query) {
        const safe = query.replace(/[(),%]/g, ' ').trim()
        const tokens = safe.split(/\s+/).filter(Boolean).slice(0, 5)
        const orClauses = (tokens.length > 0 ? tokens : [safe])
          .map((t) => `name.ilike.%${t}%,description.ilike.%${t}%`)
          .join(',')
        q = q.or(orClauses)
      }

      // Category filter
      if (category && category !== 'all') {
        q = q.eq('category_id', category)
      }

      // Apply limit only if provided
      if (limitParam) {
        const parsed = parseInt(limitParam)
        if (!Number.isNaN(parsed) && parsed > 0) {
          q = q.limit(parsed)
        }
      }

      return q
    }

    let { data: products, error } = await buildQuery(true)
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback = await buildQuery(false)
      products = fallback.data
      error = fallback.error
    }

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
