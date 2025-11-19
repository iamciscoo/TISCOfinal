import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase-server'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock_quantity: number | null
  rating: number | null
  reviews_count: number | null
  view_count: number | null
  is_featured: boolean | null
  is_new: boolean | null
  is_deal: boolean | null
  deal_price: number | null
  original_price: number | null
  brands: string[] | null
  slug: string | null
  categories: { name: string } | { name: string }[] | null
  category_id?: string
  product_images?: { url: string; is_main: boolean | null }[]
  created_at?: string
}

/**
 * GET personalized products based on user preferences
 * 
 * ALGORITHM: "Instagram-Style" Feed Generation
 * 1. Resolves User Preferences (Categories, Brands, History)
 * 2. Split-Stream Fetching:
 *    - Stream A (80%): Highly Relevant Items (Matches Preferences OR Recently Viewed)
 *    - Stream B (20%): Discovery Items (Popular/New, excluding Stream A criteria)
 * 3. Deterministic Interleaving for diverse feed
 * 4. Server-side pagination for infinite scroll support
 * 5. Max limit increased to 100 to support larger feed batches
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    // Total items per page (default 20, max increased to 100 to support larger feeds)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const page = Math.max(Number(searchParams.get('page')) || 0, 0)
    const preferredOnly = searchParams.get('preferred_only') === 'true'
    
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Fetch User Preferences & History
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        preferred_categories,
        muted_categories,
        followed_brands,
        blocked_brands,
        default_sort_order,
        show_deals_only,
        max_price_filter,
        recently_viewed_products
      `)
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user preferences:', userError)
    }

    // 2. Resolve Category Names to IDs for efficient DB querying
    let preferredCategoryIds: string[] = []
    let mutedCategoryIds: string[] = []

    if (userData) {
      const categoriesToFetch = [
        ...(userData.preferred_categories || []),
        ...(userData.muted_categories || [])
      ]
      
      if (categoriesToFetch.length > 0) {
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .in('name', categoriesToFetch)
        
        if (cats) {
          const catMap = new Map(cats.map((c: { id: string; name: string }) => [c.name, c.id]))
          preferredCategoryIds = (userData.preferred_categories || [])
            .map((name: string) => catMap.get(name))
            .filter((id: string) => !!id)
            
          mutedCategoryIds = (userData.muted_categories || [])
            .map((name: string) => catMap.get(name))
            .filter((id: string) => !!id)
        }
      }
    }

    // Define base selection fields
    const selectFields = `
      id, name, description, price, image_url, stock_quantity, rating, reviews_count, 
      view_count, is_featured, is_new, is_deal, deal_price, original_price, 
      brands, slug, created_at, category_id,
      categories!products_category_id_fkey(name),
      product_images(id, url, is_main, sort_order)
    `

    const hasPreferences = userData && (
      preferredCategoryIds.length > 0 || 
      (userData.followed_brands?.length > 0) ||
      (userData.recently_viewed_products?.length > 0)
    )

    // Helper to apply standard filters (mute/block/price)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (query: any) => {
      query = query.eq('is_active', true)
      
      if (userData) {
        if (userData.show_deals_only) {
          query = query.eq('is_deal', true)
        }
        if (userData.max_price_filter && userData.max_price_filter > 0) {
          query = query.lte('price', userData.max_price_filter)
        }
        if (mutedCategoryIds.length > 0) {
          query = query.not('category_id', 'in', `(${mutedCategoryIds.join(',')})`)
        }
      }
      return query
    }

    // Helper for Sorting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applySort = (query: any, sortOrder: string = 'newest') => {
      switch (sortOrder) {
        case 'newest': return query.order('created_at', { ascending: false })
        case 'oldest': return query.order('created_at', { ascending: true })
        case 'price_low': return query.order('price', { ascending: true })
        case 'price_high': return query.order('price', { ascending: false })
        case 'rating': return query.order('rating', { ascending: false, nullsFirst: false })
        case 'popular': return query.order('view_count', { ascending: false })
        case 'featured': return query.eq('is_featured', true).order('created_at', { ascending: false })
        default: return query.order('created_at', { ascending: false })
      }
    }

    let resultProducts: Product[] = []

    if (hasPreferences && !preferredOnly) {
      // === STRATEGY: SPLIT STREAM ===
      // Stream A: 80% Preferred Items (Increased from 60% to show "all possible products" from preferences)
      // Stream B: 20% Discovery Items
      
      const preferredLimit = Math.ceil(limit * 0.8)
      const discoveryLimit = Math.floor(limit * 0.2)
      
      const preferredOffset = page * preferredLimit
      const discoveryOffset = page * discoveryLimit

      // --- Query A: Preferred ---
      let queryA = supabase.from('products').select(selectFields)
      queryA = applyFilters(queryA)
      
      // Construct OR condition for preferences
      const conditions: string[] = []
      
      if (preferredCategoryIds.length > 0) {
        conditions.push(`category_id.in.(${preferredCategoryIds.join(',')})`)
      }
      if (userData.followed_brands?.length > 0) {
        const brandsList = userData.followed_brands.map((b: string) => `"${b}"`).join(',')
        conditions.push(`brands.cs.{${brandsList}}`)
      }
      if (userData.recently_viewed_products?.length > 0) {
        conditions.push(`id.in.(${userData.recently_viewed_products.join(',')})`)
      }

      if (conditions.length > 0) {
        queryA = queryA.or(conditions.join(','))
      }

      // Preferred stream usually sorted by user default or 'Newest' to show fresh preferred items
      queryA = applySort(queryA, userData.default_sort_order || 'newest')
      queryA = queryA.range(preferredOffset, preferredOffset + preferredLimit - 1)

      // --- Query B: Discovery (Everything else) ---
      let queryB = supabase.from('products').select(selectFields)
      queryB = applyFilters(queryB)
      
      // Note: We rely on memory dedupe instead of expensive NOT IN queries
      queryB = applySort(queryB, userData.default_sort_order || 'popular') 
      queryB = queryB.range(discoveryOffset, discoveryOffset + discoveryLimit - 1)

      // Execute Parallel
      const [resA, resB] = await Promise.all([queryA, queryB])
      
      const productsA = (resA.data as Product[]) || []
      const productsB = (resB.data as Product[]) || []

      // Interleave Results
      const mixed: Product[] = []
      const maxLen = Math.max(productsA.length, productsB.length)
      
      for (let i = 0; i < maxLen; i++) {
        if (i < productsA.length) mixed.push(productsA[i])
        if (i < productsB.length) mixed.push(productsB[i])
      }
      
      resultProducts = mixed
    } else if (preferredOnly && hasPreferences) {
      let query = supabase.from('products').select(selectFields)
      query = applyFilters(query)
      
      const conditions: string[] = []
      if (preferredCategoryIds.length > 0) conditions.push(`category_id.in.(${preferredCategoryIds.join(',')})`)
      if (userData.followed_brands?.length > 0) {
        const brandsList = userData.followed_brands.map((b: string) => `"${b}"`).join(',')
        conditions.push(`brands.cs.{${brandsList}}`)
      }
      if (conditions.length > 0) query = query.or(conditions.join(','))
        
      query = applySort(query, userData.default_sort_order)
      query = query.range(page * limit, (page * limit) + limit - 1)
      
      const { data } = await query
      resultProducts = (data as Product[]) || []

    } else {
      // No preferences: General Feed
      let query = supabase.from('products').select(selectFields)
      query = applyFilters(query)
      query = applySort(query, userData?.default_sort_order || 'popular')
      query = query.range(page * limit, (page * limit) + limit - 1)
      
      const { data } = await query
      resultProducts = (data as Product[]) || []
    }

    // 3. In-Memory Cleanup
    const uniqueProducts = new Map<string, Product>()
    const blockedBrands = userData?.blocked_brands || []
    
    for (const p of resultProducts) {
      if (blockedBrands.length > 0 && p.brands) {
        const isBlocked = p.brands.some((b: string) => blockedBrands.includes(b))
        if (isBlocked) continue
      }
      
      if (!uniqueProducts.has(p.id)) {
        uniqueProducts.set(p.id, p)
      }
    }

    const finalProducts = Array.from(uniqueProducts.values())

    return NextResponse.json({
      products: finalProducts,
      count: finalProducts.length,
      page: page,
      preferences: userData
    })

  } catch (error) {
    console.error('Personalized products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
