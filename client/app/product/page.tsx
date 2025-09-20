import { notFound } from 'next/navigation'
import { fetchProductByIdOrSlug, normalizeToProduct } from '@/lib/server/products'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
import type { Product } from '@/lib/types'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  searchParams: Promise<{ id?: string }>
}

export const runtime = 'nodejs'

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const { id } = await searchParams
  if (!id) {
    console.log('[PRODUCT PAGE] No product ID provided in query params')
    notFound()
  }

  console.log(`[PRODUCT PAGE] Loading product with ID/slug: ${id}`)

  const product = await fetchProductByIdOrSlug(id)
  if (!product) {
    console.log(`[PRODUCT PAGE] Product not found in database: ${id}`)
    notFound()
  }

  const normalized: Product = normalizeToProduct(product)
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductDetail product={normalized} />
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
    const product = await fetchProductByIdOrSlug(id)
    
    if (!product) {
      return {
        title: 'Product Not Found - TISCO Market',
        description: 'The requested product could not be found.'
      }
    }

    const imageUrl = getImageUrl(normalizeToProduct(product))
    
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
