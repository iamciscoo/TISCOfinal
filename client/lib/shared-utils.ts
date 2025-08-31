/**
 * Shared utility functions used across the TISCO application
 * 
 * This module provides reusable utility functions for:
 * - Status management and styling
 * - Price formatting and currency conversion
 * - Image handling and product data processing
 * - Form validation
 * - Date/time formatting
 * - Local storage operations
 * - API error handling
 */

import { Currency, ValidationError, Product } from './types'

// =============================================================================
// STATUS UTILITIES
// =============================================================================

/**
 * Returns appropriate Tailwind CSS classes for order/payment status badges
 * @param status - The status string (pending, processing, shipped, etc.)
 * @returns CSS classes for background and text color
 */
export const getOrderStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Maps status strings to UI badge variants for consistent styling
 * @param status - The status to map
 * @returns Badge variant type for the UI component
 */
export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'delivered':
    case 'paid':
      return 'default' // green
    case 'processing':
    case 'shipped':
      return 'secondary' // blue  
    case 'cancelled':
    case 'failed':
      return 'destructive' // red
    default:
      return 'outline' // gray
  }
}

// =============================================================================
// PRICE FORMATTING UTILITIES
// =============================================================================

/**
 * Formats a price according to the specified currency
 * Handles special formatting for TZS (no decimals) vs USD (2 decimals)
 * @param price - The numeric price to format
 * @param currency - Currency object with code, symbol, etc.
 * @returns Formatted price string with currency symbol
 */
export const formatPrice = (
  price: number, 
  currency: Currency = { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' }
): string => {
  if (currency.code === 'TZS') {
    return `${currency.symbol} ${Math.round(price).toLocaleString('en-US')}`
  }
  return `${currency.symbol}${price.toFixed(2)}`
}

/**
 * Converts price between USD and TZS using exchange rate
 * @param price - The price to convert
 * @param fromCurrency - Source currency code (USD/TZS)
 * @param toCurrency - Target currency code (USD/TZS)
 * @param exchangeRate - Exchange rate (TZS per USD, default 2500)
 * @returns Converted price
 */
export const convertPrice = (
  price: number, 
  fromCurrency: string, 
  toCurrency: string, 
  exchangeRate: number = 2500
): number => {
  if (fromCurrency === toCurrency) return price
  
  if (fromCurrency === 'USD' && toCurrency === 'TZS') {
    return price * exchangeRate
  }
  
  if (fromCurrency === 'TZS' && toCurrency === 'USD') {
    return price / exchangeRate
  }
  
  return price
}

// =============================================================================
// DEAL PRICING UTILITIES
// =============================================================================

/**
 * Calculates deal pricing information for a product
 * Determines if product is on sale and returns current/original prices
 * @param product - Product object with pricing fields
 * @returns Object with deal status and pricing information
 */
export function getDealPricing(product: Product): { isDeal: boolean; currentPrice: number; originalPrice?: number } {
  const dealPrice = typeof product.deal_price === 'number' ? product.deal_price : undefined
  const origPrice = typeof product.original_price === 'number' ? product.original_price : undefined
  const basePrice = product.price
  const isDeal = !!product.is_deal && typeof dealPrice === 'number' && ((origPrice ?? basePrice) > dealPrice)
  const currentPrice = isDeal && typeof dealPrice === 'number' ? dealPrice : basePrice
  return { isDeal, currentPrice, originalPrice: origPrice }
}

/**
 * Calculates the discount percentage for a product deal
 * @param product - Product object to calculate discount for
 * @returns Discount percentage as integer, or null if no discount
 */
export function getDiscountPercent(product: Product): number | null {
  const { isDeal, currentPrice, originalPrice } = getDealPricing(product)
  const base = originalPrice ?? product.price
  if (!isDeal || !(base > currentPrice)) return null
  return Math.round(((base - currentPrice) / base) * 100)
}

// =============================================================================
// IMAGE UTILITIES
// =============================================================================

/**
 * Gets the primary image URL for a product with fallback logic
 * Priority: main product_image > first product_image > legacy image_url > fallback
 * @param product - Product object with image data
 * @returns Image URL string
 */
export function getImageUrl(product: Product): string {
  // Priority order:
  // 1. Main image from product_images array
  // 2. First image from product_images array
  // 3. Legacy image_url field
  // 4. Fallback image
  
  if (product.product_images && product.product_images.length > 0) {
    // Find main image first
    const mainImage = product.product_images.find(img => img.is_main)
    if (mainImage?.url) return mainImage.url
    
    // Fall back to first image
    const firstImage = product.product_images[0]
    if (firstImage?.url) return firstImage.url
  }
  
  // Legacy fallback
  if (product.image_url) return product.image_url
  
  // Final fallback
  return '/circular.svg'
}

/**
 * Constructs a full Supabase Storage URL from a relative path
 * @param path - Relative path to the image in Supabase storage
 * @returns Full URL to the image or fallback
 */
export function getSupabaseImageUrl(path: string): string {
  if (!path) return '/circular.svg'
  
  // If it's already a full URL, return as is
  if (path.startsWith('http')) return path
  
  // Construct Supabase Storage URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return '/circular.svg'
  
  return `${supabaseUrl}/storage/v1/object/public/product-images/${path}`
}

/**
 * Gets all available images for a product in priority order
 * @param product - Product object with image data
 * @returns Array of image URLs sorted by priority (main first, then by sort_order)
 */
export function getAllProductImages(product: Product): string[] {
  const images: string[] = []
  
  if (product.product_images && product.product_images.length > 0) {
    // Sort by main first, then by sort_order
    const sortedImages = [...product.product_images].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1
      if (!a.is_main && b.is_main) return 1
      return (a.sort_order || 0) - (b.sort_order || 0)
    })
    
    images.push(...sortedImages.map(img => img.url).filter((url): url is string => Boolean(url)))
  }
  
  // Add legacy image_url if not already included
  if (product.image_url && !images.includes(product.image_url)) {
    images.push(product.image_url)
  }
  
  return images.length > 0 ? images : ['/circular.svg']
}

