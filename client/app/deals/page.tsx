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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Percent, 
  ShoppingCart, 
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { PriceDisplay } from '@/components/PriceDisplay'
import Image from 'next/image'
import { getCategories } from '@/lib/database'
import { Category } from '@/lib/types'

import { LoadingSpinner, VideoCard } from '@/components/shared'
import ShopHero from '@/components/ShopHero'
interface Deal {
  id: string
  name: string
  description: string
  originalPrice: number
  dealPrice: number
  currentPrice: number
  discount: number
  image_url: string
  category: string
  category_id: string
  rating?: number | null
  reviews_count?: number | null
  view_count?: number
  stock_quantity: number
  slug: string
  tags: string[]
  created_at: string
}


function DealsContent() {
  const searchParams = useSearchParams()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('discount')
  const [showMostPopular, setShowMostPopular] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  
  const { addItem } = useCartStore()
  
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])
  
  // Fetch deals and categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [dealsResponse, categoriesData] = await Promise.all([
          fetch('/api/deals'),
          getCategories()
        ])
        if (!dealsResponse.ok) {
          throw new Error('Failed to fetch deals')
        }
        const dealsData = await dealsResponse.json()
        console.log('[Deals] Fetched deals:', dealsData.deals?.length || 0)
        console.log('[Deals] Fetched categories:', categoriesData?.length || 0)
        if (dealsData.deals?.length > 0) {
          console.log('[Deals] Sample deal:', dealsData.deals[0])
        }
        setDeals(dealsData.deals || [])
        setFilteredDeals(dealsData.deals || [])
        setCategories(categoriesData || [])
      } catch (err) {
        console.error('[Deals] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load deals')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Initialize category from URL (?category=)
  useEffect(() => {
    const param = searchParams?.get('category')
    if (!param || !categories.length) return
    
    const paramLower = String(param).toLowerCase()
    console.log('[Deals] URL category param:', param, 'Categories loaded:', categories.length)
    
    // Try to match category by ID, slug, or name
    const match = categories.find((c) => {
      const cid = String(c.id).toLowerCase()
      const cslug = (c.slug || '').toLowerCase()
      const cname = (c.name || '').toLowerCase()
      return cid === paramLower || cslug === paramLower || cname === paramLower
    })
    
    if (match) {
      console.log('[Deals] Matched category:', match.name, 'ID:', match.id)
      setSelectedCategory(String(match.id))
    } else {
      console.log('[Deals] No category match found for:', param)
    }
  }, [searchParams, categories])
  
  // Removed unused responsive columns tracking to reduce noise

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

    // Category filter - support both category name and ID
    if (selectedCategory !== 'all') {
      console.log('[Deals] Filtering by category:', selectedCategory)
      const matchingCategory = categories.find(c => String(c.id) === selectedCategory)
      console.log('[Deals] Matching category object:', matchingCategory)
      console.log('[Deals] Deals before filter:', filtered.length)
      console.log('[Deals] Sample deal categories:', filtered.slice(0, 3).map(d => ({ name: d.name, category: d.category, category_id: d.category_id })))
      
      filtered = filtered.filter(deal => {
        // Check if selectedCategory is a category ID
        if (matchingCategory) {
          // Match by category name
          return deal.category === matchingCategory.name
        }
        // Fallback: match by category name directly
        return deal.category === selectedCategory
      })
      console.log('[Deals] Deals after filter:', filtered.length)
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
        case 'discount':
          return b.discount - a.discount
        case 'price-low':
          return a.dealPrice - b.dealPrice
        case 'price-high':
          return b.dealPrice - a.dealPrice
        case 'rating':
          {
            const ar = a.rating
            const br = b.rating
            if (br == null && ar == null) return 0
            if (br == null) return 1 // place unrated after rated
            if (ar == null) return -1
            return br - ar
          }
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

    setFilteredDeals(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy, showMostPopular, deals, categories])

  // Pagination (align with shop page: 12 items for grid, 6 for list)
  const itemsPerPage = viewMode === 'grid' ? 12 : 6
  const totalPages = Math.max(1, Math.ceil(filteredDeals.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedDeals = filteredDeals.slice(startIndex, startIndex + itemsPerPage)

  const handleAddToCart = (deal: Deal) => {
    addItem({
      id: deal.id,
      name: deal.name,
      price: deal.dealPrice,
      image_url: deal.image_url
    })
  }

  const FiltersPanel = () => (
    <>
      {/* Search */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search deals..."
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
              <SelectItem key={category.id} value={String(category.id)}>
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
            <SelectItem value="discount">Biggest Discount</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
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
            <p className="text-xs text-gray-500 mt-1 leading-tight">Show most viewed deals first</p>
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
          setSearchTerm('')
          setSelectedCategory('all')
          setSortBy('discount')
          setShowMostPopular(false)
        }}
      >
        Clear All Filters
      </Button>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section (match Shop page styling) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <ShopHero imageSrc="/deals-hero.png" title="Deals" ctaHref="/products" ctaLabel="Continue Shopping" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center space-x-2 text-sm text-gray-600 mb-7">
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-900">Deals</span>
        </nav>


        {/* Loading State */}
        {loading && (
          <LoadingSpinner text="Loading deals..." />
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Page Header with Mobile Filters */}
        {!loading && !error && (
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">All Deals</h2>
              <p className="text-gray-600">
                Showing {displayedDeals.length} of {filteredDeals.length} deals
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
                    Filters
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
        )}

        {/* Mobile Video Card - Positioned after header */}
        <div className="lg:hidden mb-5">
          <VideoCard 
            src="/deals-hero.mp4" 
            poster="/deals-hero.png"
            className="w-full aspect-video"
          />
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
                  <FiltersPanel />
                </CardContent>
              </Card>
              {/* Video Card - Below filters on desktop */}
              <VideoCard 
                src="/deals-hero.mp4" 
                poster="/deals-hero.png"
                className="w-full h-80 lg:h-96"
              />
            </div>
          </div>

          {/* Deals Grid/List */}
          <div className="lg:col-span-3">
            {!loading && !error && (
              <>
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
                  <>
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-3 gap-2' 
                      : 'space-y-4'
                    }>
                      {displayedDeals.map((deal) => (
                        <Card key={deal.id} className="group hover:shadow-lg transition-shadow h-full">
                          <CardContent className={viewMode === 'grid' ? 'p-1.5 sm:p-2 flex h-full flex-col' : 'p-4 flex gap-4'}>
                            {/* Product Image */}
                            <Link href={`/products/${deal.id}`} className={viewMode === 'grid' 
                              ? 'aspect-square bg-gray-100 rounded-md mb-1 sm:mb-2 overflow-hidden relative block' 
                              : 'w-24 h-24 bg-gray-100 rounded-md flex-shrink-0 relative block'
                            }>
                              <Image
                                src={deal.image_url}
                                alt={deal.name}
                                fill
                                className="object-cover"
                                sizes={viewMode === 'grid' 
                                  ? '(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw' 
                                  : '96px'
                                }
                              />
                              <Badge className="absolute top-1 right-1 bg-green-600 text-xs px-1 py-0.5">
                                -{deal.discount}%
                              </Badge>
                            </Link>

                            <div className={viewMode === 'grid' ? 'flex-1 flex flex-col px-1 py-0 sm:px-0 sm:py-0' : 'flex-1 min-w-0'}>
                              {/* Product Info */}
                              <div className={viewMode === 'grid' ? 'mb-1 sm:mb-1.5' : 'mb-3'}>
                                <div className={`text-blue-600 font-medium mb-1 ${
                                  viewMode === 'grid' ? 'text-[10px] sm:text-xs' : 'text-xs'
                                }`}>
                                  {deal.category}
                                </div>
                                <Link href={`/products/${deal.id}`}>
                                  <h3 className={`font-medium text-gray-900 group-hover:text-blue-600 transition-colors leading-tight ${
                                    viewMode === 'grid' ? 'text-[11px] sm:text-sm line-clamp-1 sm:line-clamp-2' : 'text-base line-clamp-2'
                                  }`}>
                                    {deal.name}
                                  </h3>
                                </Link>
                                {viewMode === 'list' && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {deal.description}
                                  </p>
                                )}
                              </div>

                              {/* Price & Actions */}
                              <div className={viewMode === 'grid' ? 'flex flex-col mt-auto space-y-1 sm:space-y-1.5' : 'flex items-center justify-between gap-3 flex-wrap'}>
                                <div className={viewMode === 'grid' ? 'min-w-0' : 'flex-1 min-w-0'}>
                                  <div className={viewMode === 'grid' ? 'flex flex-col gap-0' : 'flex items-center gap-2 flex-wrap'}>
                                    <PriceDisplay 
                                      price={deal.dealPrice} 
                                      className={`font-bold text-red-600 whitespace-normal break-words leading-tight ${
                                        viewMode === 'grid' ? 'text-xs sm:text-sm' : 'text-lg'
                                      }`} 
                                    />
                                    {deal.discount > 0 && deal.originalPrice > deal.dealPrice && (
                                      <PriceDisplay 
                                        price={deal.originalPrice} 
                                        className={`text-gray-500 line-through whitespace-normal break-words leading-tight ${
                                          viewMode === 'grid' ? 'text-[9px] sm:text-xs' : 'text-xs'
                                        }`} 
                                      />
                                    )}
                                  </div>
                                  {deal.stock_quantity > 0 ? (
                                    <div className={`text-green-600 ${
                                      viewMode === 'grid' ? 'text-[9px] sm:text-xs' : 'text-xs'
                                    }`}>In Stock</div>
                                  ) : (
                                    <div className={`text-red-600 ${
                                      viewMode === 'grid' ? 'text-[9px] sm:text-xs' : 'text-xs'
                                    }`}>Out of Stock</div>
                                  )}
                                </div>
                                
                                <div className={`flex gap-2 ${
                                  viewMode === 'grid' ? 'justify-center pt-0.5 sm:pt-1' : 'shrink-0'
                                }`}>
                                  <Button
                                    size={viewMode === 'grid' ? 'sm' : 'sm'}
                                    onClick={() => handleAddToCart(deal)}
                                    disabled={deal.stock_quantity === 0}
                                    variant={viewMode === 'grid' ? 'secondary' : 'default'}
                                    className={viewMode === 'grid' 
                                      ? 'w-full h-7 sm:h-8 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 text-[10px] sm:text-xs px-2' 
                                      : 'shrink-0 whitespace-nowrap'}
                                  >
                                    <ShoppingCart className={viewMode === 'grid' 
                                      ? 'h-2.5 w-2.5 mr-0.5 sm:h-3 sm:w-3 sm:mr-1' 
                                      : 'h-3 w-3 mr-1'
                                    } />
                                    {viewMode === 'list' ? 'Add to Cart' : 'Add'}
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

export default function DealsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading deals..." />
      </div>
    }>
      <DealsContent />
    </Suspense>
  )
}
