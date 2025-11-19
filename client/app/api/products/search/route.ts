import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type ProductCategory = {
  category?: {
    id?: string
    name?: string
    slug?: string
    description?: string
  } | null
}

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
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          is_featured,
          is_active,
          view_count,
          brands,
          created_at,
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
        .eq('is_active', true) // **OPTIMIZATION: Only search active products**

      // **OPTIMIZATION: Use trigram similarity search (idx_products_name_trgm, idx_products_description_trgm)**
      if (query && query.trim().length > 0) {
        const safe = query.replace(/[(),%]/g, ' ').trim()
        
        // **Use ILIKE for fast pattern matching with GIN indexes**
        // The trigram indexes make ILIKE extremely fast
        // Search in name and description
        q = q.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
        
        // **Order by relevance: exact matches first, then partial matches**
        // This uses the trigram similarity for ranking
        q = q.order('name', { ascending: true }) // Alphabetical for consistency
      } else {
        // No query - show recent products
        q = q.order('created_at', { ascending: false })
      }

      // **OPTIMIZATION: Order images by is_main first (idx_product_images_product_main_fast)**
      q = q
        .order('is_main', { foreignTable: 'product_images', ascending: false })
        .order('sort_order', { foreignTable: 'product_images', ascending: true })

      // Apply limit (default 50 for search, max 500 for scalability)
      const defaultLimit = query ? 50 : 20
      if (limitParam) {
        const parsed = parseInt(limitParam)
        if (!Number.isNaN(parsed) && parsed > 0) {
          q = q.limit(Math.min(parsed, 500)) // Max 500 for large catalogs
        } else {
          q = q.limit(defaultLimit)
        }
      } else {
        q = q.limit(defaultLimit)
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

      // **BRAND & CATEGORY SEARCH: Also search by brand names and categories**
    let result = products || []
    
    if (query && query.trim().length > 0) {
      const searchTerm = query.trim().toLowerCase()
      
      console.log(`\n🔍 SEARCH DEBUG for "${query}"`)
      console.log(`Name/desc matches from DB: ${result.length}`)
      
      // Get IDs that already matched by name/description
      const nameDescMatchIds = new Set(result.map(p => p.id))
      
      // Fetch more products to search by brands and categories (increased to 500)
      const { data: allProducts, error: allError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          is_featured,
          is_active,
          view_count,
          brands,
          created_at,
          categories:product_categories (
            category:categories (
              id,
              name
            )
          ),
          product_images (
            id,
            url,
            is_main,
            sort_order
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(500) // Increased for better search coverage
      
      if (allError) {
        console.error('Error fetching all products for extended search:', allError)
      } else {
        // Filter products that match by brand OR category
        const extendedMatches = (allProducts || []).filter(product => {
          // Skip if already matched by name/description
          if (nameDescMatchIds.has(product.id)) return false
          
          // Check if brands array contains search term
          let brandMatch = false
          if (product.brands && Array.isArray(product.brands) && product.brands.length > 0) {
            brandMatch = product.brands.some(brand => 
              brand.toLowerCase().includes(searchTerm)
            )
          }
          
          // Check if category names contain search term
          let categoryMatch = false
          if (product.categories && Array.isArray(product.categories)) {
            categoryMatch = product.categories.some((cat: unknown) => {
              const catObj = cat as ProductCategory
              const catName = catObj.category?.name?.toLowerCase() || ''
              return catName.includes(searchTerm)
            })
          }
          
          if (brandMatch) {
            console.log(`✅ BRAND MATCH: "${product.name}" - brands=[${product.brands?.join(', ')}]`)
          }
          if (categoryMatch) {
            const categoryNames = product.categories
              ?.map((c: unknown) => (c as ProductCategory).category?.name)
              .filter(Boolean)
              .join(', ') || ''
            console.log(`✅ CATEGORY MATCH: "${product.name}" - categories=[${categoryNames}]`)
          }
          
          return brandMatch || categoryMatch
        })
        
        console.log(`Extended matches (brands + categories): ${extendedMatches.length}`)
        
        // Combine: name/desc matches first, then extended matches
        result = [...result, ...extendedMatches]
        console.log(`Total results: ${result.length}\n`)
      }
    }
    
    // Log empty results for monitoring
    if (query && result.length === 0) {
      console.log(`⚠️ No results: "${query}"`)
    }
    
    // Return in standard format with pagination metadata
    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        total: result.length,
        count: result.length,
        limit: result.length,
        offset: 0,
        hasMore: false
      },
      message: 'Search results retrieved successfully'
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
