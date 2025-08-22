import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET() {
  try {
    const { data: dealProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name),
        product_images(url, is_main, sort_order)
      `)
      .eq('is_deal', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching deals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform the data to include discount percentage and proper image handling
    const transformedDeals = dealProducts?.map(product => {
      const discountPercentage = product.original_price && product.deal_price 
        ? Math.round(((product.original_price - product.deal_price) / product.original_price) * 100)
        : 0

      // Get main image or first image
      const mainImage = product.product_images?.find((img: { is_main: boolean; url: string }) => img.is_main) || product.product_images?.[0]
      const imageUrl = mainImage?.url || product.image_url || '/circular.svg'

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        originalPrice: product.original_price || product.price,
        dealPrice: product.deal_price || product.price,
        currentPrice: product.deal_price || product.price,
        discount: discountPercentage,
        image_url: imageUrl,
        category: product.categories?.name || 'General',
        category_id: product.category_id,
        rating: product.rating ?? null,
        reviews_count: product.reviews_count ?? null,
        stock_quantity: product.stock_quantity,
        slug: product.slug,
        tags: product.tags || [],
        created_at: product.created_at
      }
    }) || []

    return NextResponse.json({ 
      deals: transformedDeals,
      count: transformedDeals.length 
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Deals fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch deals' },
      { status: 500 }
    )
  }
}