/**
 * Extracts category name from product with fallback
 * @param product - Product object with category information
 * @param fallback - Default category name if none found
 * @returns Category name string
 */
export const getCategoryName = (product: { categories?: { name: string }; category?: string }, fallback: string = 'Uncategorized'): string => {
  return product.categories?.name || product.category || fallback
}

// =============================================================================
// STOCK UTILITIES
// =============================================================================

/**
 * Checks if a product is currently in stock
 * @param product - Product object with stock information
 * @returns True if in stock (including unknown stock), false if out of stock
 */
export const isInStock = (product: { stock_quantity?: number | null }): boolean => {
  const qty = product.stock_quantity
  if (qty == null) return true // Unknown stock -> treat as available
  return qty > 0
}

/**
 * Gets detailed stock status with user-friendly message
 * @param product - Product object with stock information
 * @returns Object with stock status and display message
 */
export const getStockStatus = (product: { stock_quantity?: number | null }): { inStock: boolean; message: string } => {
  const qty = product.stock_quantity
  if (qty == null) {
    return { inStock: true, message: 'In Stock' }
  }
  
  if (qty <= 0) {
    return { inStock: false, message: 'Out of Stock' }
  }
  
  if (qty <= 5) {
    return { inStock: true, message: `Only ${qty} left!` }
  }
  
  return { inStock: true, message: 'In Stock' }
}

// =============================================================================
// FORM VALIDATION UTILITIES
// =============================================================================

/**
 * Validates email address format
 * @param email - Email string to validate
 * @returns ValidationError object if invalid, null if valid
 */
export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    return { field: 'email', message: 'Email is required' }
  }
  if (!emailRegex.test(email)) {
    return { field: 'email', message: 'Please enter a valid email address' }
  }
  return null
}

/**
 * Validates phone number format (supports international formats)
 * @param phone - Phone number string to validate
 * @returns ValidationError object if invalid, null if valid
 */
export const validatePhone = (phone: string): ValidationError | null => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  if (!phone) {
    return { field: 'phone', message: 'Phone number is required' }
  }
  if (!phoneRegex.test(phone)) {
    return { field: 'phone', message: 'Please enter a valid phone number' }
  }
  return null
}

/**
 * Validates that a field has a non-empty value
 * @param value - Value to validate
 * @param fieldName - Name of the field for error messages
 * @returns ValidationError object if empty, null if valid
 */
export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

/**
 * Validates minimum length requirement for a field
 * @param value - Value to validate
 * @param minLength - Minimum required length
 * @param fieldName - Name of the field for error messages
 * @returns ValidationError object if too short, null if valid
 */
export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationError | null => {
  if (value.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters` }
  }
  return null
}

// =============================================================================
// DATE UTILITIES
// =============================================================================

/**
 * Formats a date to a readable string (MMM DD, YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Formats a date with time to a readable string
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Gets relative time description (e.g., "2 days ago", "Yesterday")
 * @param date - Date string or Date object
 * @returns Human-readable relative time string
 */
export const getRelativeTime = (date: string | Date): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

// =============================================================================
// URL UTILITIES
// =============================================================================

/**
 * Generates a URL-friendly slug from text
 * @param text - Text to convert to slug
 * @returns URL-safe slug string
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

/**
 * Builds a URL query string from parameters object
 * @param params - Object with query parameters
 * @returns URL-encoded query string
 */
export const buildQueryString = (params: Record<string, string | number | boolean | string[]>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })
  
  return searchParams.toString()
}

// =============================================================================
// ARRAY UTILITIES
// =============================================================================

/**
 * Splits an array into chunks of specified size
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns New shuffled array (original unchanged)
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Removes duplicate values from an array
 * @param array - Array to deduplicate
 * @returns New array with unique values
 */
export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array))
}

/**
 * Groups array items by a key function
 * @param array - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Object with grouped items
 */
export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

// =============================================================================
// NUMBER UTILITIES
// =============================================================================

/**
 * Clamps a number between min and max values
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped number
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Rounds a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default 2)
 * @returns Rounded number
 */
export const roundToDecimals = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

/**
 * Formats a decimal as a percentage string
 * @param value - Decimal value (e.g., 0.15 for 15%)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// =============================================================================
// LOCAL STORAGE UTILITIES
// =============================================================================

/**
 * Safely sets a value in localStorage with error handling
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 * @returns True if successful, false if failed
 */
export const setLocalStorage = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
    return false
  }
}

/**
 * Safely gets a value from localStorage with error handling
 * @param key - Storage key
 * @param defaultValue - Default value if key not found or error
 * @returns Parsed value or default
 */
export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

/**
 * Safely removes a value from localStorage
 * @param key - Storage key to remove
 * @returns True if successful, false if failed
 */
export const removeLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
    return false
  }
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param wait - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// =============================================================================
// API UTILITIES
// =============================================================================

/**
 * Extracts user-friendly error message from API error
 * @param error - Error object from API call
 * @returns User-friendly error message
 */
export const handleApiError = (error: { response?: { data?: { message?: string } }; message?: string }): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Checks if an API response indicates success
 * @param response - API response object
 * @returns True if response indicates success
 */
export const isApiSuccess = (response: { success?: boolean; status?: number }): boolean => {
  return response?.success === true || (response?.status !== undefined && response.status >= 200 && response.status < 300)
}
