import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, Heart } from 'lucide-react'

// Sample featured products data
const featuredProducts = [
  {
    id: '1',
    name: 'Smartphone Pro Max',
    price: 999.99,
    originalPrice: 1199.99,
    rating: 4.8,
    reviews: 324,
    image: '/products/1g.png',
    category: 'Electronics',
    isNew: true,
    discount: 17
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    price: 299.99,
    originalPrice: null,
    rating: 4.6,
    reviews: 156,
    image: '/products/2g.png',
    category: 'Electronics',
    isNew: false,
    discount: 0
  },
  {
    id: '3',
    name: 'Designer T-Shirt',
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.4,
    reviews: 89,
    image: '/products/3b.png',
    category: 'Clothing',
    isNew: false,
    discount: 29
  },
  {
    id: '4',
    name: 'Running Shoes',
    price: 129.99,
    originalPrice: null,
    rating: 4.9,
    reviews: 267,
    image: '/products/4p.png',
    category: 'Sports',
    isNew: true,
    discount: 0
  },
  {
    id: '5',
    name: 'Coffee Maker',
    price: 179.99,
    originalPrice: 219.99,
    rating: 4.5,
    reviews: 143,
    image: '/products/5bl.png',
    category: 'Home & Garden',
    isNew: false,
    discount: 18
  },
  {
    id: '6',
    name: 'Gaming Laptop',
    price: 1299.99,
    originalPrice: 1499.99,
    rating: 4.7,
    reviews: 98,
    image: '/products/6g.png',
    category: 'Electronics',
    isNew: true,
    discount: 13
  }
]

export const FeaturedProducts = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of the best products with great deals and excellent reviews.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden">
              <div className="relative">
                {/* Product Image */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Product Image</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <Badge className="bg-green-500 hover:bg-green-600">NEW</Badge>
                  )}
                  {product.discount > 0 && (
                    <Badge variant="destructive">-{product.discount}%</Badge>
                  )}
                </div>

                {/* Wishlist Button */}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-3 right-3 w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Heart className="h-4 w-4" />
                </Button>

                {/* Quick Add to Cart */}
                <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Quick Add
                  </Button>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Category */}
                <div className="text-sm text-gray-500 mb-2">{product.category}</div>

                {/* Product Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  <Link href={`/products/${product.id}`}>
                    {product.name}
                  </Link>
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>

                {/* Add to Cart Button */}
                <Button asChild className="w-full">
                  <Link href={`/products/${product.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Products Button */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/products">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
