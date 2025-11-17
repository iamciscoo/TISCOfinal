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
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const page = Math.max(Number(searchParams.get('page')) || 0, 0)
    
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

    // Build query based on preferences
    let query = supabase
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
        is_featured,
        is_new,
        is_deal,
        deal_price,
        original_price,
        brands,
        slug,
        categories!products_category_id_fkey(name),
        product_images(
          id,
          url,
          is_main,
          sort_order
        )
      `)
      .eq('is_active', true)

    // Apply preferences if they exist
    if (userData) {
      // Filter by deals only
      if (userData.show_deals_only) {
        query = query.eq('is_deal', true)
      }

      // Filter by max price
      if (userData.max_price_filter && userData.max_price_filter > 0) {
        query = query.lte('price', userData.max_price_filter)
      }

      // Apply sorting
      const sortOrder = userData?.default_sort_order || 'newest'
      switch (sortOrder) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'price_low':
          query = query.order('price', { ascending: true })
          break
        case 'price_high':
          query = query.order('price', { ascending: false })
          break
        case 'rating':
          query = query.order('rating', { ascending: false, nullsFirst: false })
          break
        case 'popular':
          // Sort by view_count (most viewed products first)
          query = query.order('view_count', { ascending: false })
          break
        case 'featured':
          query = query.eq('is_featured', true).order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }
    } else {
      // Default sort
      query = query.order('created_at', { ascending: false })
    }

    const offset = page * limit
    query = query.range(offset, offset + limit - 1)

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Filter products based on preferences (client-side filtering for complex conditions)
    let filteredProducts: Product[] = (products as Product[]) || []

    if (userData) {
      filteredProducts = filteredProducts.filter((product: Product) => {
        // Filter out muted categories
        if (userData.muted_categories && userData.muted_categories.length > 0) {
          const categoryName = Array.isArray(product.categories) 
            ? product.categories[0]?.name 
            : product.categories?.name
          if (categoryName && userData.muted_categories.includes(categoryName)) {
            return false
          }
        }

        // Filter out blocked brands
        if (userData.blocked_brands && userData.blocked_brands.length > 0) {
          const productBrands = product.brands || []
          if (productBrands.some((brand: string) => userData.blocked_brands.includes(brand))) {
            return false
          }
        }

        return true
      })

      // Prioritize preferred categories and followed brands
      filteredProducts.sort((a: Product, b: Product) => {
        let scoreA = 0
        let scoreB = 0

        // Boost preferred categories
        if (userData.preferred_categories && userData.preferred_categories.length > 0) {
          const categoryNameA = Array.isArray(a.categories) 
            ? a.categories[0]?.name 
            : a.categories?.name
          const categoryNameB = Array.isArray(b.categories) 
            ? b.categories[0]?.name 
            : b.categories?.name
          if (categoryNameA && userData.preferred_categories.includes(categoryNameA)) scoreA += 10
          if (categoryNameB && userData.preferred_categories.includes(categoryNameB)) scoreB += 10
        }

        // Boost preferred brands (same priority as categories)
        if (userData.followed_brands && userData.followed_brands.length > 0) {
          const brandsA = a.brands || []
          const brandsB = b.brands || []
          if (brandsA.some((brand: string) => userData.followed_brands.includes(brand))) scoreA += 10
          if (brandsB.some((brand: string) => userData.followed_brands.includes(brand))) scoreB += 10
        }

        return scoreB - scoreA
      })
    }

    return NextResponse.json({
      products: filteredProducts,
      count: filteredProducts.length,
      preferences: userData
    })
  } catch (error) {
    console.error('Personalized products error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
