import { notFound } from 'next/navigation'
import { getProductById } from '@/lib/database'
import { ProductDetail } from '@/components/ProductDetail'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  
  try {
    const product = await getProductById(id)
    
    if (!product) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <ProductDetail product={product} />
      </div>
    )
  } catch (error) {
    console.error('Error fetching product:', error)
    notFound()
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps) {
  const { id } = await params
  
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
      openGraph: {
        title: product.name,
        description: product.description,
        images: product.image_url ? [product.image_url] : [],
      }
    }
  } catch (error) {
    return {
      title: 'Product - TISCO Market',
      description: 'Quality products at TISCO Market'
    }
  }
}
