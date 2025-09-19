import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  params: Promise<{ slug: string[] }>
}

// Server-side fetch helper using Supabase service role to avoid internal API base URL issues
async function fetchProductByIdOrSlug(idOrSlug: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
    console.error('[PRODUCT PAGE] Missing Supabase environment variables')
    return null
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
  )

  const UUID_ANY_VERSION = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

  const buildQuery = (withSlug: boolean, byId: boolean) =>
    supabase
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
      [byId ? 'eq' : 'ilike'](byId ? 'id' : 'slug', byId ? idOrSlug : idOrSlug)
      .order('is_main', { foreignTable: 'product_images', ascending: false })
      .order('sort_order', { foreignTable: 'product_images', ascending: true })
      .single()

  // Prefer ID lookup if it looks like a UUID; otherwise try slug
  const tryByIdFirst = UUID_ANY_VERSION.test(idOrSlug)

  const attempt = async () => {
    let { data, error } = await buildQuery(true, tryByIdFirst)
    if ((error && (error.code === '42703' || (error.message || '').toLowerCase().includes('slug')))) {
      const fb = await buildQuery(false, tryByIdFirst)
      data = fb.data
      error = fb.error
    }
    if (!data && !tryByIdFirst) {
      // If slug attempt failed, try by ID just in case
      const res2 = await buildQuery(true, true)
      let d2 = res2.data
      const e2 = res2.error
      if (e2 && (e2.code === '42703' || (e2.message || '').toLowerCase().includes('slug'))) {
        const fb2 = await buildQuery(false, true)
        d2 = fb2.data
      }
      return d2 || null
    }
    return data || null
  }

  try {
    return await attempt()
  } catch (e) {
    console.error('[PRODUCT PAGE] Supabase fetch error:', e)
    return null
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const id = slug[0] // Get the first slug segment as the product ID
  
  // Add debug logging for production
  console.log(`[PRODUCT PAGE] Attempting to load product with ID: ${id}`)
  
  try {
    console.log(`[PRODUCT PAGE] Fetching product from database...`)
    // Fetch directly using server-side Supabase to avoid internal API URL issues
    const product = await fetchProductByIdOrSlug(id)
    
    if (!product) {
      console.log(`[PRODUCT PAGE] Product not found in database: ${id}`)
      notFound()
    }

    console.log(`[PRODUCT PAGE] Successfully loaded product: ${product.name}`)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <ProductDetail product={product} />
        <Footer />
        <CartSidebar />
      </div>
    )
  } catch (error) {
    console.error(`[PRODUCT PAGE] Error fetching product ${id}:`, error)
    notFound()
  }
}

// Generate metadata for SEO
// Force dynamic rendering to ensure all product pages work
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const id = slug[0]
  
  try {
    const product = await fetchProductByIdOrSlug(id)
    
    if (!product) {
      return {
        title: 'Product Not Found',
        description: 'The requested product could not be found.'
      }
    }

    return {
      title: `${product.name} - TISCO Market`,
      description: product.description || `Buy ${product.name} at the best price on TISCO Market`,
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
      openGraph: {
        title: product.name,
        description: product.description,
        images: (() => {
          const img = getImageUrl(product)
          return img ? [img] : []
        })(),
      }
    }
  } catch {
    return {
      title: 'Product - TISCO Market',
      description: 'Quality products at TISCO Market'
    }
  }
}
