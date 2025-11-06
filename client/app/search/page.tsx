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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, 
  Grid3X3, 
  List, 
  ChevronLeft,
  ChevronRight,
  X,
  Filter
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
  const [showMostPopular, setShowMostPopular] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  
  const productsPerPage = 12
  const activeFiltersCount = (searchTerm !== query ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (showMostPopular ? 1 : 0)

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

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

  // Fetch and filter search results from database
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true)
      
      try {
        const qs = new URLSearchParams({ q: query || '' })
        const response = await fetch('/api/products/search?' + qs.toString())
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results')
        }
        
        const data = await response.json()
        let results = data || []
        
        // Enhanced client-side category search for initial query results
        // This includes category names AND descriptions for more comprehensive search
        if (query) {
          const queryLower = query.toLowerCase()
          
          // Helper function to check if product matches category search
          const matchesCategory = (product: Product) => {
            let hasMatch = false
            if (product.categories) {
              if (Array.isArray(product.categories)) {
                hasMatch = product.categories.some((cat) => {
                  const catName = cat.category?.name?.toLowerCase() || ''
                  const catDesc = ((cat.category as { description?: string })?.description || '').toLowerCase()
                  const nameMatch = catName.includes(queryLower)
                  const descMatch = catDesc.includes(queryLower)
                  return nameMatch || descMatch
                })
              } else {
                const catName = product.categories.name?.toLowerCase() || ''
                const catDesc = ((product.categories as { description?: string })?.description || '').toLowerCase()
                hasMatch = catName.includes(queryLower) || catDesc.includes(queryLower)
              }
            }
            
            return hasMatch
          }
          
          // Separate products into direct matches and category matches
          const directMatches = results.filter((product: Product) => 
            product.name.toLowerCase().includes(queryLower) || 
            (product.description || '').toLowerCase().includes(queryLower)
          )
          
          const categoryMatches = results.filter((product: Product) => 
            !directMatches.some((dp: Product) => dp.id === product.id) && matchesCategory(product)
          )
          
          // Combine results with direct matches first (better relevance)
          results = [...directMatches, ...categoryMatches]
        }
        
        setProducts(results)
        setFilteredProducts(results)
      } catch (error) {
        console.error('Search error:', error)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchSearchResults()
  }, [query])

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products]

    // Enhanced search filter - include category names AND descriptions for refined search
    if (searchTerm && searchTerm !== query) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(product => {
        // Check product name and description
        const nameMatch = product.name.toLowerCase().includes(searchLower)
        const descMatch = (product.description || '').toLowerCase().includes(searchLower)
        
        // Check category names and descriptions
        let categoryMatch = false
        if (product.categories && Array.isArray(product.categories)) {
          categoryMatch = product.categories.some(cat => {
            const catName = cat.category?.name?.toLowerCase() || ''
            const catDesc = ((cat.category as { description?: string })?.description || '').toLowerCase()
            return catName.includes(searchLower) || catDesc.includes(searchLower)
          })
        } else if (product.categories && !Array.isArray(product.categories)) {
          const catName = product.categories.name?.toLowerCase() || ''
          const catDesc = ((product.categories as { description?: string })?.description || '').toLowerCase()
          categoryMatch = catName.includes(searchLower) || catDesc.includes(searchLower)
        }
        
        return nameMatch || descMatch || categoryMatch
      })
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

    // Sort - prioritize Most Popular toggle if enabled
    filtered.sort((a, b) => {
      // If Most Popular toggle is on, sort by view count first
      if (showMostPopular) {
        const viewDiff = (b.view_count || 0) - (a.view_count || 0)
        if (viewDiff !== 0) return viewDiff
        // If view counts are equal, fall through to secondary sort
      }
      
      // Apply secondary sort based on sortBy selection
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
  }, [products, searchTerm, selectedCategory, sortBy, showMostPopular, query])

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
              ? `Found ${filteredProducts.length} ${filteredProducts.length === 1 ? 'result' : 'results'} for "${query}"`
              : `Showing ${filteredProducts.length} products`
            }
          </p>
        </div>

        {/* Mobile Filters + View Toggle */}
        <div className="flex items-center justify-between mb-8 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Open filters"
                title="Open filters"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters{activeFiltersCount > 0 ? (
                  <span className="ml-1 rounded-full bg-blue-600 text-white text-[10px] px-1.5 py-0.5">
                    {activeFiltersCount}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="px-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4 overflow-y-auto">
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

                {/* Most Popular Toggle */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-semibold block text-gray-900">Most Popular</label>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">Show most viewed products first</p>
                    </div>
                    <button
                      onClick={() => setShowMostPopular(!showMostPopular)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showMostPopular ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={showMostPopular}
                      aria-label="Toggle most popular filter"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          showMostPopular ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm(query)
                    setSelectedCategory('all')
                    setSortBy('relevance')
                    setShowMostPopular(false)
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
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
          {/* Filters Sidebar (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>

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

                {/* Most Popular Toggle */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-blue-50/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <label className="text-sm font-semibold block text-gray-900">Most Popular</label>
                      <p className="text-xs text-gray-500 mt-1 leading-tight">Show most viewed products first</p>
                    </div>
                    <button
                      onClick={() => setShowMostPopular(!showMostPopular)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        showMostPopular ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      role="switch"
                      aria-checked={showMostPopular}
                      aria-label="Toggle most popular filter"
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          showMostPopular ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm(query)
                    setSelectedCategory('all')
                    setSortBy('relevance')
                    setShowMostPopular(false)
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
                      ? `No products found for "${query}". Try different keywords or check your spelling.`
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
                  ? 'grid grid-cols-3 gap-2' 
                  : 'space-y-4'
                }>
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode}
                      compact
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
