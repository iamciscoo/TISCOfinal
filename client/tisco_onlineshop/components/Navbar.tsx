'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Menu, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { useCartStore } from '@/lib/store'
import { CurrencyToggle } from '@/components/CurrencyToggle'

// Sample search suggestions - in real app, this would come from API
const sampleProducts = [
  'Smartphone Pro Max', 'Wireless Headphones', 'Designer T-Shirt', 
  'Running Shoes', 'Coffee Maker', 'Gaming Laptop', 'Winter Jacket',
  'Basketball', 'Smart Watch', 'Bluetooth Speaker'
]

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isLoaded, isSignedIn } = useUser()
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { getTotalItems, openCart } = useCartStore()
  const cartCount = getTotalItems()

  // Handle search suggestions
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = sampleProducts.filter(product =>
        product.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
      setSearchSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [searchQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mark as mounted to avoid hydration mismatches for persisted cart count
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setShowSuggestions(false)
      setSearchQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/circular.svg"
                alt="TISCO Market Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-900 font-chango">
                TISCOマーケット
              </span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div ref={searchRef} className="relative w-full">
              <Input
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-2 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              
              {/* Search Suggestions */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-50">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                      onClick={() => handleSearch(suggestion)}
                    >
                      <Search className="h-4 w-4 text-gray-400" />
                      {suggestion}
                    </button>
                  ))}
                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      className="text-blue-600 text-sm hover:underline"
                      onClick={() => handleSearch(searchQuery)}
                    >
                      Search for &quot;{searchQuery}&quot;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium">
              Shop
            </Link>
            <Link href="/services" className="text-gray-700 hover:text-blue-600 font-medium">
              Services
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            {/* Currency Converter */}
            <CurrencyToggle />
            
            {/* Authentication */}
            {!isLoaded ? (
              // Placeholder to prevent layout shift while Clerk loads and to avoid auth flash
              <div className="hidden sm:block h-9 w-24" aria-hidden="true" />
            ) : isSignedIn ? (
              <div className="flex items-center gap-2">
                <Link href="/account" className="hidden sm:inline text-sm text-gray-700 hover:text-blue-600">Account</Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton>
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </SignInButton>
            )}

            {/* Cart */}
            <Button variant="ghost" size="sm" className="relative" onClick={openCart}>
              <ShoppingCart className="h-5 w-5" />
              {mounted && cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Search */}
              <div className="relative mb-3">
                <Input
                  type="search"
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-4 py-2 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Mobile Navigation Links */}
              <Link
                href="/products"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Shop
              </Link>
              <Link
                href="/services"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              {/* Mobile Sign In */}
              {isLoaded && !isSignedIn && (
                <SignInButton>
                  <div className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium cursor-pointer">
                    <User className="h-4 w-4 inline mr-2" />
                    Sign In
                  </div>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
