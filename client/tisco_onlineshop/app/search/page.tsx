'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Grid3X3, 
  List, 
  Star, 
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'

import { Product } from '@/lib/types'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(query)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  
  const { addItem } = useCartStore()
  const productsPerPage = 12

  // Sample search results - in real app, this would be an API call
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Sample products that match search
      const allProducts: Product[] = [
        { id: '1', name: 'Smartphone Pro Max', price: 999.99, description: 'Latest flagship smartphone with advanced features', image_url: '/products/1g.png', category_id: 'electronics', stock_quantity: 50, categories: { id: 'electronics', name: 'Electronics', slug: 'electronics' } },
        { id: '2', name: 'Wireless Headphones', price: 299.99, description: 'Premium noise-canceling wireless headphones', image_url: '/products/2g.png', category_id: 'electronics', stock_quantity: 100, categories: { id: 'electronics', name: 'Electronics', slug: 'electronics' } },
        { id: '3', name: 'Designer T-Shirt', price: 49.99, description: 'Premium cotton t-shirt with modern design', image_url: '/products/3b.png', category_id: 'clothing', stock_quantity: 200, categories: { id: 'clothing', name: 'Clothing', slug: 'clothing' } },
        { id: '4', name: 'Running Shoes', price: 129.99, description: 'Professional running shoes for athletes', image_url: '/products/4p.png', category_id: 'sports', stock_quantity: 75, categories: { id: 'sports', name: 'Sports', slug: 'sports' } },
        { id: '5', name: 'Coffee Maker', price: 179.99, description: 'Automatic coffee maker with programmable settings', image_url: '/products/5bl.png', category_id: 'home', stock_quantity: 30, categories: { id: 'home', name: 'Home & Garden', slug: 'home' } },
        { id: '6', name: 'Gaming Laptop', price: 1299.99, description: 'High-performance gaming laptop', image_url: '/products/6g.png', category_id: 'electronics', stock_quantity: 25, categories: { id: 'electronics', name: 'Electronics', slug: 'electronics' } },
      ]
      
      // Filter products based on search query
      const searchResults = query 
        ? allProducts.filter(product =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()) ||
            product.categories?.name.toLowerCase().includes(query.toLowerCase())
          )
        : allProducts
      
      setProducts(searchResults)
      setFilteredProducts(searchResults)
      setLoading(false)
    }
    
    fetchSearchResults()
  }, [query])

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchTerm && searchTerm !== query) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category_id === selectedCategory)
    }

    // Price filter
    if (priceRange.min) {
      filtered = filtered.filter(product => product.price >= parseFloat(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => product.price <= parseFloat(priceRange.max))
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'relevance':
        default:
          // Simple relevance scoring based on query match
          const aScore = query ? (a.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1) : 1
          const bScore = query ? (b.name.toLowerCase().includes(query.toLowerCase()) ? 2 : 1) : 1
          return bScore - aScore
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, searchTerm, selectedCategory, sortBy, priceRange, query])

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image_url: product.image_url || '/products/default.png'
    })
  }

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

  const categories = Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean)))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching products...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Search Results</span>
        </nav>

        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Search Results</h1>
            {query && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                &quot;{query}&quot;
                <Link href="/search" className="ml-1 hover:text-gray-700">
                  <X className="h-3 w-3" />
                </Link>
              </Badge>
            )}
          </div>
          <p className="text-gray-600">
            {query 
              ? `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'result' : 'results'} for &quot;${query}&quot;`
              : `Showing ${filteredProducts.length} products`
            }
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Refined Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Refine your search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6">Filters</h3>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category?.toLowerCase().replace(/\s+/g, '') || ''}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price Range */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm(query)
                    setSelectedCategory('all')
                    setPriceRange({ min: '', max: '' })
                    setSortBy('relevance')
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid/List */}
          <div className="lg:col-span-3">
            {displayedProducts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Search className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 text-center mb-6">
                    {query 
                      ? `No products found for &quot;${query}&quot;. Try different keywords or check your spelling.`
                      : 'No products match your current filters.'
                    }
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                      Clear Search
                    </Button>
                    <Button asChild>
                      <Link href="/products">Browse All Products</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Products Grid */}
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                  {displayedProducts.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-4 flex gap-4'}>
                        {/* Product Image */}
                        <div className={viewMode === 'grid' 
                          ? 'aspect-square bg-gray-100 rounded-md mb-4 overflow-hidden' 
                          : 'w-24 h-24 bg-gray-100 rounded-md flex-shrink-0'
                        }>
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-gray-400 text-sm">IMG</div>
                          </div>
                        </div>

                        <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                          {/* Product Info */}
                          <div className="mb-3">
                            <div className="text-xs text-blue-600 font-medium mb-1">
                              {product.categories?.name || 'Product'}
                            </div>
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              <Link href={`/products/${product.id}`}>
                                {product.name}
                              </Link>
                            </h3>
                            {viewMode === 'list' && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className="h-4 w-4 text-yellow-400 fill-current"
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-1">(4.5)</span>
                          </div>

                          {/* Price & Actions */}
                          <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'gap-4'}`}>
                            <div>
                              <span className="text-lg font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                              </span>
                              {(product.stock_quantity || 0) > 0 ? (
                                <div className="text-xs text-green-600">In Stock</div>
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
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock_quantity === 0}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={currentPage === i + 1 ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading search...</p>
          </div>
        </div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}
