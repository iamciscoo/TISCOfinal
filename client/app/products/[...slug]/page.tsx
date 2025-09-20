import { notFound } from 'next/navigation'
import { getImageUrl } from '@/lib/shared-utils'
import { fetchProductByIdOrSlug, normalizeToProduct } from '@/lib/server/products'
import { ProductDetail } from '@/components/ProductDetail'
import type { Product } from '@/lib/types'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  params: Promise<{ slug: string[] }>
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

    // Normalize to shared Product type for UI components
    const normalized: Product = normalizeToProduct(product)

    console.log(`[PRODUCT PAGE] Successfully loaded product: ${normalized.name}`)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <ProductDetail product={normalized} />
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

    const metaProduct: Product = normalizeToProduct(product)
    return {
      title: `${product.name} - TISCO Market`,
      description: product.description || `Buy ${product.name} at the best price on TISCO Market`,
      openGraph: {
        title: product.name,
        description: product.description,
        images: (() => {
          const img = getImageUrl(metaProduct)
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
