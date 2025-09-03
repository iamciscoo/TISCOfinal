/**
 * Shared utilities for admin panel operations
 */

import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Standardized API call with error handling
 */
export async function apiCall<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Hook for handling CRUD operations with consistent UX
 */
export function useAdminActions() {
  const { toast } = useToast()
  const router = useRouter()

  const handleCreate = async (
    url: string,
    data: any,
    entityName: string,
    onSuccess?: () => void
  ) => {
    const result = await apiCall(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (result.success) {
      toast({
        title: 'Success',
        description: `${entityName} created successfully`,
      })
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh() // Use router.refresh instead of window.location.reload
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || `Failed to create ${entityName.toLowerCase()}`,
        variant: 'destructive',
      })
    }

    return result
  }

  const handleUpdate = async (
    url: string,
    data: any,
    entityName: string,
    onSuccess?: () => void
  ) => {
    const result = await apiCall(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })

    if (result.success) {
      toast({
        title: 'Success',
        description: `${entityName} updated successfully`,
      })
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || `Failed to update ${entityName.toLowerCase()}`,
        variant: 'destructive',
      })
    }

    return result
  }

  const handleDelete = async (
    url: string,
    entityName: string,
    onSuccess?: () => void
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`
    )
    
    if (!confirmed) return { success: false }

    const result = await apiCall(url, {
      method: 'DELETE',
    })

    if (result.success) {
      toast({
        title: 'Success',
        description: `${entityName} deleted successfully`,
      })
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || `Failed to delete ${entityName.toLowerCase()}`,
        variant: 'destructive',
      })
    }

    return result
  }

  return {
    handleCreate,
    handleUpdate,
    handleDelete,
    apiCall,
  }
}

/**
 * Form validation helpers
 */
export const validateRequired = (value: string, fieldName: string) => {
  if (!value?.trim()) {
    return `${fieldName} is required`
  }
  return null
}

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address'
  }
  return null
}

export const validatePrice = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice) || numPrice < 0) {
    return 'Please enter a valid price'
  }
  return null
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency = 'TZS') => {
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency: currency === 'TZS' ? 'TZS' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for display
 */
export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
