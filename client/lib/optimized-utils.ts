// Optimized utility functions for better performance
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Memoized currency formatter
const currencyFormatter = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const formatCurrency = (amount: number): string => {
  return currencyFormatter.format(amount)
}

// Optimized image URL helper
export const getOptimizedImageUrl = (url: string, width?: number, quality = 75): string => {
  if (!url || url.startsWith('/')) return url
  
  // For Supabase storage URLs, add optimization parameters
  if (url.includes('supabase')) {
    const urlObj = new URL(url)
    if (width) urlObj.searchParams.set('width', width.toString())
    urlObj.searchParams.set('quality', quality.toString())
    return urlObj.toString()
  }
  
  return url
}

// Debounced search function
export const createDebouncedSearch = (searchFn: (query: string) => void, delay = 300) => {
  let timeoutId: NodeJS.Timeout
  
  return (query: string) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => searchFn(query), delay)
  }
}

// Optimized array operations
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export const unique = <T>(array: T[], key?: keyof T): T[] => {
  if (!key) return [...new Set(array)]
  
  const seen = new Set()
  return array.filter(item => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}
