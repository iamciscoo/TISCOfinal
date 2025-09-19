import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/database'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const { id } = await searchParams
  
  if (!id) {
    console.log('[PRODUCT PAGE] No product ID provided in query params')
    notFound()
  }
  
  // Add debug logging for production
  console.log(`[PRODUCT PAGE] Loading product with ID: ${id}`)
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  if (!UUID_REGEX.test(id)) {
    console.log(`[PRODUCT PAGE] Invalid UUID format: ${id}`)
    notFound()
  }
  
  try {
    console.log(`[PRODUCT PAGE] Fetching product from database...`)
    const product = await getProductById(id)
    
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

// Force dynamic rendering to ensure all product pages work
export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: ProductPageProps) {
  const { id } = await searchParams
  
  if (!id) {
    return {
      title: 'Product - TISCO Market',
      description: 'Quality products at TISCO Market'
    }
  }
  
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  if (!UUID_REGEX.test(id)) {
    return {
      title: 'Product - TISCO Market',
      description: 'Quality products at TISCO Market'
    }
  }
  
  try {
    const product = await getProductById(id)
    
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
