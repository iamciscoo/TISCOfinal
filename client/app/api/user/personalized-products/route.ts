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
  is_featured: boolean | null
  is_new: boolean | null
  is_deal: boolean | null
  deal_price: number | null
  original_price: number | null
  brands: string[] | null
  slug: string | null
  categories: { name: string } | { name: string }[] | null
  product_images?: { url: string; is_main: boolean | null }[]
}

/**
 * GET personalized products based on user preferences
 * 
 * Enhanced to scope sorting within preferred categories/brands:
 * - "Most Popular" shows most popular within YOUR preferences, not platform-wide
 * - Preferred items shown first, then fallback to general items
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const page = Math.max(Number(searchParams.get('page')) || 0, 0)
    const preferredOnly = searchParams.get('preferred_only') === 'true'
    
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch user preferences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        preferred_categories,
        muted_categories,
        followed_brands,
        blocked_brands,
        default_sort_order,
        show_deals_only,
        max_price_filter
      `)
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user preferences:', userError)
    }

    const hasPreferences = userData && (
      (userData.preferred_categories?.length > 0) || 
      (userData.followed_brands?.length > 0)
    )

    // Helper to apply sort order to a query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applySorting = (query: any, sortOrder: string) => {
      switch (sortOrder) {
        case 'newest':
          return query.order('created_at', { ascending: false })
        case 'oldest':
          return query.order('created_at', { ascending: true })
        case 'price_low':
          return query.order('price', { ascending: true })
        case 'price_high':
          return query.order('price', { ascending: false })
        case 'rating':
          return query.order('rating', { ascending: false, nullsFirst: false })
        case 'popular':
          return query.order('view_count', { ascending: false })
        case 'featured':
          return query.eq('is_featured', true).order('created_at', { ascending: false })
        default:
          return query.order('created_at', { ascending: false })
      }
    }

    // Build base query
    const buildBaseQuery = () => {
      let q = supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          stock_quantity,
          rating,
          reviews_count,
          view_count,
          is_featured,
          is_new,
          is_deal,
          deal_price,
          original_price,
          brands,
          slug,
          created_at,
          categories!products_category_id_fkey(name),
          product_images(
            id,
            url,
            is_main,
            sort_order
          )
        `)
        .eq('is_active', true)

      // Apply global filters
      if (userData) {
        if (userData.show_deals_only) {
          q = q.eq('is_deal', true)
        }
        if (userData.max_price_filter && userData.max_price_filter > 0) {
          q = q.lte('price', userData.max_price_filter)
        }
      }

      return q
    }

    let allProducts: Product[] = []
    const sortOrder = userData?.default_sort_order || 'newest'

    // Strategy: Fetch preferred products first, then non-preferred
    if (hasPreferences && !preferredOnly) {
      // Fetch more to ensure we have enough after filtering
      const fetchLimit = limit * 3

      // Query 1: Get preferred products (scoped sorting)
      let preferredQuery = buildBaseQuery()
      preferredQuery = applySorting(preferredQuery, sortOrder)
      preferredQuery = preferredQuery.limit(fetchLimit)

      const { data: allProductsData } = await preferredQuery

      if (allProductsData) {
        const productsTyped = allProductsData as Product[]
        
        // Separate preferred from non-preferred
        const preferred: Product[] = []
        const nonPreferred: Product[] = []

        for (const product of productsTyped) {
          // Skip muted categories
          if (userData.muted_categories?.length > 0) {
            const categoryName = Array.isArray(product.categories) 
              ? product.categories[0]?.name 
              : product.categories?.name
            if (categoryName && userData.muted_categories.includes(categoryName)) {
              continue
            }
          }

          // Skip blocked brands
          if (userData.blocked_brands?.length > 0) {
            const productBrands = product.brands || []
            if (productBrands.some((brand: string) => userData.blocked_brands.includes(brand))) {
              continue
            }
          }

          // Check if product matches preferences
          const categoryName = Array.isArray(product.categories) 
            ? product.categories[0]?.name 
            : product.categories?.name
          const matchesCategory = categoryName && userData.preferred_categories?.includes(categoryName)
          const matchesBrand = product.brands?.some((brand: string) => 
            userData.followed_brands?.includes(brand)
          )

          if (matchesCategory || matchesBrand) {
            preferred.push(product)
          } else {
            nonPreferred.push(product)
          }
        }

        // Merge: preferred first, then non-preferred
        allProducts = [...preferred, ...nonPreferred]
      }
    } else if (preferredOnly && hasPreferences) {
      // Fetch only preferred products
      let query = buildBaseQuery()
      query = applySorting(query, sortOrder)
      query = query.limit(limit * 2)

      const { data: productsData } = await query

      if (productsData) {
        const productsTyped = productsData as Product[]
        
        allProducts = productsTyped.filter((product: Product) => {
          // Filter muted/blocked
          if (userData.muted_categories?.length > 0) {
            const categoryName = Array.isArray(product.categories) 
              ? product.categories[0]?.name 
              : product.categories?.name
            if (categoryName && userData.muted_categories.includes(categoryName)) {
              return false
            }
          }

          if (userData.blocked_brands?.length > 0) {
            const productBrands = product.brands || []
            if (productBrands.some((brand: string) => userData.blocked_brands.includes(brand))) {
              return false
            }
          }

          // Must match preferences
          const categoryName = Array.isArray(product.categories) 
            ? product.categories[0]?.name 
            : product.categories?.name
          const matchesCategory = categoryName && userData.preferred_categories?.includes(categoryName)
          const matchesBrand = product.brands?.some((brand: string) => 
            userData.followed_brands?.includes(brand)
          )

          return matchesCategory || matchesBrand
        })
      }
    } else {
      // No preferences or regular query
      let query = buildBaseQuery()
      query = applySorting(query, sortOrder)
      
      const offset = page * limit
      query = query.range(offset, offset + limit - 1)

      const { data: products, error: productsError } = await query

      if (productsError) {
        console.error('Error fetching products:', productsError)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
      }

      allProducts = (products as Product[]) || []

      // Filter out muted/blocked
      if (userData) {
        allProducts = allProducts.filter((product: Product) => {
          if (userData.muted_categories?.length > 0) {
            const categoryName = Array.isArray(product.categories) 
              ? product.categories[0]?.name 
              : product.categories?.name
            if (categoryName && userData.muted_categories.includes(categoryName)) {
              return false
            }
          }

          if (userData.blocked_brands?.length > 0) {
            const productBrands = product.brands || []
            if (productBrands.some((brand: string) => userData.blocked_brands.includes(brand))) {
              return false
            }
          }

          return true
        })
      }
    }

    // Apply pagination
    const offset = page * limit
    const paginatedProducts = allProducts.slice(offset, offset + limit)

    // Calculate stats
    const preferredCount = hasPreferences ? paginatedProducts.filter((p: Product) => {
      const categoryName = Array.isArray(p.categories) 
        ? p.categories[0]?.name 
        : p.categories?.name
      const matchesCategory = categoryName && userData.preferred_categories?.includes(categoryName)
      const matchesBrand = p.brands?.some((brand: string) => 
        userData.followed_brands?.includes(brand)
      )
      return matchesCategory || matchesBrand
    }).length : 0

    return NextResponse.json({
      products: paginatedProducts,
      count: paginatedProducts.length,
      totalPreferred: preferredCount,
      totalResults: allProducts.length,
      preferences: userData
    })
  } catch (error) {
    console.error('Personalized products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
