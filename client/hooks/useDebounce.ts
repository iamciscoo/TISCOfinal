/**
 * Custom hook for debouncing values and functions
 * 
 * Features:
 * - Debounce value changes for search inputs
 * - Debounce function calls for API requests
 * - Configurable delay
 * - Cleanup on unmount
 */

import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * Debounce a value - useful for search inputs
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounce a callback function
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  return debouncedCallback
}

/**
 * Debounce async operations with loading state
 * @param asyncFn - Async function to debounce
 * @param delay - Delay in milliseconds
 * @returns Object with debounced function and loading state
 */
export function useDebouncedAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  asyncFn: T,
  delay: number
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const debouncedFn = useDebouncedCallback(
    async (...args: Parameters<T>) => {
      setIsLoading(true)
      setError(null)
      
      try {
        const result = await asyncFn(...args)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    delay
  )

  return {
    execute: debouncedFn,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
