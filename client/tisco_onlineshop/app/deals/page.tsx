'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart,
  Heart,
  Timer,
  Zap,
  Percent
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

interface Deal {
  id: string
  name: string
  description: string
  originalPrice: number
  salePrice: number
  discount: number
  image_url: string
  category: string
  rating: number
  reviews: number
  stock_quantity: number
  endDate: string
  isFlashDeal: boolean
  isFeatured: boolean
}

const deals: Deal[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'Noise-canceling wireless headphones with 30-hour battery life',
    originalPrice: 299.99,
    salePrice: 199.99,
    discount: 33,
    image_url: '/products/headphones.jpg',
    category: 'Electronics',
    rating: 4.8,
    reviews: 1234,
    stock_quantity: 45,
    endDate: '2024-02-15',
    isFlashDeal: true,
    isFeatured: true
  },
  {
    id: '2',
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking with heart rate monitor and GPS',
    originalPrice: 249.99,
    salePrice: 179.99,
    discount: 28,
    image_url: '/products/smartwatch.jpg',
    category: 'Electronics',
    rating: 4.6,
    reviews: 892,
    stock_quantity: 23,
    endDate: '2024-02-20',
    isFlashDeal: false,
    isFeatured: true
  },
  {
    id: '3',
    name: 'Designer Running Shoes',
    description: 'Lightweight running shoes with advanced cushioning technology',
    originalPrice: 159.99,
    salePrice: 89.99,
    discount: 44,
    image_url: '/products/running-shoes.jpg',
    category: 'Sports',
    rating: 4.7,
    reviews: 567,
    stock_quantity: 78,
    endDate: '2024-02-18',
    isFlashDeal: true,
    isFeatured: false
  },
  {
    id: '4',
    name: 'Organic Cotton Bedding Set',
    description: 'Luxurious 4-piece organic cotton bedding set, queen size',
    originalPrice: 129.99,
    salePrice: 79.99,
    discount: 38,
    image_url: '/products/bedding.jpg',
    category: 'Home',
    rating: 4.5,
    reviews: 345,
    stock_quantity: 56,
    endDate: '2024-02-25',
    isFlashDeal: false,
    isFeatured: true
  },
  {
    id: '5',
    name: 'Professional Chef Knife Set',
    description: 'High-carbon steel knife set with wooden storage block',
    originalPrice: 199.99,
    salePrice: 119.99,
    discount: 40,
    image_url: '/products/knife-set.jpg',
    category: 'Kitchen',
    rating: 4.9,
    reviews: 678,
    stock_quantity: 34,
    endDate: '2024-02-22',
    isFlashDeal: false,
    isFeatured: false
  },
  {
    id: '6',
    name: 'Bluetooth Portable Speaker',
    description: 'Waterproof portable speaker with 20-hour battery life',
    originalPrice: 79.99,
    salePrice: 49.99,
    discount: 38,
    image_url: '/products/speaker.jpg',
    category: 'Electronics',
    rating: 4.4,
    reviews: 423,
    stock_quantity: 67,
    endDate: '2024-02-28',
    isFlashDeal: true,
    isFeatured: false
  }
]

export default function DealsPage() {
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>(deals)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('discount')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  const { addItem } = useCartStore()
  
  const categories = Array.from(new Set(deals.map(deal => deal.category)))
  const featuredDeals = deals.filter(deal => deal.isFeatured)
  const flashDeals = deals.filter(deal => deal.isFlashDeal)

  // Filter and sort deals
  useEffect(() => {
    let filtered = [...deals]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(deal => deal.category === selectedCategory)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'discount':
          return b.discount - a.discount
        case 'price-low':
          return a.salePrice - b.salePrice
        case 'price-high':
          return b.salePrice - a.salePrice
        case 'rating':
          return b.rating - a.rating
        default:
          return 0
      }
    })

    setFilteredDeals(filtered)
  }, [searchTerm, selectedCategory, sortBy])

  const handleAddToCart = (deal: Deal) => {
    addItem({
      id: deal.id,
      name: deal.name,
      price: deal.salePrice,
      image_url: deal.image_url
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Deals</span>
        </nav>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔥 Amazing Deals & Offers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover incredible savings on your favorite products. Limited time offers you don&apos;t want to miss!
          </p>
        </div>

        {/* Flash Deals Section */}
        {flashDeals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Flash Deals</h2>
              </div>
              <Badge className="bg-red-500 animate-pulse">Limited Time</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashDeals.map((deal) => (
                <Card key={deal.id} className="group hover:shadow-xl transition-all duration-300 border-2 border-red-200">
                  <CardContent className="p-4">
                    <div className="relative mb-4">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <div className="text-gray-400 text-sm">IMG</div>
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-red-500">
                        -{deal.discount}%
                      </Badge>
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 rounded px-2 py-1">
                        <Timer className="h-3 w-3 text-red-500" />
                        <span className="text-xs font-medium text-red-500">Flash Deal</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {deal.name}
                      </h3>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(deal.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">({deal.reviews})</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-red-600">
                          ${deal.salePrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500 line-through">
                          ${deal.originalPrice.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="p-2"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(deal)}
                          className="flex-1"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="discount">Biggest Discount</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* All Deals Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Deals</h2>
            <span className="text-gray-600">
              {filteredDeals.length} deals found
            </span>
          </div>

          {filteredDeals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Percent className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
                <p className="text-gray-600 text-center">
                  Try adjusting your filters to find more deals.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
              : 'space-y-4'
            }>
              {filteredDeals.map((deal) => (
                <Card key={deal.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-4 flex gap-4'}>
                    {/* Product Image */}
                    <div className={viewMode === 'grid' 
                      ? 'aspect-square bg-gray-100 rounded-md mb-4 overflow-hidden relative' 
                      : 'w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 relative'
                    }>
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <div className="text-gray-400 text-sm">IMG</div>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        -{deal.discount}%
                      </Badge>
                    </div>

                    <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                      {/* Product Info */}
                      <div className="mb-3">
                        <div className="text-xs text-blue-600 font-medium mb-1">
                          {deal.category}
                        </div>
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {deal.name}
                        </h3>
                        {viewMode === 'list' && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {deal.description}
                          </p>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.floor(deal.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({deal.reviews})</span>
                      </div>

                      {/* Price & Actions */}
                      <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'gap-4'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-red-600">
                              ${deal.salePrice.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${deal.originalPrice.toFixed(2)}
                            </span>
                          </div>
                          {deal.stock_quantity > 0 ? (
                            <div className="text-xs text-green-600">In Stock ({deal.stock_quantity})</div>
                          ) : (
                            <div className="text-xs text-red-600">Out of Stock</div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-2"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(deal)}
                            disabled={deal.stock_quantity === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {viewMode === 'list' ? 'Add to Cart' : ''}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
