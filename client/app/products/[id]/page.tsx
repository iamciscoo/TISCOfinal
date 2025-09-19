import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/database'
import { getImageUrl } from '@/lib/shared-utils'
import { ProductDetail } from '@/components/ProductDetail'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  if (!UUID_REGEX.test(id)) {
    // Guard against invalid IDs like numeric strings to prevent failed Supabase queries
    notFound()
  }
  
  try {
    const product = await getProductById(id)
    
    if (!product) {
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
  } catch (error) {
    console.error('Error fetching product:', error)
    notFound()
  }
}

// Generate metadata for SEO
// Generate static params for most popular products at build time
export async function generateStaticParams() {
  try {
    // Use direct Supabase client to avoid dependency issues during build
    const { createClient } = await import('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      console.warn('Missing environment variables for generateStaticParams, generating common product paths')
      return []
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    )
    
    // Fetch featured and recent products for static generation
    const { data: products, error } = await supabase
      .from('products')
      .select('id')
      .or('is_featured.eq.true,created_at.gte.2025-01-01')
      .limit(50) // Limit to most important products for build performance
    
    if (error) {
      console.error('Database error in generateStaticParams:', error)
      return []
    }
    
    console.log(`Generated static params for ${products?.length || 0} products`)
    
    // Return array of params for each product
    return (products || []).map((product: { id: string }) => ({
      id: String(product.id),
    }))
  } catch (error) {
    console.error('Error generating static params for products:', error)
    // Return empty array to prevent build failure
    return []
  }
}

// Enable ISR with fallback for products not pre-generated
export const dynamicParams = true

export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params
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
