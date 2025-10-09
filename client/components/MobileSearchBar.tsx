'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { debounce } from '@/lib/shared-utils'

/**
 * Maximum number of search suggestions to display
 */
const MAX_SUGGESTIONS = 5

/**
 * Mobile-only search bar component with autocomplete
 * Displays above the hero carousel on mobile devices
 * Features dropdown suggestions matching desktop functionality
 */
export const MobileSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search suggestion handler backed by API
  const updateSuggestions = useMemo(
    () => debounce(async (query: string) => {
      const q = query.trim()
      if (q.length === 0) {
        setShowSuggestions(false)
        setSearchSuggestions([])
        return
      }

      try {
        const params = new URLSearchParams({ q, limit: String(MAX_SUGGESTIONS) })
        const resp = await fetch(`/api/products/search?${params.toString()}`)
        if (!resp.ok) {
          setShowSuggestions(false)
          setSearchSuggestions([])
          return
        }
        const data = await resp.json()
        const names = (Array.isArray(data) ? data : []).map((p: { name?: string }) => p?.name).filter(Boolean) as string[]
        const unique = Array.from(new Set(names)).slice(0, MAX_SUGGESTIONS)
        setSearchSuggestions(unique)
        setShowSuggestions(unique.length > 0)
      } catch {
        setShowSuggestions(false)
        setSearchSuggestions([])
      }
    }, 200),
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
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[9999] animate-in fade-in-0 zoom-in-95">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={`mobile-suggestion-${index}`}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-center gap-3 text-base transition-colors focus:bg-gray-50 focus:outline-none touch-manipulation"
                onClick={() => handleSearch(suggestion)}
                type="button"
              >
                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{suggestion}</span>
              </button>
            ))}
            {searchQuery && (
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  className="text-blue-600 text-base hover:underline transition-colors focus:outline-none touch-manipulation"
                  onClick={() => handleSearch(searchQuery)}
                  type="button"
                >
                  Search for &quot;{searchQuery}&quot;
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
