/**
 * Custom hook for safe localStorage operations
 * 
 * Features:
 * - Type-safe localStorage operations
 * - SSR-safe with hydration handling
 * - Error handling for storage failures
 * - Automatic JSON serialization/deserialization
 * - Storage event listening for cross-tab sync
 */

import { useState, useEffect, useCallback } from 'react'

type SetValue<T> = T | ((val: T) => T)

/**
 * Hook for localStorage with type safety and SSR compatibility
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns Tuple of [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for localStorage with session-based expiration
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @param ttl - Time to live in milliseconds
 * @returns Tuple of [value, setValue, removeValue, isExpired]
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttl: number
): [T, (value: SetValue<T>) => void, () => void, boolean] {
  const [value, setValue, removeValue] = useLocalStorage(key, {
    value: initialValue,
    timestamp: Date.now(),
  })

  const isExpired = Date.now() - value.timestamp > ttl

  const setValueWithTimestamp = useCallback(
    (newValue: SetValue<T>) => {
      const valueToStore = newValue instanceof Function ? newValue(value.value) : newValue
      setValue({
        value: valueToStore,
        timestamp: Date.now(),
      })
    },
    [setValue, value.value]
  )

  // Auto-remove expired values
  useEffect(() => {
    if (isExpired) {
      removeValue()
    }
  }, [isExpired, removeValue])

  return [value.value, setValueWithTimestamp, removeValue, isExpired]
}
