'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { ProductCard } from '@/components/shared/ProductCard'

import { Product, Category } from '@/lib/types'
import { LoadingSpinner } from '@/components/shared'
import { debounce } from '@/lib/shared-utils'
import { getCategories } from '@/lib/database'

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(query)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  
  const productsPerPage = 12

  // Debounced URL sync for refine input
  const updateUrlDebounced = useMemo(
    () => debounce((next: string) => {
      const trimmed = (next || '').trim()
      if (trimmed && trimmed !== query) {
        router.replace(`/search?q=${encodeURIComponent(trimmed)}`)
      }
      if (!trimmed && query) {
        router.replace('/search')
      }
    }, 350),
    [query, router]
  )

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await getCategories()
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      }
    }
    
    fetchCategories()
  }, [])

  // Keep input in sync with URL query param
  useEffect(() => {
    setSearchTerm(query)
  }, [query])

  // Debounce URL updates as user refines search
  useEffect(() => {
    updateUrlDebounced(searchTerm)
  }, [searchTerm, updateUrlDebounced])

  // Fetch real search results from database
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true)
      
      try {
        const qs = new URLSearchParams({ q: query || '' })
        // Remove category from API call - let frontend handle filtering like shop page
        const response = await fetch('/api/products/search?' + qs.toString())
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results')
        }
        
        const data = await response.json()
        setProducts(data || [])
        setFilteredProducts(data || [])
      } catch (error) {
        console.error('Search error:', error)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchSearchResults()
  }, [query]) // Remove selectedCategory dependency since API doesn't filter by category anymore

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

    // Category filter - now supports multiple categories per product
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {

        // Check primary category for backward compatibility
        if (String(product.category_id) === selectedCategory) {
          return true
        }
        
        // Check if product has multiple categories
        if (product.categories && Array.isArray(product.categories)) {
          return product.categories.some(cat => 
            String(cat.category?.id) === selectedCategory
          )
        }
        
        // Legacy single category check
        if (product.categories && !Array.isArray(product.categories)) {
          return String(product.categories.id ?? '') === selectedCategory
        }
        
        return false
      })
    }

    // Price filter removed

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
          // Sort by created_at date, newest first
          const aDate = new Date(a.created_at || 0).getTime()
          const bDate = new Date(b.created_at || 0).getTime()
          return bDate - aDate
        case 'oldest':
          // Sort by created_at date, oldest first
          const aDateOld = new Date(a.created_at || 0).getTime()
          const bDateOld = new Date(b.created_at || 0).getTime()
          return aDateOld - bDateOld
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
  }, [products, searchTerm, selectedCategory, sortBy, query])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Searching products..." fullScreen />
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const next = (searchTerm || '').trim()
                    if (next) {
                      router.push(`/search?q=${encodeURIComponent(next)}`)
                    } else {
                      router.push('/search')
                    }
                  }
                }}
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
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
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

                {/* Search */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm(query)
                    setSelectedCategory('all')
                    setSortBy('relevance')
                  }}
                >
                  Clear All Filters
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
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode}
                    />
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
        <LoadingSpinner text="Loading search..." fullScreen />
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}
