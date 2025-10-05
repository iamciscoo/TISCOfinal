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

    const buildQuery = async (withSlug: boolean, withDescription: boolean) => {
      let q = supabase
        .from('products')
        .select(`
          *,
          categories:product_categories (
            category:categories (
              id,
              name${withSlug ? ', slug' : ''}${withDescription ? ', description' : ''}
            )
          ),
          product_images (
            id,
            url,
            is_main,
            sort_order
          )
        `)

      // Smart search filtering: check against real database categories
      if (query && query.length > 2) {
        const safe = query.replace(/[(),%]/g, ' ').trim()
        const tokens = safe.split(/\s+/).filter(Boolean).slice(0, 5)
        
        // Fetch categories to check if this is a category-based search
        let isLikelyCategorySearch = false
        try {
          const { data: categories } = await supabase
            .from('categories')
            .select('name, description')
            .limit(50) // Get reasonable number of categories for comparison
          
          if (categories && categories.length > 0) {
            // Check if search terms match any category names or descriptions
            isLikelyCategorySearch = categories.some(category => {
              const categoryName = (category.name || '').toLowerCase()
              const categoryDesc = (category.description || '').toLowerCase()
              
              return tokens.some(token => 
                categoryName.includes(token.toLowerCase()) ||
                token.toLowerCase().includes(categoryName) ||
                categoryDesc.includes(token.toLowerCase()) ||
                token.toLowerCase().includes(categoryDesc.substring(0, 20)) // Match first part of description
              )
            })
            
            // Log category detection for monitoring
            if (isLikelyCategorySearch) {
              console.log(`🏷️ Detected category search: "${query}"`)
            }
          }
        } catch (categoryError) {
          console.warn('Could not fetch categories for search optimization:', categoryError)
          // Fallback to fetching more products if category check fails
          isLikelyCategorySearch = true
        }
        
        if (!isLikelyCategorySearch && tokens.length > 0) {
          // This looks like a product-specific search - filter on server
          const orClauses = (tokens.length > 0 ? tokens : [safe])
            .map((t) => `name.ilike.%${t}%,description.ilike.%${t}%`)
            .join(',')
          q = q.or(orClauses)
        }
        else if (isLikelyCategorySearch) {
          // Category-based search - fetch more products for client-side filtering
          q = q.limit(150) // Increased limit for better category coverage
        }
      }

      // Category filter removed - let frontend handle it to support multi-category products
      // This matches the shop page behavior which does client-side filtering

      // Apply limit only if provided
      if (limitParam) {
        const parsed = parseInt(limitParam)
        if (!Number.isNaN(parsed) && parsed > 0) {
          q = q.limit(parsed)
        }
      }

      return q
    }

    // Try with slug and description first
    const query_result = await buildQuery(true, true)
    let { data: products, error } = await query_result
    
    // Fallback if slug column doesn't exist
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fallback_query = await buildQuery(false, true)
      const fallback = await fallback_query
      products = fallback.data
      error = fallback.error
    }
    
    // Fallback if description column doesn't exist
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('description'))) {
      const final_query = await buildQuery(false, false)
      const fallback = await final_query
      products = fallback.data
      error = fallback.error
    }

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
    }

    // Log search results summary
    if (query) {
      console.log(`🔍 Search: "${query}" → ${products?.length || 0} products`)
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

    const result = productsWithSortedImages || []
    
    // Log empty results for monitoring
    if (query && result.length === 0) {
      console.log(`⚠️ No results: "${query}"`)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
