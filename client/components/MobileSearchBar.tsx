'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

/**
 * Mobile-only search bar component
 * Displays above the hero carousel on mobile devices
 */
export const MobileSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = useCallback((query: string) => {
    const trimmedQuery = query.trim()
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
      setSearchQuery('')
    }
  }, [router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }, [searchQuery, handleSearch])

  return (
    <div className="md:hidden px-4 pt-2 pb-0 bg-white">
      <div className="relative">
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
      </div>
    </div>
  )
}
