'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
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
  List, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getProducts, getCategories } from '@/lib/database'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { Product, Category } from '@/lib/types'
import { ProductCard } from '@/components/shared/ProductCard'
import ErrorBoundary from '@/components/ErrorBoundary'
import { ProductsErrorFallback } from '@/components/ErrorFallbacks'
import { LoadingSpinner, VideoCard } from '@/components/shared'
import ShopHero from '@/components/ShopHero'

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(100), // Get more products for filtering
          getCategories()
        ])
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

    // Last resort: use the term as a search keyword
    console.debug('[Products] No category match. Falling back to search term.')
    setSearchTerm(val)
  }, [searchParams, categories])

  // Initialize search keyword from URL (?query=) only if no category param or category=all
  useEffect(() => {
    const q = searchParams?.get('query')
    const cat = searchParams?.get('category')
    if (q && (!cat || String(cat).toLowerCase() === 'all')) setSearchTerm(String(q))
  }, [searchParams])

  // Removed columns tracking; pagination is fixed to 4 rows for stability

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        String(product.category_id) === selectedCategory ||
        String(product.categories?.id ?? '') === selectedCategory
      )
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
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setCurrentPage(1)
  }, [products, searchTerm, selectedCategory, sortBy])

  // Add to cart handled inside ProductCard

  // Pagination (4 rows per page in grid view)
  const itemsPerPage = viewMode === 'grid' ? 12 : 3
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  const activeFiltersCount = (searchTerm ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0)

  const FiltersPanel = () => (
    <>
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

      {/* Price Range removed */}

      {/* Sort By */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Sort By</label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setSearchTerm('')
          setSelectedCategory('all')
          setSortBy('name')
        }}
      >
        Clear All Filters
      </Button>
    </>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading products..." fullScreen />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <ShopHero imageSrc="/officespace.png" title="Shop" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-600 mb-7">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Products</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="hidden md:block">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">All Products</h1>
            <p className="text-gray-600">
              Showing {displayedProducts.length} of {filteredProducts.length} products
            </p>
          </div>
          
          {/* Mobile Filters + View Toggle */}
          <div className="flex items-center gap-2 mt-4 lg:mt-0">
            {/* Mobile Filters Sheet Trigger */}
            <Sheet>
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
                  <FiltersPanel />
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
              <Card className="max-h-[calc(100vh-32rem)] overflow-auto">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </h3>
                  <FiltersPanel />
                </CardContent>
              </Card>
              
              {/* Video Card - Below filters on desktop */}
              <VideoCard 
                src="/officetour.mp4" 
                poster="/officespace.png"
                className="w-full h-80 lg:h-96"
              />
            </div>
          </div>

          {/* Mobile Video Card - Positioned after header */}
          <div className="lg:hidden ">
            <VideoCard 
              src="/officetour.mp4" 
              poster="/officespace.png"
              className="w-full aspect-video"
            />
          </div>

          {/* Products Grid/List */}
          <div className="lg:col-span-3">
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
                        ? 'grid grid-cols-3 gap-2'
                        : 'space-y-4'
                    }
                  >
                    {displayedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} variant={viewMode} compact />
                    ))}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-3 mt-12">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
                    </div>
                  )}
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
        <div className="flex items-center justify-center min-h-[50vh]">
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
