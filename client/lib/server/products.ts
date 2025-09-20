import 'server-only'
import { createClient, type PostgrestError } from '@supabase/supabase-js'
import type { Product as UIProduct, ProductImage } from '../types'

export type ProductWithRelations = {
  id: string
  name: string
  description?: string | null
  price: number
  image_url?: string | null
  stock_quantity?: number | null
  is_featured?: boolean | null
  is_on_sale?: boolean | null
  sale_price?: number | null
  is_deal?: boolean | null
  deal_price?: number | null
  original_price?: number | null
  rating?: number | null
  reviews_count?: number | null
  slug?: string | null
  created_at?: string | null
  updated_at?: string | null
  product_images?: Array<{ url?: string | null; is_main?: boolean | null; sort_order?: number | null }>
  categories?: { id: string; name: string; slug?: string }
};

// Normalize server product to shared UI Product type
export function normalizeToProduct(p: ProductWithRelations): UIProduct {
  const images: ProductImage[] | undefined = p.product_images
    ? p.product_images.map(img => ({
        url: img.url ?? undefined,
        is_main: img.is_main ?? undefined,
        sort_order: img.sort_order ?? undefined,
      }))
    : undefined

  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    price: Number(p.price) || 0,
    image_url: p.image_url ?? undefined,
    category_id: p.categories?.id ?? undefined,
    categories: p.categories ? { id: p.categories.id, name: p.categories.name, slug: p.categories.slug || '' } : undefined,
    product_images: images,
    stock_quantity: p.stock_quantity ?? undefined,
    rating: p.rating ?? null,
    reviews_count: p.reviews_count ?? null,
    is_featured: p.is_featured ?? undefined,
    is_deal: p.is_deal ?? undefined,
    original_price: p.original_price ?? undefined,
    deal_price: p.deal_price ?? undefined,
    is_on_sale: p.is_on_sale ?? undefined,
    sale_price: p.sale_price ?? undefined,
    slug: p.slug ?? undefined,
    created_at: p.created_at ?? undefined,
    updated_at: p.updated_at ?? undefined,
  }
}
/**
 * Server-only helper to fetch a product by UUID id or slug (fallback)
 * Uses Supabase service role and gracefully handles missing schema columns
 */
export async function fetchProductByIdOrSlug(idOrSlug: string): Promise<ProductWithRelations | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('[fetchProductByIdOrSlug] Missing Supabase environment variables')
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  )

  const UUID_ANY_VERSION = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  const tryByIdFirst = UUID_ANY_VERSION.test(idOrSlug)

  const buildQuery = (withSlug: boolean, byId: boolean) => {
    const base = supabase
      .from('products')
      .select(`
        *,
        product_images (
          url,
          is_main,
          sort_order
        ),
        categories (
          id,
          name${withSlug ? ', slug' : ''}
        )
      `)

    const filtered = byId
      ? base.eq('id', idOrSlug)
      : base.ilike('slug', idOrSlug)

    return filtered
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })
      .single()
  }

  const attempt = async () => {
    let { data, error } = await buildQuery(true, tryByIdFirst)
    if (error) {
      const code = (error as PostgrestError).code
      const msg = ((error as PostgrestError).message || '').toLowerCase()
      const missingSlug = code === '42703' || msg.includes('slug')
      if (missingSlug) {
        const fb = await buildQuery(false, tryByIdFirst)
        data = fb.data
        error = fb.error as PostgrestError | null
      }
    }

    if (!data && !tryByIdFirst) {
      const second = await buildQuery(true, true)
      let d2 = second.data
      const e2 = second.error as PostgrestError | null
      if (e2) {
        const code = e2.code
        const msg = (e2.message || '').toLowerCase()
        if (code === '42703' || msg.includes('slug')) {
          const fb2 = await buildQuery(false, true)
          d2 = fb2.data
        }
      }
      return (d2 as ProductWithRelations | null) ?? null
    }

    return (data as ProductWithRelations | null) ?? null
  }

  try {
    return await attempt()
  } catch (e) {
    console.error('[fetchProductByIdOrSlug] Supabase fetch error:', e)
    return null
  }
}
