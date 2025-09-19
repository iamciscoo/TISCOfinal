import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  searchParams: Promise<{ id?: string }>
}

// Server-side fetch helper re-used for query-based route
async function fetchProduct(idOrSlug: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('[PRODUCT PAGE] Missing Supabase env vars')
    return null
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  )
  const UUID_ANY_VERSION = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
  const tryById = UUID_ANY_VERSION.test(idOrSlug)

  const build = (withSlug: boolean, byId: boolean) =>
    supabase
      .from('products')
      .select(`
        *,
        product_images (url, is_main, sort_order),
        categories (id, name${withSlug ? ', slug' : ''})
      `)
      [byId ? 'eq' : 'ilike'](byId ? 'id' : 'slug', idOrSlug)
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })
      .single()

  try {
    let { data, error } = await build(true, tryById)
    if (error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug'))) {
      const fb = await build(false, tryById)
      data = fb.data
      error = fb.error
    }
    if (!data && !tryById) {
      const res2 = await build(true, true)
      let d = res2.data
      const e2 = res2.error
      if (e2 && (e2.code === '42703' || (e2.message || '').toLowerCase().includes('slug'))) {
        const fb2 = await build(false, true)
        d = fb2.data
      }
      return d || null
    }
    return data || null
  } catch (e) {
    console.error('[PRODUCT PAGE] fetchProduct error:', e)
    return null
  }
}

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const { id } = await searchParams
  if (!id) {
    console.log('[PRODUCT PAGE] No product ID provided in query params')
    notFound()
  }

  console.log(`[PRODUCT PAGE] Loading product with ID/slug: ${id}`)

  const product = await fetchProduct(id)
  if (!product) {
    console.log(`[PRODUCT PAGE] Product not found in database: ${id}`)
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductDetail product={product} />
      <Footer />
      <CartSidebar />
    </div>
  )
}

// Force dynamic rendering to ensure all product pages work
export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: ProductPageProps) {
  const { id } = await searchParams
  
  try {
    if (!id) {
      return {
        title: 'Product - TISCO Market',
        description: 'Quality products at TISCO Market'
      }
    }
    const product = await fetchProduct(id)
    
    if (!product) {
      return {
        title: 'Product Not Found - TISCO Market',
        description: 'The requested product could not be found.'
      }
    }

    const imageUrl = getImageUrl(product)
    
    return {
      title: `${product.name} - TISCO Market`,
      description: product.description || `Shop ${product.name} at TISCO Market. Quality products with fast delivery.`,
      openGraph: {
        title: `${product.name} - TISCO Market`,
        description: product.description || `Shop ${product.name} at TISCO Market`,
        images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - TISCO Market`,
        description: product.description || `Shop ${product.name} at TISCO Market`,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata for product:', error)
    return {
      title: 'Product - TISCO Market',
      description: 'Quality products at TISCO Market'
    }
  }
}
