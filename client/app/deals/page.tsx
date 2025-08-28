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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { 
  Search, 
  Filter,
  Grid3X3, 
  List, 
  ShoppingCart,
  Heart,
  Percent,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useCartStore } from '@/lib/store'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { PriceDisplay } from '@/components/PriceDisplay'
import Image from 'next/image'

import { LoadingSpinner } from '@/components/shared'
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
  stock_quantity: number
  slug: string
  tags: string[]
  created_at: string
}


export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('discount')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [columns, setColumns] = useState(1)
  
  const { addItem } = useCartStore()
  
  // Fetch deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/deals')
        if (!response.ok) {
          throw new Error('Failed to fetch deals')
        }
        const data = await response.json()
        setDeals(data.deals || [])
        setFilteredDeals(data.deals || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDeals()
  }, [])
  
  // Track responsive columns to enforce max 3 rows per page
  useEffect(() => {
    const updateColumns = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 0
      if (w >= 1280) setColumns(4) // xl:grid-cols-4
      else if (w >= 1024) setColumns(3) // lg:grid-cols-3
      else if (w >= 640) setColumns(2) // sm:grid-cols-2
      else setColumns(1)
    }
    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])
  
  const categories = Array.from(new Set(deals.map(deal => deal.category)))

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
        default:
          return 0
      }
    })

    setFilteredDeals(filtered)
    setCurrentPage(1)
  }, [searchTerm, selectedCategory, sortBy, deals])

  // Pagination (align with shop page: 12 items for grid, 3 for list)
  const itemsPerPage = viewMode === 'grid' ? 12 : 3
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
              <SelectItem key={category} value={category}>
                {category}
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
          setSortBy('discount')
        }}
      >
        Clear All Filters
      </Button>
    </>
  )

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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h3>
                <FiltersPanel />
              </CardContent>
            </Card>
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
                        <Card key={deal.id} className="group hover:shadow-lg transition-shadow">
                          <CardContent className={viewMode === 'grid' ? 'p-3' : 'p-4 flex gap-4'}>
                            {/* Product Image */}
                            <Link href={`/products/${deal.id}`} className={viewMode === 'grid' 
                              ? 'aspect-square bg-gray-100 rounded-md mb-3 overflow-hidden relative block' 
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

                            <div className={viewMode === 'grid' ? '' : 'flex-1'}>
                              {/* Product Info */}
                              <div className={viewMode === 'grid' ? 'mb-2' : 'mb-3'}>
                                <div className="text-xs text-blue-600 font-medium mb-1">
                                  {deal.category}
                                </div>
                                <Link href={`/products/${deal.id}`}>
                                  <h3 className={`font-medium text-gray-900 group-hover:text-blue-600 transition-colors ${
                                    viewMode === 'grid' ? 'text-sm line-clamp-2' : 'text-base'
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
                              <div className={viewMode === 'grid' ? 'space-y-2' : 'flex items-center justify-between'}>
                                <div>
                                  <div className="flex items-center gap-1">
                                    <PriceDisplay 
                                      price={deal.dealPrice} 
                                      className={`font-bold text-red-600 ${
                                        viewMode === 'grid' ? 'text-sm' : 'text-lg'
                                      }`} 
                                    />
                                    {deal.discount > 0 && deal.originalPrice > deal.dealPrice && (
                                      <PriceDisplay 
                                        price={deal.originalPrice} 
                                        className="text-xs text-gray-500 line-through" 
                                      />
                                    )}
                                  </div>
                                  {deal.stock_quantity > 0 ? (
                                    <div className="text-xs text-green-600">In Stock</div>
                                  ) : (
                                    <div className="text-xs text-red-600">Out of Stock</div>
                                  )}
                                </div>
                                
                                <div className={`flex gap-1 ${
                                  viewMode === 'grid' ? 'justify-center' : ''
                                }`}>
                                  {viewMode === 'list' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="p-2"
                                    >
                                      <Heart className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size={viewMode === 'grid' ? 'sm' : 'sm'}
                                    onClick={() => handleAddToCart(deal)}
                                    disabled={deal.stock_quantity === 0}
                                    className={viewMode === 'grid' ? 'w-full text-xs px-2' : ''}
                                  >
                                    <ShoppingCart className="h-3 w-3 mr-1" />
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
