import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/database'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
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

// Generate metadata for SEO
// Force dynamic rendering to ensure all product pages work
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const id = slug[0]
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
