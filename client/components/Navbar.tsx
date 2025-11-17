'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { SignInButton } from '@/components/auth/SignInButton'
import { UserButton } from '@/components/auth/UserButton'
import { useCartStore } from '@/lib/store'
import { CurrencyToggle } from '@/components/CurrencyToggle'
import { debounce } from '@/lib/shared-utils'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * Maximum number of search suggestions to display
 */
const MAX_SUGGESTIONS = 8

/**
 * Navigation bar component with search, authentication, and cart functionality
 * Features:
 * - Responsive design with mobile menu
 * - Search with autocomplete suggestions
 * - User authentication via Supabase
 * - Shopping cart integration
 * - Currency toggle
 */
export const Navbar = () => {
  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  
  // External hooks
  const { user, loading } = useAuth()
  const isLoaded = !loading
  const isSignedIn = !!user
  const router = useRouter()
  const pathname = usePathname()
  const openCart = useCartStore((s) => s.openCart)
  const cartCount = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0))
  
  // Refs
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef<number>(0)
  const touchCurrentY = useRef<number>(0)
  
  // cartCount derived via selector above; remains reactive to store changes

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
        const data = await resp.json()
        const names = (Array.isArray(data) ? data : []).map((p: { name?: string }) => p?.name).filter(Boolean) as string[]
        const unique = Array.from(new Set(names)).slice(0, MAX_SUGGESTIONS)
        setSearchSuggestions(unique)
        setShowSuggestions(unique.length > 0)
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

  // Prevent hydration mismatches for client-side cart state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Search handlers
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

  // Menu handlers
  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev)
  }, [])

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  // Touch gesture handlers for mobile menu
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartY.current - touchCurrentY.current
    // Swipe up to close (positive distance means swipe up)
    // touchStartY (lower) - touchCurrentY (higher) = positive value
    if (swipeDistance > 50) {
      closeMenu()
    }
    touchStartY.current = 0
    touchCurrentY.current = 0
  }, [closeMenu])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Check if click is not on the menu button itself
        const target = event.target as HTMLElement
        if (!target.closest('[aria-label*="navigation menu"]')) {
          closeMenu()
        }
      }
    }

    // Small delay to prevent immediate close on menu open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen, closeMenu])

  // Detect route changes for loading indicator
  useEffect(() => {
    setIsNavigating(true)
    // Keep loading bar visible for 2.5s total (2s animation + 0.5s delay)
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [pathname])

  // Prevent body scroll when menu is open and add global swipe handlers
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
      
      let hasMoved = false
      
      // Add global touch handlers for swipe up anywhere on page
      const handleGlobalTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY
        touchCurrentY.current = e.touches[0].clientY
        hasMoved = false
      }
      
      const handleGlobalTouchMove = (e: TouchEvent) => {
        touchCurrentY.current = e.touches[0].clientY
        const distance = Math.abs(touchStartY.current - touchCurrentY.current)
        // Mark as moved if distance > 10px (distinguishes swipe from tap)
        if (distance > 10) {
          hasMoved = true
        }
      }
      
      const handleGlobalTouchEnd = () => {
        const swipeDistance = touchStartY.current - touchCurrentY.current
        // Only close on swipe up if there was actual movement (not a tap)
        // Swipe up to close (positive distance means swipe up)
        if (hasMoved && swipeDistance > 50) {
          closeMenu()
        }
        touchStartY.current = 0
        touchCurrentY.current = 0
        hasMoved = false
      }
      
      document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true })
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true })
      document.addEventListener('touchend', handleGlobalTouchEnd)
      
      return () => {
        document.body.style.overflow = ''
        document.removeEventListener('touchstart', handleGlobalTouchStart)
        document.removeEventListener('touchmove', handleGlobalTouchMove)
        document.removeEventListener('touchend', handleGlobalTouchEnd)
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen, closeMenu])

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 fixed top-0 z-[60] w-full shadow-sm">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full relative">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              aria-label="TISCO Market Home"
              className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-all duration-150 hover:opacity-80 active:opacity-60 active:scale-95"
            >
              <Image
                src="/circular.svg"
                alt="TISCO Market Logo"
                width={40}
                height={40}
                className="w-10 h-10"
                priority
              />
              <span className="hidden sm:inline text-xl font-bold text-gray-900 font-chango">
                TISCOマーケット
              </span>
            </Link>
          </div>

          {/* Mobile Centered Shop link */}
          <Link
            href="/products"
            className="md:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-900 font-medium hover:text-blue-600 active:text-blue-700 active:scale-95 transition-all duration-150"
            aria-label="Shop Products"
          >
            Shop
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md xl:max-w-lg mx-3 lg:mx-6 xl:mx-8">
            <div ref={searchRef} className="relative w-full">
              <Input
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search TISCO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-2 w-full"
                suppressHydrationWarning
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 max-h-[380px] overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 active:bg-blue-100 flex items-center gap-3 text-sm transition-all duration-150 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 group"
                      onClick={() => handleSearch(suggestion)}
                      type="button"
                    >
                      <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 transition-colors" />
                      <span className="truncate text-gray-900 group-hover:text-blue-700 font-medium">{suggestion}</span>
                    </button>
                  ))}
                  {searchQuery && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button
                        className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline transition-colors focus:outline-none"
                        onClick={() => handleSearch(searchQuery)}
                        type="button"
                      >
                        Search for &quot;{searchQuery}&quot;
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* No Results Message */}
              {showSuggestions && searchQuery.trim().length > 0 && searchSuggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 z-[9999] p-6 text-center animate-in fade-in-0 zoom-in-95">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">No products found</p>
                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-6 xl:space-x-8" role="navigation">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 active:text-blue-700 active:scale-95 font-medium transition-all duration-150 text-sm lg:text-base">
              Shop
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-blue-600 active:text-blue-700 active:scale-95 font-medium transition-all duration-150 text-sm lg:text-base">
              Services
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 active:text-blue-700 active:scale-95 font-medium transition-all duration-150 text-sm lg:text-base">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 active:text-blue-700 active:scale-95 font-medium transition-all duration-150 text-sm lg:text-base">
              Contact
            </Link>
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-1 md:space-x-2 lg:space-x-3">
            {/* Currency Converter */}
            <div className="hidden lg:block">
              <CurrencyToggle />
            </div>
            
            {/* Authentication Section */}
            {!isLoaded ? (
              // Prevent layout shift during authentication initialization
              <div className="hidden sm:block h-9 w-24" aria-hidden="true" />
            ) : isSignedIn ? (
              <div className="flex items-center gap-1 md:gap-2">
                <Link 
                  href="/account" 
                  className="hidden lg:inline text-gray-700 hover:text-blue-600 active:text-blue-700 active:scale-95 font-medium transition-all duration-150 text-sm lg:text-base"
                >
                  Account
                </Link>
                <span className="hidden sm:inline-flex">
                  <UserButton afterSignOutUrl="/" />
                </span>
              </div>
            ) : (
              <SignInButton 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex transition-colors px-2 md:px-3"
              />
            )}

            {/* Shopping Cart */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative transition-all duration-150 hover:bg-gray-100 active:bg-gray-200 active:scale-95" 
              onClick={openCart}
              aria-label={`Shopping cart ${mounted && cartCount > 0 ? `with ${cartCount} items` : ''}`}
            >
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-in zoom-in-50">
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Auth Icon (between cart and menu) */}
            {isLoaded && (
              isSignedIn ? (
                <span className="inline-flex sm:hidden">
                  <UserButton afterSignOutUrl="/" />
                </span>
              ) : (
                <SignInButton 
                  variant="ghost" 
                  size="sm" 
                  className="inline-flex sm:hidden"
                >
                  <User className="h-5 w-5" />
                </SignInButton>
              )
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden transition-all duration-150 hover:bg-gray-100 active:bg-gray-200 active:scale-95"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              ref={mobileMenuRef}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0.0, 0.2, 1] // Smooth easing
              }}
              className="md:hidden border-t border-gray-200 overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <motion.nav 
                className="px-2 pt-2 pb-3 space-y-1"
                role="navigation"
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                exit={{ y: -20 }}
                transition={{ duration: 0.3 }}
              >
              {/* Mobile Currency Toggle */}
              <div className="px-3 py-2 mb-2">
                <CurrencyToggle />
              </div>

              {/* Mobile Navigation Links */}
              <Link
                href="/products"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                onClick={closeMenu}
              >
                Shop
              </Link>
              <Link
                href="/services"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                onClick={closeMenu}
              >
                Services
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                onClick={closeMenu}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                onClick={closeMenu}
              >
                Contact
              </Link>

              {/* Mobile Account Link */}
              {isLoaded && isSignedIn && (
                <Link
                  href="/account"
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                  onClick={closeMenu}
                >
                  Account
                </Link>
              )}

              {/* Mobile Sign In */}
              {isLoaded && !isSignedIn && (
                <SignInButton 
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600 active:text-blue-700 active:bg-blue-100 font-medium transition-all duration-150 rounded-md hover:bg-gray-50"
                  variant="ghost"
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Sign In
                </SignInButton>
              )}
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Loading Progress Bar */}
      {isNavigating && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"
            style={{
              width: '100%',
              animation: 'progressBar 2000ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
            }} 
          />
        </div>
      )}
    </nav>
  )
}
