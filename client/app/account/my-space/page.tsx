'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { LoadingSpinner } from '@/components/shared'
import { ProductCard } from '@/components/shared/ProductCard'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Sliders, 
  Settings, 
  Tag, 
  Heart, 
  EyeOff, 
  DollarSign,
  ArrowUpDown,
  X,
  Star,
  TrendingUp,
  Package,
  Filter
} from 'lucide-react'
import { useCurrency } from '@/lib/currency-context'
import type { Product as GlobalProduct } from '@/lib/types'

interface UserPreferences {
  preferred_categories: string[]
  muted_categories: string[]
  followed_brands: string[]
  blocked_brands: string[]
  default_sort_order: string
  show_deals_only: boolean
  max_price_filter: number | null
  recently_viewed_products: string[]
  preferences_updated_at: string | null
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  rating: number | null
  reviews_count: number | null
  view_count?: number
  is_deal: boolean | null
  deal_price: number | null
  original_price: number | null
  is_new: boolean | null
  is_featured: boolean | null
  stock_quantity: number | null
  slug: string | null
  brands: string[] | null
  categories?: { name: string } | null
  created_at?: string
  product_images?: Array<{
    id: string
    url: string
    is_main: boolean | null
    sort_order: number | null
  }>
}

interface Category {
  id: string
  name: string
  description: string | null
}

