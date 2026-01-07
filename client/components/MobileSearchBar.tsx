'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { debounce } from '@/lib/shared-utils'

/**
 * Maximum number of search suggestions to display
 */
const MAX_SUGGESTIONS = 8

/**
 * Product suggestion type for search dropdown
 */
interface ProductSuggestion {
  id: string | number
  name: string
  price: number
  image_url?: string
  product_images?: Array<{ url?: string; is_main?: boolean }>
}

/**
 * Mobile-only search bar component with autocomplete
 * Displays above the hero carousel on mobile devices
 * Features dropdown suggestions matching desktop functionality
 */
export const MobileSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<ProductSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search suggestion handler backed by API
  const updateSuggestions = useMemo(
    () => debounce(async (query: string) => {
      // Normalize query: trim and remove extra spaces
      const normalizedQuery = query.trim().replace(/\s+/g, ' ')

      if (normalizedQuery.length === 0) {
        setShowSuggestions(false)
        setSearchSuggestions([])
        return
      }

      try {
        const params = new URLSearchParams({ q: normalizedQuery, limit: String(MAX_SUGGESTIONS) })
        const resp = await fetch(`/api/products/search?${params.toString()}`)
        if (!resp.ok) {
          setShowSuggestions(false)
          setSearchSuggestions([])
          return
        }
        const result = await resp.json()
        // Handle both { data: [...] } format and direct array format
        const products = Array.isArray(result) ? result : (result.data || [])
        const suggestions: ProductSuggestion[] = products
          .filter((p: ProductSuggestion) => p?.name)
          .slice(0, MAX_SUGGESTIONS)
          .map((p: ProductSuggestion) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image_url: p.image_url,
            product_images: p.product_images
          }))
        setSearchSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      } catch {
        setShowSuggestions(false)
        setSearchSuggestions([])
      }
    }, 250),
    []
  )

  // Handle search query changes
  useEffect(() => {
    updateSuggestions(searchQuery)
  }, [searchQuery, updateSuggestions])

  // Close suggestions when clicking outside search area
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }, [searchQuery, handleSearch])

  return (
    <div className="md:hidden px-4 pt-2 pb-1 bg-white">
      <div ref={searchRef} className="relative">
        <Input
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search TISCO..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2.5 w-full text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg shadow-sm"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 max-h-[400px] overflow-y-auto">
            {searchSuggestions.map((product) => {
              // Get the best image: main product_image first, then image_url, then placeholder
              const mainImage = product.product_images?.find(img => img.is_main)?.url
                || product.product_images?.[0]?.url
                || product.image_url
                || '/placeholder.svg'

              return (
                <button
                  key={`mobile-suggestion-${product.id}`}
                  className="w-full px-3 py-3 text-left hover:bg-blue-50 active:bg-blue-100 flex items-center gap-3 transition-all duration-150 focus:bg-blue-50 focus:outline-none touch-manipulation border-b border-gray-100 last:border-b-0 group"
                  onClick={() => {
                    router.push(`/product?id=${product.id}`)
                    setShowSuggestions(false)
                    setSearchQuery('')
                  }}
                  type="button"
                >
                  {/* Product Image */}
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg'
                      }}
                    />
                  </div>
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-sm font-semibold text-blue-600 mt-0.5">
                      TZS {product.price?.toLocaleString() || '0'}
                    </p>
                  </div>
                </button>
              )
            })}
            {searchQuery && (
              <div className="px-4 py-3.5 bg-gray-50 border-t border-gray-200">
                <button
                  className="text-blue-600 text-base font-medium hover:text-blue-700 hover:underline transition-colors focus:outline-none touch-manipulation"
                  onClick={() => handleSearch(searchQuery)}
                  type="button"
                >
                  See all results for &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>
        )}
        {/* No Results Message */}
        {showSuggestions && searchQuery.trim().length > 0 && searchSuggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 z-[9999] p-6 text-center animate-in fade-in-0 zoom-in-95">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-base text-gray-600 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
