'use client'

import { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react'
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
import { Pagination } from '@/components/Pagination'

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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const prevSheetOpen = useRef(false)
  const [totalProductCount, setTotalProductCount] = useState<number>(0) // Total from database
  
  const activeFiltersCount = (searchTerm !== query ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (showMostPopular ? 1 : 0)

  // Stable handlers for Sheet auto-close
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsFilterSheetOpen(false) // Close sheet on Enter
    }
  }, [])

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value)
    setIsFilterSheetOpen(false) // Close sheet after selection
  }, [])

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value)
    setIsFilterSheetOpen(false) // Close sheet after selection
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchTerm(query) // Reset to original query
    setSelectedCategory('all')
    setSortBy('relevance')
    setShowMostPopular(false)
    setIsFilterSheetOpen(false) // Close sheet
  }, [query])

  // Scroll to top ONLY on page 1, otherwise scroll to results
  useEffect(() => {
    if (currentPage === 1) {
      // Page 1 - scroll to absolute top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Other pages - scroll to results (account for navbar + header)
      window.scrollTo({ top: 280, behavior: 'smooth' })
    }
  }, [currentPage])

  // When mobile filter sheet closes, scroll to show Filters button and top of results grid
  useEffect(() => {
    if (prevSheetOpen.current && !isFilterSheetOpen) {
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
      if (isMobile) {
        const anchor = gridRef.current
        const offset = 240 // Show filters button and start of search results grid (no video card on search)
        const top = anchor ? (anchor.getBoundingClientRect().top + window.scrollY - offset) : 180
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      }
    }
    prevSheetOpen.current = isFilterSheetOpen
  }, [isFilterSheetOpen])

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
        
        // Update total count from server
        if (data.pagination?.total !== undefined) {
          setTotalProductCount(data.pagination.total)
          console.log('[Search] Database total count:', data.pagination.total)
        }
        
        let results = data.data || data || []
        
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
          const directMatches = results.filter((product: Product) => {
            const nameMatch = product.name.toLowerCase().includes(queryLower)
            const descMatch = (product.description || '').toLowerCase().includes(queryLower)
            const brandMatch = product.brands && Array.isArray(product.brands) && 
              product.brands.some(brand => brand.toLowerCase().includes(queryLower))
            return nameMatch || descMatch || brandMatch
          })
          
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
        
        // Check brands
        const brandMatch = product.brands && Array.isArray(product.brands) && 
          product.brands.some(brand => brand.toLowerCase().includes(searchLower))
        
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
        
        return nameMatch || descMatch || brandMatch || categoryMatch
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

  // Pagination: Mobile (3 cols × 8 rows = 24), Desktop (4 cols × 6 rows = 24)
  // Using 24 items to ensure complete rows on both mobile and desktop - matches products page
  const itemsPerPage = viewMode === 'grid' ? 24 : 6
  
  // Determine if filters that REDUCE the dataset are active
  // Note: Sorting (sortBy, showMostPopular) doesn't change total count, only reorders
  // For search page, category filter is the only data-reducing filter (search term is the base query)
  const hasDataReducingFilters = selectedCategory !== 'all'
  
  // Calculate total pages based on:
  // - Database total count when no data-reducing filters active (accurate server count)
  // - Filtered products length when category filter is active (client-side filtered count)
  const baseCount = hasDataReducingFilters ? filteredProducts.length : (totalProductCount > 0 ? totalProductCount : filteredProducts.length)
  const totalPages = Math.max(1, Math.ceil(baseCount / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

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
              ? `Found ${totalProductCount > 0 ? totalProductCount : filteredProducts.length} ${(totalProductCount > 0 ? totalProductCount : filteredProducts.length) === 1 ? 'result' : 'results'} for "${query}"`
              : `Showing ${totalProductCount > 0 ? totalProductCount : filteredProducts.length} products`
            }
          </p>
        </div>

        {/* Mobile Filters + View Toggle */}
        <div className="flex items-center justify-between mb-8 lg:hidden">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            {/* Search Icon Button - Mobile Only */}
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Search products"
                title="Search products"
              >
                <Search className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            
            {/* Filters Button - Mobile Only */}
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
                      type="search"
                      inputMode="search"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
                  <Select value={sortBy} onValueChange={handleSortChange}>
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
                  onClick={handleClearFilters}
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
                      type="search"
                      inputMode="search"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
                  <Select value={sortBy} onValueChange={handleSortChange}>
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
                  onClick={handleClearFilters}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Grid/List */}
          <div className="lg:col-span-3">
            {/* Anchor used for mobile scroll into view when filters close */}
            <div ref={gridRef} aria-hidden className="h-0" />
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
                  ? 'grid grid-cols-3 md:grid-cols-4 gap-3' 
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
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
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
