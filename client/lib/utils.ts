import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Standardized API response types
export interface ApiErrorResponse {
  error: string
  code?: string
  details?: unknown
}

export interface ApiSuccessResponse<T = unknown> {
  data: T
  message?: string
}

// Utility functions for consistent API responses
export const createErrorResponse = (
  error: string, 
  status: number = 500, 
  code?: string, 
  details?: unknown
) => {
  return Response.json(
    { error, code, details } as ApiErrorResponse, 
    { status }
  )
}

export const createSuccessResponse = <T>(
  data: T, 
  status: number = 200, 
  message?: string
) => {
  return Response.json(
    { data, message } as ApiSuccessResponse<T>, 
    { status }
  )
}

// Timezone utilities for East African Time (EAT = UTC+3)
const EAT_TIMEZONE = 'Africa/Dar_es_Salaam' // Tanzania timezone

/**
 * Format a date/timestamp to East African Time (EAT)
 * @param date - Date string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string in EAT
 */
export function formatToEAT(
  date: string | Date | null | undefined,
  options?: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short'
    timeStyle?: 'full' | 'long' | 'medium' | 'short'
    includeTime?: boolean
    includeDate?: boolean
  }
): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    const { dateStyle = 'medium', timeStyle = 'medium', includeTime = true, includeDate = true } = options || {}

    // Format with Intl.DateTimeFormat using EAT timezone
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: EAT_TIMEZONE,
    }

    if (includeDate && !includeTime) {
      formatOptions.dateStyle = dateStyle
    } else if (includeTime && !includeDate) {
      formatOptions.timeStyle = timeStyle
    } else if (includeDate && includeTime) {
      formatOptions.dateStyle = dateStyle
      formatOptions.timeStyle = timeStyle
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj)
  } catch (error) {
    console.error('Error formatting date to EAT:', error)
    return 'Error formatting date'
  }
}

/**
 * Format date to EAT - compact format (MM/DD/YYYY HH:MM AM/PM EAT)
 */
export function formatToEATCompact(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: EAT_TIMEZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj) + ' EAT'
  } catch (error) {
    console.error('Error formatting date to EAT compact:', error)
    return 'Error'
  }
}

/**
 * Format date to EAT - date only (no time)
 */
export function formatToEATDateOnly(date: string | Date | null | undefined): string {
  return formatToEAT(date, { includeTime: false, dateStyle: 'medium' })
}

/**
 * Format date to EAT - time only (no date)
 */
export function formatToEATTimeOnly(date: string | Date | null | undefined): string {
  return formatToEAT(date, { includeDate: false, timeStyle: 'short' })
}

/**
 * Get relative time from now (e.g., "2 hours ago", "in 3 days")
 * Already accounts for EAT timezone
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin} min${diffMin !== 1 ? 's' : ''} ago`
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`
    if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
    
    // For older dates, show the actual date in EAT
    return formatToEATCompact(dateObj)
  } catch (error) {
    console.error('Error formatting relative time:', error)
    return 'Error'
  }
}
