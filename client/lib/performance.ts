// Performance optimization utilities
export const preloadRoute = (href: string) => {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  }
}

export const preloadImage = (src: string) => {
  if (typeof window !== 'undefined') {
    const img = new Image()
    img.src = src
  }
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Performance monitoring
export const trackPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Basic performance tracking
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation && process.env.NODE_ENV === 'development') {
      // Only log performance metrics in development
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
      
      if (pageLoadTime > 0) {
        console.info(`Page Load Time: ${pageLoadTime}ms`)
      }
      if (domContentLoaded > 0) {
        console.info(`DOM Content Loaded: ${domContentLoaded}ms`)
      }
    }
  }
}