const MySpacePage = () => {
  const { user, loading: authLoading } = useAuth()
  const { formatPrice } = useCurrency()
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    preferred_categories: [],
    muted_categories: [],
    followed_brands: [],
    blocked_brands: [],
    default_sort_order: 'popular',
    show_deals_only: false,
    max_price_filter: null,
    recently_viewed_products: [],
    preferences_updated_at: null
  })
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'settings'>('feed')
  // Feed pagination & caching
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const fetchedPages = useRef<Set<number>>(new Set())
  const sentinelRef = useRef<HTMLDivElement>(null)
  // Hero carousel state
  const [heroIndex, setHeroIndex] = useState(0)
  
  // Select states for dropdowns
  const [maxPrice, setMaxPrice] = useState('')
  
  // Search/filter states for dropdowns
  const [categorySearch, setCategorySearch] = useState('')
  const [mutedCategorySearch, setMutedCategorySearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [blockedBrandSearch, setBlockedBrandSearch] = useState('')
  
  // Dropdown open states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [mutedCategoryDropdownOpen, setMutedCategoryDropdownOpen] = useState(false)
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false)
  const [blockedBrandDropdownOpen, setBlockedBrandDropdownOpen] = useState(false)

  // Refs for click-outside handling
  const categoryRef = useRef<HTMLDivElement>(null)
  const mutedCategoryRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const blockedBrandRef = useRef<HTMLDivElement>(null)

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false)
      }
      if (mutedCategoryRef.current && !mutedCategoryRef.current.contains(event.target as Node)) {
        setMutedCategoryDropdownOpen(false)
      }
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setBrandDropdownOpen(false)
      }
      if (blockedBrandRef.current && !blockedBrandRef.current.contains(event.target as Node)) {
        setBlockedBrandDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch preferences, categories and brands on mount
  useEffect(() => {
    if (user) {
      fetchPreferences()
      fetchCategories()
      fetchBrands()
    }
  }, [user])

  // Reset feed and fetch first page when preferences change or tab switches to feed
  useEffect(() => {
    if (!(user && activeTab === 'feed')) return
    setProducts([])
    setPage(0)
    setHasMore(true)
    fetchedPages.current.clear()
    void fetchFeedPage(0, true)
  }, [activeTab, user, preferences])

  // Infinite scroll observer
  useEffect(() => {
    if (activeTab !== 'feed') return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          void fetchFeedPage(page + 1)
        }
      },
      { rootMargin: '800px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [activeTab, hasMore, loadingMore, page])

  // Hero carousel auto-rotation
  useEffect(() => {
    if (activeTab !== 'feed' || products.length === 0) return
    
    const hasPreferences = preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0
    
    // Helper to check if product matches preferences
    const matchesPreferences = (p: Product) => {
      if (!hasPreferences) return false
      const catName = p.categories?.name
      const matchesCat = catName && preferences.preferred_categories.includes(catName)
      
      // brands is an array of strings, check if any brand matches
      const matchesBrand = Array.isArray(p.brands) && p.brands.some((brand: string) => 
        preferences.followed_brands.includes(brand)
      )
      
      return matchesCat || matchesBrand
    }
    
    // Use shared comparison function for sorting within groups
    const compareProductsLocal = (a: Product, b: Product) => {
      const aCat = a.categories?.name && preferences.preferred_categories.includes(a.categories.name) ? 1 : 0
      const bCat = b.categories?.name && preferences.preferred_categories.includes(b.categories.name) ? 1 : 0
      if (aCat !== bCat) return bCat - aCat
      
      // Check if any brand in the product's brands array matches followed brands
      const aBrand = Array.isArray(a.brands) && a.brands.some((brand: string) => 
        preferences.followed_brands.includes(brand)
      ) ? 1 : 0
      const bBrand = Array.isArray(b.brands) && b.brands.some((brand: string) => 
        preferences.followed_brands.includes(brand)
      ) ? 1 : 0
      if (aBrand !== bBrand) return bBrand - aBrand
      
      const sortOrder = preferences.default_sort_order || 'popular'
      switch (sortOrder) {
        case 'popular':
          if ((b.view_count || 0) !== (a.view_count || 0)) {
            return (b.view_count || 0) - (a.view_count || 0)
          }
          break
        case 'newest':
          const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
          const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
          if (bDate !== aDate) return bDate - aDate
          break
        case 'price_low':
          const aPrice = a.deal_price || a.price || 0
          const bPrice = b.deal_price || b.price || 0
          if (aPrice !== bPrice) return aPrice - bPrice
          break
        case 'price_high':
          const aPriceHigh = a.deal_price || a.price || 0
          const bPriceHigh = b.deal_price || b.price || 0
          if (bPriceHigh !== aPriceHigh) return bPriceHigh - aPriceHigh
          break
      }
      
      const aFeatured = a.is_featured ? 1 : 0
      const bFeatured = b.is_featured ? 1 : 0
      if (aFeatured !== bFeatured) return bFeatured - aFeatured
      
      const bFinalDate = b.created_at ? new Date(b.created_at).getTime() : 0
      const aFinalDate = a.created_at ? new Date(a.created_at).getTime() : 0
      return bFinalDate - aFinalDate
    }
    
    // Get preferred products first
    const preferredProducts = products.filter(matchesPreferences)
    let preferred = preferredProducts.filter(p => p.is_featured || p.is_new || p.is_deal)
    if (preferred.length === 0 && preferredProducts.length > 0) {
      preferred = [...preferredProducts]
    }
    
    // Get non-preferred as fallback
    let nonPreferred = products.filter(p => !matchesPreferences(p)).filter(p => p.is_featured || p.is_new || p.is_deal)
    if (nonPreferred.length === 0 && products.length > 0 && preferred.length === 0) {
      nonPreferred = products.filter(p => !matchesPreferences(p))
    }
    
    preferred.sort(compareProductsLocal)
    nonPreferred.sort(compareProductsLocal)
    
    const heroPool = [...preferred, ...nonPreferred].slice(0, 5)
    
    if (heroPool.length <= 1) return
    
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroPool.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [activeTab, products, preferences.preferred_categories, preferences.followed_brands, preferences.default_sort_order])

  // Fetch a page of products (append or replace)
  const fetchFeedPage = async (targetPage: number, replace = false) => {
    if (fetchedPages.current.has(targetPage)) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/user/personalized-products?limit=20&page=${targetPage}`)
      if (res.ok) {
        const data = await res.json()
        const newItems: Product[] = data.products || []
        setProducts((prev) => {
          const byId = new Set(replace ? [] : prev.map((p) => p.id))
          const merged = replace ? [] as Product[] : [...prev]
          for (const p of newItems) {
            if (!byId.has(p.id)) merged.push(p)
          }
          return merged
        })
        fetchedPages.current.add(targetPage)
        setHasMore(newItems.length >= 20)
        setPage(targetPage)
      }
    } catch (error) {
      console.error('Error fetching feed page:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  const fetchPreferences = async () => {
    try {
      const res = await fetch('/api/user/preferences')
      if (res.ok) {
        const data = await res.json()
        setPreferences(data.preferences)
        if (data.preferences.max_price_filter) {
          setMaxPrice(data.preferences.max_price_filter.toString())
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/brands')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  // Unused - keeping for potential future use
  // const fetchPersonalizedProducts = async () => {
  //   try {
  //     const res = await fetch('/api/user/personalized-products?limit=20')
  //     if (res.ok) {
  //       const data = await res.json()
  //       setProducts(data.products || [])
  //     }
  //   } catch (error) {
  //     console.error('Error fetching products:', error)
  //   }
  // }

  const savePreferences = async (updates: Partial<UserPreferences>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (res.ok) {
        const data = await res.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  // Handlers for preferences
  const addPreferredCategory = (categoryName: string) => {
    if (categoryName && !preferences.preferred_categories.includes(categoryName)) {
      const updated = [...preferences.preferred_categories, categoryName]
      savePreferences({ preferred_categories: updated })
    }
  }

  const removePreferredCategory = (category: string) => {
    const updated = preferences.preferred_categories.filter(c => c !== category)
    savePreferences({ preferred_categories: updated })
  }

  const addMutedCategory = (category: string) => {
    if (!preferences.muted_categories.includes(category)) {
      const updated = [...preferences.muted_categories, category]
      // Also remove from preferred if present
      const updatedPreferred = preferences.preferred_categories.filter(c => c !== category)
      savePreferences({ 
        muted_categories: updated,
        preferred_categories: updatedPreferred
      })
    }
  }

  const removeMutedCategory = (category: string) => {
    const updated = preferences.muted_categories.filter(c => c !== category)
    savePreferences({ muted_categories: updated })
  }

  const addFollowedBrand = (brandName: string) => {
    if (brandName && !preferences.followed_brands.includes(brandName)) {
      const updated = [...preferences.followed_brands, brandName]
      savePreferences({ followed_brands: updated })
    }
  }

  const removeFollowedBrand = (brand: string) => {
    const updated = preferences.followed_brands.filter(b => b !== brand)
    savePreferences({ followed_brands: updated })
  }

  const addBlockedBrand = (brand: string) => {
    if (!preferences.blocked_brands.includes(brand)) {
      const updated = [...preferences.blocked_brands, brand]
      // Also remove from followed if present
      const updatedFollowed = preferences.followed_brands.filter(b => b !== brand)
      savePreferences({ 
        blocked_brands: updated,
        followed_brands: updatedFollowed
      })
    }
  }

  const removeBlockedBrand = (brand: string) => {
    const updated = preferences.blocked_brands.filter(b => b !== brand)
    savePreferences({ blocked_brands: updated })
  }

  const updateSortOrder = (order: string) => {
    savePreferences({ default_sort_order: order })
  }

  const toggleDealsOnly = () => {
    savePreferences({ show_deals_only: !preferences.show_deals_only })
  }

  const updateMaxPrice = () => {
    const price = maxPrice.trim() === '' ? null : parseFloat(maxPrice)
    if (price === null || price > 0) {
      savePreferences({ max_price_filter: price })
    }
  }

  if (authLoading || loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </AuthGuard>
    )
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: TrendingUp },
    { value: 'oldest', label: 'Oldest First', icon: Package },
    { value: 'price_low', label: 'Price: Low to High', icon: ArrowUpDown },
    { value: 'price_high', label: 'Price: High to Low', icon: ArrowUpDown },
    { value: 'rating', label: 'Highest Rated', icon: Star },
    { value: 'popular', label: 'Most Popular', icon: Heart },
    { value: 'featured', label: 'Featured', icon: Filter }
  ]

  // Filtered lists for search functionality
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )
  const filteredMutedCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(mutedCategorySearch.toLowerCase())
  )
  const filteredBrands = brands.filter(brand =>
    brand.toLowerCase().includes(brandSearch.toLowerCase())
  )
  const filteredBlockedBrands = brands.filter(brand =>
    brand.toLowerCase().includes(blockedBrandSearch.toLowerCase())
  )

  // Shared comparison function for hierarchical sorting
  const compareProducts = (a: Product, b: Product) => {
    // 1. Preferred categories first
    const aCat = (a.categories?.name && preferences.preferred_categories.includes(a.categories.name)) ? 1 : 0
    const bCat = (b.categories?.name && preferences.preferred_categories.includes(b.categories.name)) ? 1 : 0
    if (aCat !== bCat) return bCat - aCat
    
    // 2. Followed brands second - check if any brand in the array matches
    const aBrand = Array.isArray(a.brands) && a.brands.some((brand: string) => 
      preferences.followed_brands.includes(brand)
    ) ? 1 : 0
    const bBrand = Array.isArray(b.brands) && b.brands.some((brand: string) => 
      preferences.followed_brands.includes(brand)
    ) ? 1 : 0
    if (aBrand !== bBrand) return bBrand - aBrand
    
    // 3. Apply user's default sort order
    const sortOrder = preferences.default_sort_order || 'popular'
    switch (sortOrder) {
      case 'popular':
        if ((b.view_count || 0) !== (a.view_count || 0)) {
          return (b.view_count || 0) - (a.view_count || 0)
        }
        break
      case 'newest':
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
        if (bDate !== aDate) return bDate - aDate
        break
      case 'oldest':
        const aDateOld = a.created_at ? new Date(a.created_at).getTime() : 0
        const bDateOld = b.created_at ? new Date(b.created_at).getTime() : 0
        if (aDateOld !== bDateOld) return aDateOld - bDateOld
        break
      case 'price_low':
        const aPrice = a.deal_price || a.price || 0
        const bPrice = b.deal_price || b.price || 0
        if (aPrice !== bPrice) return aPrice - bPrice
        break
      case 'price_high':
        const aPriceHigh = a.deal_price || a.price || 0
        const bPriceHigh = b.deal_price || b.price || 0
        if (bPriceHigh !== aPriceHigh) return bPriceHigh - aPriceHigh
        break
      case 'rating':
        if ((b.rating || 0) !== (a.rating || 0)) {
          return (b.rating || 0) - (a.rating || 0)
        }
        break
    }
    
    // 4. Fallback: Featured/New/Deal status
    const aFeatured = a.is_featured ? 1 : 0
    const bFeatured = b.is_featured ? 1 : 0
    if (aFeatured !== bFeatured) return bFeatured - aFeatured
    
    const aNew = a.is_new ? 1 : 0
    const bNew = b.is_new ? 1 : 0
    if (aNew !== bNew) return bNew - aNew
    
    const aDeal = a.is_deal ? 1 : 0
    const bDeal = b.is_deal ? 1 : 0
    if (aDeal !== bDeal) return bDeal - aDeal
    
    // 5. Final fallback: newest first
    const bFinalDate = b.created_at ? new Date(b.created_at).getTime() : 0
    const aFinalDate = a.created_at ? new Date(a.created_at).getTime() : 0
    return bFinalDate - aFinalDate
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Sliders className="h-8 w-8 text-gray-700" />
                  <h1 className="text-3xl font-bold text-gray-900">My Space</h1>
                </div>
                {/* User Greeting */}
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-600">Welcome back,</p>
                    <p className="font-semibold text-gray-900">
                      {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Friend'}!
                    </p>
                  </div>
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200">
                      {(user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <p className="text-gray-600">
                Your personalized shopping hub. Customize what you see and discover products tailored to your preferences.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-6 py-3 font-medium transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  My Feed
                </div>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Preferences
                </div>
              </button>
            </div>

            {/* Feed Tab */}
            {activeTab === 'feed' && (
              <div className="space-y-8">
                {products.length === 0 ? (
                  loadingMore ? (
                    <div className="flex items-center justify-center py-12" aria-live="polite">
                      <LoadingSpinner size="lg" />
                      <span className="sr-only">Loading your personalized feed...</span>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No products match your preferences yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your preferences in the settings tab or browse our catalog
                        </p>
                        <Link href="/products">
                          <Button>Browse Products</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                ) : (
                  <>
                    {/* Featured Hero */}
                    {(() => {
                      // Get all products matching ANY preference (category OR brand)
                      const hasPreferences = preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0
                      
                      // Helper to check if product matches preferences
                      const matchesPreferences = (p: Product) => {
                        if (!hasPreferences) return false
                        
                        const catName = p.categories?.name
                        const matchesCat = catName && preferences.preferred_categories.includes(catName)
                        
                        // brands is an array of strings, check if any brand matches
                        const matchesBrand = Array.isArray(p.brands) && p.brands.some((brand: string) => 
                          preferences.followed_brands.includes(brand)
                        )
                        
                        return matchesCat || matchesBrand
                      }
                      
                      // First: Get ALL products that match ANY preference
                      const preferredProducts = products.filter(matchesPreferences)
                      
                      // Debug: Log what's matching
                      if (hasPreferences) {
                        console.log('🎯 Preference Matching Debug:')
                        console.log('Preferred Categories:', preferences.preferred_categories)
                        console.log('Followed Brands:', preferences.followed_brands)
                        console.log('Total products:', products.length)
                        console.log('Matching products:', preferredProducts.length)
                        preferredProducts.slice(0, 3).forEach(p => {
                          const brandStr = Array.isArray(p.brands) ? p.brands.join(', ') : 'none'
                          console.log(`  ✓ ${p.name} - Category: ${p.categories?.name}, Brands: ${brandStr}`)
                        })
                        const nonMatching = products.filter(p => !matchesPreferences(p)).slice(0, 3)
                        nonMatching.forEach(p => {
                          const brandStr = Array.isArray(p.brands) ? p.brands.join(', ') : 'none'
                          console.log(`  ✗ ${p.name} - Category: ${p.categories?.name}, Brands: ${brandStr}`)
                        })
                      }
                      
                      // Then: Get featured/new/deal items from preferred products
                      let preferred = preferredProducts.filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (preferred.length === 0 && preferredProducts.length > 0) {
                        preferred = [...preferredProducts] // Use all preferred if no featured ones
                      }
                      
                      // Get non-preferred featured items as fallback
                      let nonPreferred = products
                        .filter(p => !matchesPreferences(p))
                        .filter(p => p.is_featured || p.is_new || p.is_deal)
                      
                      if (nonPreferred.length === 0 && products.length > 0 && preferred.length === 0) {
                        nonPreferred = products.filter(p => !matchesPreferences(p))
                      }
                      
                      // Sort each group
                      preferred.sort(compareProducts)
                      nonPreferred.sort(compareProducts)
                      
                      // Prefer showing preferred items first, fill with non-preferred only if needed
                      const featured = [...preferred, ...nonPreferred].slice(0, 5)
                      
                      if (featured.length === 0) return null
                      const hero = featured[heroIndex % featured.length]
                      const supporting = featured.filter((_, i) => i !== (heroIndex % featured.length)).slice(0, 3)
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Featured for you</h2>
                            {(preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0) && (
                              <div className="text-sm text-gray-600 hidden sm:flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                <span className="font-medium">
                                  {preferredProducts.length > 0 
                                    ? `${preferredProducts.length} product${preferredProducts.length > 1 ? 's' : ''} match your preferences` 
                                    : 'Curated from your preferences'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Hero Card - Large Featured Item */}
                            <div className="lg:col-span-2">
                              <Link href={`/products/${hero.slug || hero.id}`} className="block h-full">
                                <div className="relative h-[400px] lg:h-full min-h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow group">
                                  {hero.product_images?.[0]?.url || hero.image_url ? (
                                    <Image
                                      key={hero.id}
                                      src={hero.product_images?.[0]?.url || hero.image_url || ''}
                                      alt={hero.name}
                                      fill
                                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 66vw, 800px"
                                      priority
                                      className="object-cover object-center group-hover:scale-105 transition-all duration-1000 animate-fadeIn"
                                    />
                                  ) : null}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-1000" />
                                  <div key={`text-${hero.id}`} className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 transition-opacity duration-500 animate-fadeIn">
                                    {hero.is_new && (
                                      <Badge className="mb-2 bg-blue-500 text-white border-none">New Arrival</Badge>
                                    )}
                                    {hero.is_featured && !hero.is_new && (
                                      <Badge className="mb-2 bg-yellow-500 text-gray-900 border-none">Featured</Badge>
                                    )}
                                    {hero.is_deal && !hero.is_new && !hero.is_featured && (
                                      <Badge className="mb-2 bg-red-500 text-white border-none">Special Deal</Badge>
                                    )}
                                    <h3 className="text-2xl font-bold mb-2 line-clamp-2">{hero.name}</h3>
                                    <div className="flex items-center gap-3">
                                      <span className="text-3xl font-bold">{formatPrice(hero.deal_price || hero.price)}</span>
                                      {hero.is_deal && hero.original_price && (
                                        <span className="text-lg text-gray-300 line-through">{formatPrice(hero.original_price)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Link>
                            </div>

                            {/* Supporting Featured Items */}
                            <div className="space-y-4">
                              {supporting.map((item) => (
                                <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                                  <Link href={`/products/${item.slug || item.id}`} className="block">
                                    <div className="flex gap-3 p-3">
                                      <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {item.product_images?.[0]?.url || item.image_url ? (
                                          <Image
                                            src={item.product_images?.[0]?.url || item.image_url || ''}
                                            alt={item.name}
                                            fill
                                            sizes="80px"
                                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                                          />
                                        ) : null}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                                          {item.name}
                                        </h4>
                                        <div className="flex items-baseline gap-2">
                                          <span className="font-bold text-gray-900">{formatPrice(item.deal_price || item.price)}</span>
                                          {item.is_deal && item.original_price && (
                                            <span className="text-xs text-gray-500 line-through">{formatPrice(item.original_price)}</span>
                                          )}
                                        </div>
                                        {item.is_new && (
                                          <Badge variant="secondary" className="mt-1 text-xs bg-blue-100 text-blue-700 border-none">New</Badge>
                                        )}
                                        {item.is_deal && !item.is_new && (
                                          <Badge variant="secondary" className="mt-1 text-xs bg-red-100 text-red-700 border-none">Deal</Badge>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* For You Row */}
                    {(() => {
                      const used = new Set<string>()
                      const hasPreferences = preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0
                      
                      // Helper to check if product matches preferences
                      const matchesPreferences = (p: Product) => {
                        if (!hasPreferences) return false
                        const catName = p.categories?.name
                        const matchesCat = catName && preferences.preferred_categories.includes(catName)
                        
                        // brands is an array of strings, check if any brand matches
                        const matchesBrand = Array.isArray(p.brands) && p.brands.some((brand: string) => 
                          preferences.followed_brands.includes(brand)
                        )
                        
                        return matchesCat || matchesBrand
                      }
                      
                      // Mark featured items as used
                      const preferredProducts = products.filter(matchesPreferences)
                      let preferred = preferredProducts.filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (preferred.length === 0 && preferredProducts.length > 0) {
                        preferred = [...preferredProducts]
                      }
                      let nonPreferred = products.filter(p => !matchesPreferences(p)).filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (nonPreferred.length === 0 && products.length > 0 && preferred.length === 0) {
                        nonPreferred = products.filter(p => !matchesPreferences(p))
                      }
                      preferred.sort(compareProducts)
                      nonPreferred.sort(compareProducts)
                      const featured = [...preferred, ...nonPreferred].slice(0, 5)
                      featured.forEach(p => used.add(p.id))
                      
                      // Get For You items - ALL products matching ANY preference
                      const available = products.filter(p => !used.has(p.id))
                      const preferredItems = available.filter(matchesPreferences)
                      const nonPreferredItems = available.filter(p => !matchesPreferences(p))
                      
                      preferredItems.sort(compareProducts)
                      nonPreferredItems.sort(compareProducts)
                      
                      // Show ALL preferred items first, then fill with non-preferred
                      const forYou = [...preferredItems, ...nonPreferredItems].slice(0, 10)
                      forYou.forEach(p => used.add(p.id))
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-semibold text-gray-900">For you</h2>
                            {preferredItems.length > 0 && (preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0) && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                                {preferredItems.length} preferred
                              </span>
                            )}
                          </div>
                          <div className="-mx-1 overflow-x-auto pb-1">
                            <div className="flex gap-3 px-1">
                              {forYou.map((p) => (
                                <div key={p.id} className="min-w-[180px] sm:min-w-[220px]">
                                  <ProductCard
                                    product={{ ...p, description: p.description || '' } as GlobalProduct}
                                    variant="grid"
                                    compact
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Category Clusters */}
                    {(() => {
                      const used = new Set<string>()
                      
                      // Mark featured items as used
                      let featured = products.filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (featured.length === 0 && products.length > 0) {
                        featured = [...products]
                      }
                      featured.sort(compareProducts)
                      featured = featured.slice(0, 5)
                      featured.forEach(p => used.add(p.id))
                      
                      // Mark For You items as used
                      let forYouItems = products.filter(p => !used.has(p.id))
                      forYouItems.sort(compareProducts)
                      forYouItems = forYouItems.slice(0, 10)
                      forYouItems.forEach(p => used.add(p.id))
                      
                      const baseList = products.filter(p => !used.has(p.id))
                      const preferred = preferences.preferred_categories || []
                      const presentCats = Array.from(new Set(baseList.map(p => p.categories?.name).filter(Boolean) as string[]))
                      // Show preferred categories first, then other categories
                      const orderedCats = [...preferred, ...presentCats.filter(c => !preferred.includes(c))].slice(0, 4)
                      return (
                        <div className="space-y-8">
                          {orderedCats.map((catName) => {
                            const items = baseList.filter(p => p.categories?.name === catName && !used.has(p.id)).slice(0, 6)
                            items.forEach(p => used.add(p.id))
                            if (items.length === 0) return null
                            return (
                              <div key={catName}>
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-lg font-semibold text-gray-900">{catName}</h3>
                                  <Link href={`/products?category=${encodeURIComponent(catName)}`} className="text-sm text-gray-600 hover:text-gray-900">See all</Link>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                                  {items.map((p) => (
                                    <ProductCard
                                      key={p.id}
                                      product={{ ...p, description: p.description || '' } as GlobalProduct}
                                      variant="grid"
                                      compact
                                    />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* More For You (remaining) */}
                    {(() => {
                      const used = new Set<string>()
                      
                      // Mark featured items as used
                      let featured = products.filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (featured.length === 0 && products.length > 0) {
                        featured = [...products]
                      }
                      featured.sort(compareProducts)
                      featured = featured.slice(0, 5)
                      featured.forEach(p => used.add(p.id))
                      
                      // Mark For You items as used
                      let forYouItems = products.filter(p => !used.has(p.id))
                      forYouItems.sort(compareProducts)
                      forYouItems = forYouItems.slice(0, 10)
                      forYouItems.forEach(p => used.add(p.id))
                      
                      // Mark category cluster items as used
                      const preferred = preferences.preferred_categories || []
                      const baseList = products.filter(p => !used.has(p.id))
                      const presentCats = Array.from(new Set(baseList.map(p => p.categories?.name).filter(Boolean) as string[]))
                      const orderedCats = [...preferred, ...presentCats.filter(c => !preferred.includes(c))].slice(0, 4)
                      orderedCats.forEach((catName) => {
                        const items = baseList.filter(p => p.categories?.name === catName && !used.has(p.id)).slice(0, 6)
                        items.forEach(p => used.add(p.id))
                      })
                      
                      // Get remaining items - show diverse suggestions from the platform
                      let remaining = products.filter(p => !used.has(p.id))
                      
                      // Sort by popularity and rating for diverse suggestions (not by preferences)
                      remaining.sort((a, b) => {
                        // Prioritize in-stock items
                        const aInStock = (a.stock_quantity || 0) > 0 ? 1 : 0
                        const bInStock = (b.stock_quantity || 0) > 0 ? 1 : 0
                        if (aInStock !== bInStock) return bInStock - aInStock
                        
                        // Then by popularity
                        if ((b.view_count || 0) !== (a.view_count || 0)) {
                          return (b.view_count || 0) - (a.view_count || 0)
                        }
                        
                        // Then by rating
                        if ((b.rating || 0) !== (a.rating || 0)) {
                          return (b.rating || 0) - (a.rating || 0)
                        }
                        
                        // Finally by newest
                        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                      })
                      
                      // Show up to 20 diverse suggestions
                      remaining = remaining.slice(0, 20)
                      
                      if (remaining.length === 0) return null
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-semibold text-gray-900">Discover more</h2>
                            <p className="text-sm text-gray-500">Popular products on TISCO</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {remaining.map((p) => (
                              <ProductCard
                                key={p.id}
                                product={{ ...p, description: p.description || '' } as GlobalProduct}
                                variant="grid"
                                compact
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* You Might Also Like - Discovery Section */}
                    {(() => {
                      const used = new Set<string>()
                      const hasPreferences = preferences.preferred_categories.length > 0 || preferences.followed_brands.length > 0
                      
                      // Helper to check if product matches preferences
                      const matchesPreferences = (p: Product) => {
                        if (!hasPreferences) return false
                        const catName = p.categories?.name
                        const matchesCat = catName && preferences.preferred_categories.includes(catName)
                        
                        // brands is an array of strings, check if any brand matches
                        const matchesBrand = Array.isArray(p.brands) && p.brands.some((brand: string) => 
                          preferences.followed_brands.includes(brand)
                        )
                        
                        return matchesCat || matchesBrand
                      }
                      
                      // Mark all previously shown items as used
                      const preferredProducts = products.filter(matchesPreferences)
                      let preferred = preferredProducts.filter(p => p.is_featured || p.is_new || p.is_deal)
                      if (preferred.length === 0 && preferredProducts.length > 0) {
                        preferred = [...preferredProducts]
                      }
                      preferred.sort(compareProducts)
                      preferred.slice(0, 5).forEach(p => used.add(p.id))
                      
                      const available = products.filter(p => !used.has(p.id))
                      const preferredItems = available.filter(matchesPreferences)
                      preferredItems.sort(compareProducts)
                      preferredItems.slice(0, 10).forEach(p => used.add(p.id))
                      
                      const baseList = products.filter(p => !used.has(p.id))
                      const preferredCats = preferences.preferred_categories || []
                      const presentCats = Array.from(new Set(baseList.map(p => p.categories?.name).filter(Boolean) as string[]))
                      const orderedCats = [...preferredCats, ...presentCats.filter(c => !preferredCats.includes(c))].slice(0, 4)
                      orderedCats.forEach((catName) => {
                        const items = baseList.filter(p => p.categories?.name === catName && !used.has(p.id)).slice(0, 6)
                        items.forEach(p => used.add(p.id))
                      })
                      
                      const remaining = products.filter(p => !used.has(p.id))
                      remaining.forEach(p => used.add(p.id))
                      
                      // Get discovery items - products from related categories or similar items
                      const discovery = products.filter(p => !used.has(p.id))
                      if (discovery.length === 0) return null
                      
                      return (
                        <div className="mt-8">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h2 className="text-xl font-semibold text-gray-900">You might also like</h2>
                              <p className="text-sm text-gray-500 mt-1">Explore more products based on trending items</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                            {discovery.slice(0, 15).map((p) => (
                              <ProductCard
                                key={p.id}
                                product={{ ...p, description: p.description || '' } as GlobalProduct}
                                variant="grid"
                                compact
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} />
                    {loadingMore && (
                      <div className="flex items-center justify-center py-6" aria-live="polite">
                        <LoadingSpinner />
                        <span className="sr-only">Loading more...</span>
                      </div>
                    )}
                    {!hasMore && (
                      <div className="text-center text-gray-500 py-6">End of feed</div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Category Preferences - At Top */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Preferred Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-gray-700" />
                        Preferred Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base">Add categories you love</Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Products from these categories will appear first
                        </p>
                        <div ref={categoryRef} className="space-y-2 relative">
                          <Input
                            placeholder="Search categories..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            onFocus={() => setCategoryDropdownOpen(true)}
                            className="w-full"
                          />
                          {categoryDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredCategories
                                .filter(cat => !preferences.preferred_categories.includes(cat.name))
                                .length > 0 ? (
                                filteredCategories
                                  .filter(cat => !preferences.preferred_categories.includes(cat.name))
                                  .map(cat => (
                                    <button
                                      key={cat.id}
                                      onClick={() => {
                                        addPreferredCategory(cat.name)
                                        setCategorySearch('')
                                        setCategoryDropdownOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                                    >
                                      {cat.name}
                                    </button>
                                  ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {categorySearch ? 'No matching categories' : 'All categories added'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {preferences.preferred_categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {preferences.preferred_categories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              {category}
                              <button
                                onClick={() => removePreferredCategory(category)}
                                className="ml-2 hover:text-gray-900 cursor-pointer"
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Muted Categories */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeOff className="h-5 w-5 text-gray-600" />
                        Muted Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base">Hide unwanted categories</Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Products from these categories won&apos;t appear in your feed
                        </p>
                        <div ref={mutedCategoryRef} className="space-y-2 relative">
                          <Input
                            placeholder="Search categories..."
                            value={mutedCategorySearch}
                            onChange={(e) => setMutedCategorySearch(e.target.value)}
                            onFocus={() => setMutedCategoryDropdownOpen(true)}
                            className="w-full"
                          />
                          {mutedCategoryDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredMutedCategories
                                .filter(cat => !preferences.muted_categories.includes(cat.name))
                                .length > 0 ? (
                                filteredMutedCategories
                                  .filter(cat => !preferences.muted_categories.includes(cat.name))
                                  .map(cat => (
                                    <button
                                      key={cat.id}
                                      onClick={() => {
                                        addMutedCategory(cat.name)
                                        setMutedCategorySearch('')
                                        setMutedCategoryDropdownOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                                    >
                                      {cat.name}
                                    </button>
                                  ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {mutedCategorySearch ? 'No matching categories' : 'All categories muted'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {preferences.muted_categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {preferences.muted_categories.map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="px-3 py-1.5 bg-gray-200 text-gray-700"
                            >
                              {category}
                              <button
                                onClick={() => removeMutedCategory(category)}
                                className="ml-2 hover:text-gray-900 cursor-pointer"
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No muted categories yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Horizontal Separator */}
                <div className="border-t border-gray-200 my-6" />

                {/* Brand Preferences - Right After Categories */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Preferred Brands (renamed from Followed Brands) */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-gray-700" />
                        Preferred Brands
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base">Add brands you love</Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Products from these brands will appear first
                        </p>
                        <div ref={brandRef} className="space-y-2 relative">
                          <Input
                            placeholder="Search brands..."
                            value={brandSearch}
                            onChange={(e) => setBrandSearch(e.target.value)}
                            onFocus={() => setBrandDropdownOpen(true)}
                            className="w-full"
                          />
                          {brandDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredBrands
                                .filter(brand => !preferences.followed_brands.includes(brand))
                                .length > 0 ? (
                                filteredBrands
                                  .filter(brand => !preferences.followed_brands.includes(brand))
                                  .map(brand => (
                                    <button
                                      key={brand}
                                      onClick={() => {
                                        addFollowedBrand(brand)
                                        setBrandSearch('')
                                        setBrandDropdownOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                                    >
                                      {brand}
                                    </button>
                                  ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {brandSearch ? 'No matching brands' : 'All brands added'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {preferences.followed_brands.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {preferences.followed_brands.map((brand) => (
                            <Badge
                              key={brand}
                              variant="secondary"
                              className="px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200"
                            >
                              {brand}
                              <button
                                onClick={() => removeFollowedBrand(brand)}
                                className="ml-2 hover:text-gray-900 cursor-pointer"
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Blocked Brands */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <EyeOff className="h-5 w-5 text-gray-600" />
                        Blocked Brands
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-base">Hide specific brands</Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Products from these brands won&apos;t appear in your feed
                        </p>
                        <div ref={blockedBrandRef} className="space-y-2 relative">
                          <Input
                            placeholder="Search brands..."
                            value={blockedBrandSearch}
                            onChange={(e) => setBlockedBrandSearch(e.target.value)}
                            onFocus={() => setBlockedBrandDropdownOpen(true)}
                            className="w-full"
                          />
                          {blockedBrandDropdownOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredBlockedBrands
                                .filter(brand => !preferences.blocked_brands.includes(brand))
                                .length > 0 ? (
                                filteredBlockedBrands
                                  .filter(brand => !preferences.blocked_brands.includes(brand))
                                  .map(brand => (
                                    <button
                                      key={brand}
                                      onClick={() => {
                                        addBlockedBrand(brand)
                                        setBlockedBrandSearch('')
                                        setBlockedBrandDropdownOpen(false)
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-100 cursor-pointer text-sm transition-colors"
                                    >
                                      {brand}
                                    </button>
                                  ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  {blockedBrandSearch ? 'No matching brands' : 'All brands blocked'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {preferences.blocked_brands.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {preferences.blocked_brands.map((brand) => (
                            <Badge
                              key={brand}
                              variant="secondary"
                              className="px-3 py-1.5 bg-gray-200 text-gray-700"
                            >
                              {brand}
                              <button
                                onClick={() => removeBlockedBrand(brand)}
                                className="ml-2 hover:text-gray-900 cursor-pointer"
                                disabled={saving}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No blocked brands yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Horizontal Separator */}
                <div className="border-t border-gray-200 my-6" />

                {/* Sorting Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5 text-gray-700" />
                      Default Sort Order
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => updateSortOrder(option.value)}
                          className={`p-3 rounded-lg border-2 transition-all text-left cursor-pointer ${
                            preferences.default_sort_order === option.value
                              ? 'border-gray-900 bg-gray-50 text-gray-900'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                          disabled={saving}
                        >
                          <option.icon className={`h-5 w-5 mb-1 ${
                            preferences.default_sort_order === option.value
                              ? 'text-gray-900'
                              : 'text-gray-500'
                          }`} />
                          <div className="text-sm font-medium">{option.label}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Deal and Price Filters */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-gray-700" />
                        Deals Only
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="deals-toggle" className="text-base">
                            Show only products on deal
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            Filter your feed to display discounted items only
                          </p>
                        </div>
                        <Switch
                          id="deals-toggle"
                          checked={preferences.show_deals_only}
                          onCheckedChange={toggleDealsOnly}
                          disabled={saving}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-gray-700" />
                        Maximum Price
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label htmlFor="max-price" className="text-base">
                          Set price limit
                        </Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">
                          Only show products below this price
                        </p>
                        <div className="flex gap-2">
                          <Input
                            id="max-price"
                            type="number"
                            placeholder="No limit"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            min="0"
                            step="1000"
                          />
                          <Button
                            onClick={updateMaxPrice}
                            disabled={saving}
                            size="default"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Save indicator */}
                {saving && (
                  <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Saving preferences...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Footer />
        <CartSidebar />
      </div>
    </AuthGuard>
  )
}

export default MySpacePage
