// Shared utility functions used across the application

import { Currency, ValidationError } from './types'

// Status utilities
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

// Price formatting utilities
export const formatPrice = (
  price: number, 
  currency: Currency = { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar' }
): string => {
  if (currency.code === 'TZS') {
    return `${currency.symbol} ${Math.round(price).toLocaleString('en-US')}`
  }
  return `${currency.symbol}${price.toFixed(2)}`
}

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

// Image utilities
export const getImageUrl = (
  product: { image_url?: string; image?: string; product_images?: { url?: string; is_main?: boolean; sort_order?: number }[] }, 
  fallback: string = '/circular.svg'
): string => {
  const imgs = (product as any)?.product_images as any[] | undefined
  const mainFromList = imgs?.find(img => img?.is_main)?.url || imgs?.[0]?.url
  return mainFromList || product.image_url || (product as any).image || fallback
}

export const getCategoryName = (product: { categories?: { name: string }; category?: string }, fallback: string = 'Uncategorized'): string => {
  return product.categories?.name || product.category || fallback
}

// Stock utilities
export const isInStock = (product: { stock_quantity?: number }): boolean => {
  return !product.stock_quantity || product.stock_quantity > 0
}

export const getStockStatus = (product: { stock_quantity?: number }): { inStock: boolean; message: string } => {
  if (!product.stock_quantity) {
    return { inStock: true, message: 'In Stock' }
  }
  
  if (product.stock_quantity === 0) {
    return { inStock: false, message: 'Out of Stock' }
  }
  
  if (product.stock_quantity <= 5) {
    return { inStock: true, message: `Only ${product.stock_quantity} left!` }
  }
  
  return { inStock: true, message: 'In Stock' }
}

// Form validation utilities
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

export const validateRequired = (value: string, fieldName: string): ValidationError | null => {
  if (!value || value.trim() === '') {
    return { field: fieldName, message: `${fieldName} is required` }
  }
  return null
}

export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationError | null => {
  if (value.length < minLength) {
    return { field: fieldName, message: `${fieldName} must be at least ${minLength} characters` }
  }
  return null
}

// Date utilities
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

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

// URL utilities
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

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

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const unique = <T>(array: T[]): T[] => {
  return Array.from(new Set(array))
}

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

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

export const roundToDecimals = (value: number, decimals: number = 2): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
}

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// Local storage utilities with error handling
export const setLocalStorage = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn('Failed to save to localStorage:', error)
    return false
  }
}

export const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.warn('Failed to read from localStorage:', error)
    return defaultValue
  }
}

export const removeLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error)
    return false
  }
}

// Debounce utility
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

// API utilities
export const handleApiError = (error: { response?: { data?: { message?: string } }; message?: string }): string => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export const isApiSuccess = (response: { success?: boolean; status?: number }): boolean => {
  return response?.success === true || (response?.status !== undefined && response.status >= 200 && response.status < 300)
}
