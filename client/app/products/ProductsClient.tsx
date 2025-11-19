'use client'

import { useState, useEffect, Suspense, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  Filter, 
  Grid3X3, 
  List
} from 'lucide-react'
import { getCategories } from '@/lib/database'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { Product, Category } from '@/lib/types'
import { ProductCard } from '@/components/shared/ProductCard'
import { CategoryBar } from '@/components/CategoryBar'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ProductsErrorFallback } from '@/components/ErrorFallbacks'
import { VideoCard } from '@/components/shared'
import ShopHero from '@/components/ShopHero'
import { Pagination } from '@/components/Pagination'

// Helper: create URL-friendly slug from a string
const slugify = (s: string = '') =>
  s
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function ProductsContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showMostPopular, setShowMostPopular] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [isManualSearch, setIsManualSearch] = useState(false) // Track manual search input
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const prevSheetOpen = useRef(false)
  const [totalProductCount, setTotalProductCount] = useState<number>(0) // Total from database

  // Scroll to top ONLY on page 1, otherwise scroll to products grid
  useEffect(() => {
    if (currentPage === 1) {
      // Page 1 - scroll to absolute top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Other pages - scroll to products grid (account for navbar + hero)
      window.scrollTo({ top: 320, behavior: 'smooth' })
    }
  }, [currentPage])

  // When mobile filter sheet closes (after user selects/sets filters), scroll to show Filters + Video + Products
  useEffect(() => {
    if (prevSheetOpen.current && !isFilterSheetOpen) {
      // Only auto-scroll on mobile/tablet to avoid jarring desktop jumps
      const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
      if (isMobile) {
        const anchor = gridRef.current
        const offset = 380 // Show filters button, video card, and start of products grid
        const top = anchor ? (anchor.getBoundingClientRect().top + window.scrollY - offset) : 180
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      }
    }
    prevSheetOpen.current = isFilterSheetOpen
  }, [isFilterSheetOpen])

  // Callback for mobile category selection - scroll to products view
  const handleMobileCategorySelect = useCallback(() => {
    // Only auto-scroll on mobile/tablet
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches
    if (isMobile) {
      const anchor = gridRef.current
      const offset = 380 // Show filters button, video card, and start of products grid
      const top = anchor ? (anchor.getBoundingClientRect().top + window.scrollY - offset) : 180
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }, [])

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch ALL products - API handles batching internally for datasets > 1000
        const timestamp = Date.now()
        const response = await fetch(`/api/products?limit=10000&_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        console.log('[Products] API response status:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('[Products] API response:', {
          success: result.success,
          dataLength: result.data?.length || 0,
          pagination: result.pagination,
          timestamp: result.timestamp
        })
        
        // Validate response structure
        if (!result.success) {
          throw new Error(`API error: ${result.message || result.error || 'Unknown error'}`)
        }
        
        // Extract products and pagination metadata
        const productsData = result.data || []
        const paginationMeta = result.pagination
        
        // Update total count from server
        if (paginationMeta?.total !== undefined) {
          setTotalProductCount(paginationMeta.total)
          console.log('[Products] Database total count:', paginationMeta.total)
        }
        
        // Fetch categories
        const categoriesData = await getCategories()
        
        console.log('[Products] Loaded products:', productsData?.length || 0)
        if (productsData && productsData.length > 0) {
          const withBrands = productsData.filter((p: Product) => p.brands && p.brands.length > 0)
          console.log('[Products] Products with brands:', withBrands.length)
          if (withBrands.length > 0) {
            console.log('[Products] Sample product with brands:', withBrands[0].name, 'brands:', withBrands[0].brands)
          }
        }
        setProducts(productsData || [])
        setCategories(categoriesData || [])
        setFilteredProducts(productsData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        setProducts([])
        setFilteredProducts([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Debounce search term to improve performance
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300) // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Initialize category from URL (?category=)
  useEffect(() => {
    const param = searchParams?.get('category')
    if (!param) return

    const raw = String(param).trim()
    const val = raw.toLowerCase()
    const slugVal = slugify(raw)

    console.debug('[Products] URL category param:', { raw, val, slugVal })
    if (categories?.length) {
      console.debug('[Products] Available categories:', categories.map(c => ({ id: String(c.id), name: c.name, slug: (c.slug || '') })))
    }

    if (val === 'all') {
      setSelectedCategory('all')
      return
    }

    // If categories are not loaded yet, wait to resolve instead of falling back to search
    if (!categories || categories.length === 0) {
      console.debug('[Products] Categories not loaded yet; deferring category resolution')
      return
    }

    // Try to match a UUID id from param
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)
    if (isUuid) {
      const byId = categories.find(c => String(c.id).toLowerCase() === val)
      if (byId) {
        console.debug('[Products] Matched UUID category id:', { id: String(byId.id), name: byId.name })
        setSelectedCategory(String(byId.id))
        return
      }
    }

    // Numeric id provided
    if (/^\d+$/.test(val)) {
      const byNum = categories.find(c => String(c.id).toLowerCase() === val)
      if (byNum) {
        console.debug('[Products] Matched numeric category id:', { id: String(byNum.id), name: byNum.name })
        setSelectedCategory(String(byNum.id))
        return
      }
    }

    // Exact match by id, slug, name, or slugified name
    const match = categories.find((c) => {
      const cid = String(c.id).toLowerCase()
      const cslug = (c.slug || '').toLowerCase()
      const cname = (c.name || '').toLowerCase()
      const cnameSlug = slugify(c.name || '')
      return (
        cid === val ||
        cslug === val ||
        cslug === slugVal ||
        cname === val ||
        cnameSlug === slugVal
      )
    })
    if (match) {
      console.debug('[Products] Matched category exactly:', { id: String(match.id), name: match.name })
      setSelectedCategory(String(match.id))
      return
    }

    // Fallback: partial match on slug or name (e.g., "anime" matches "Anime Merchandise")
    const partial = categories.find((c) => {
      const cslug = (c.slug || '').toLowerCase()
      const cname = (c.name || '').toLowerCase()
      const cnameSlug = slugify(c.name || '')
      return (
        cslug.includes(val) ||
        cslug.includes(slugVal) ||
        cname.includes(val) ||
        cnameSlug.includes(slugVal)
      )
    })
    if (partial) {
      console.debug('[Products] Partially matched category:', { id: String(partial.id), name: partial.name })
      setSelectedCategory(String(partial.id))
      return
    }

    // Last resort: use the term as a search keyword only if not manually searching
    if (!isManualSearch) {
      console.debug('[Products] No category match. Falling back to search term.')
      setSearchTerm(val)
    }
  }, [searchParams, categories, isManualSearch])

  // Initialize search keyword from URL (?query=) only if no category param or category=all and not manually searching
  useEffect(() => {
    const q = searchParams?.get('query')
    const cat = searchParams?.get('category')
    if (q && (!cat || String(cat).toLowerCase() === 'all') && !isManualSearch) {
      setSearchTerm(String(q))
    }
  }, [searchParams, isManualSearch])

  // Filter and sort products (use debounced search term for better performance)
  useEffect(() => {
    let filtered = [...products]

    // Enhanced search filter with debounced term (name, description, brands, categories)
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      console.log('[Products] Searching for:', searchLower)
      filtered = filtered.filter(product => {
        // Check product name and description
        const nameMatch = product.name.toLowerCase().includes(searchLower)
        const descMatch = (product.description || '').toLowerCase().includes(searchLower)
        
        // Check brands
        const brandMatch = product.brands && Array.isArray(product.brands) && product.brands.length > 0 &&
          product.brands.some(brand => brand.toLowerCase().includes(searchLower))
        
        if (brandMatch) {
          console.log('[Products] Brand match:', product.name, 'brands:', product.brands)
        }
        
        // Check category names
        let categoryMatch = false
        if (product.categories && Array.isArray(product.categories)) {
          categoryMatch = product.categories.some(cat => {
            const catName = cat.category?.name?.toLowerCase() || ''
            return catName.includes(searchLower)
          })
        } else if (product.categories && !Array.isArray(product.categories)) {
          const catName = product.categories.name?.toLowerCase() || ''
          categoryMatch = catName.includes(searchLower)
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
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, debouncedSearchTerm, selectedCategory, sortBy, showMostPopular])

  // Pagination: Mobile (3 cols × 8 rows = 24), Desktop (4 cols × 6 rows = 24)
  // Using 24 items to ensure complete rows on both mobile and desktop
  const itemsPerPage = viewMode === 'grid' ? 24 : 6
  
  // Determine if filters that REDUCE the dataset are active
  // Note: Sorting (sortBy, showMostPopular) doesn't change total count, only reorders
  const hasDataReducingFilters = debouncedSearchTerm || selectedCategory !== 'all'
  
  // Calculate total pages based on:
  // - Database total count when no data-reducing filters active (accurate server count)
  // - Filtered products length when search/category filters are active (client-side filtered count)
  const baseCount = hasDataReducingFilters ? filteredProducts.length : (totalProductCount > 0 ? totalProductCount : filteredProducts.length)
  const totalPages = Math.max(1, Math.ceil(baseCount / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (showMostPopular ? 1 : 0)

  // Stable handlers to prevent input focus loss
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIsManualSearch(true)
    setSearchTerm(e.target.value)
  }, [])

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
    setSearchTerm('')
    setSelectedCategory('all')
    setSortBy('name')
    setShowMostPopular(false)
    setIsManualSearch(false)
    setIsFilterSheetOpen(false)
  }, [])

  const FiltersPanel = useMemo(() => (
    <>
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
            onChange={handleSearchChange}
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
    </>
  ), [searchTerm, selectedCategory, sortBy, showMostPopular, categories, handleSearchChange, handleSearchKeyDown, handleCategoryChange, handleSortChange, handleClearFilters])

  // Optimized loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
          <div className="animate-pulse">
            {/* Hero skeleton */}
            <div className="h-40 bg-gray-200 rounded-lg mb-6"></div>
            
            {/* Header skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-10"></div>
                <div className="h-10 bg-gray-200 rounded w-10"></div>
              </div>
            </div>
            
            {/* Products grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="hidden lg:block">
                <div className="h-80 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <ShopHero imageSrc="/officespace.png" title="Shop" />
        {/* Category row below hero */}
        <div className="mt-4">
          <CategoryBar 
            categories={categories} 
            onMobileCategorySelect={handleMobileCategorySelect}
          />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb removed per design refresh */}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">All Products</h1>
            <p className="text-gray-600">
              Showing {displayedProducts.length} of {totalProductCount > 0 ? totalProductCount : filteredProducts.length} products
            </p>
          </div>
          
          {/* Mobile Filters + View Toggle */}
          <div className="flex items-center gap-2 mt-4 lg:mt-0">
            {/* Mobile Filters Sheet Trigger */}
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
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
                  {FiltersPanel}
                </div>
              </SheetContent>
            </Sheet>
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
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h3>
                  {FiltersPanel}
                </CardContent>
              </Card>
              
              {/* Video Card - Below filters on desktop */}
              <VideoCard 
                src="/officetour.mp4"
                className="w-full h-80 lg:h-96"
              />
            </div>
          </div>

          {/* Mobile Video Card - Positioned after header */}
          <div className="lg:hidden ">
            <VideoCard 
              src="/officetour.mp4"
              className="w-full aspect-video"
            />
          </div>

          {/* Products Grid/List */}
          <div className="lg:col-span-3">
            {/* Anchor used for mobile scroll into view when filters close */}
            <div ref={gridRef} aria-hidden className="h-0" />
            <ErrorBoundary fallback={ProductsErrorFallback}>
              {displayedProducts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="text-gray-400 mb-4">
                      <Search className="h-16 w-16" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 text-center">
                      Try adjusting your search criteria or filters to find what you&apos;re looking for.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Products Grid */}
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-3 md:grid-cols-4 gap-3'
                        : 'space-y-4'
                    }
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} variant={viewMode} compact />
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
            </ErrorBoundary>
          </div>
        </div>

      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh] pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
