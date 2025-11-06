/**
 * Image Optimization Utilities
 * 
 * Provides functions for optimizing image loading performance across the platform
 */

/**
 * Generate optimized image URLs with proper sizing and format
 */
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  }
): string {
  if (!url) return '/circular.svg'
  
  // If it's a Supabase storage URL, we can optimize it
  if (url.includes('supabase')) {
    const params = new URLSearchParams()
    
    if (options?.width) params.set('width', options.width.toString())
    if (options?.height) params.set('height', options.height.toString())
    if (options?.quality) params.set('quality', options.quality.toString())
    if (options?.format) params.set('format', options.format)
    
    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }
  
  return url
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images in parallel
 */
export async function preloadImages(sources: string[]): Promise<void> {
  await Promise.all(sources.map(src => preloadImage(src).catch(() => {})))
}

/**
 * Get responsive image sizes for Next.js Image component
 */
export function getResponsiveSizes(type: 'product' | 'thumbnail' | 'hero' | 'category'): string {
  const sizes = {
    product: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    thumbnail: '(max-width: 640px) 25vw, 100px',
    hero: '100vw',
    category: '(max-width: 640px) 80px, 120px'
  }
  
  return sizes[type]
}

/**
 * Check if image should be loaded eagerly
 */
export function shouldLoadEager(index: number, total: number): boolean {
  // Load first 3-4 images eagerly for above-the-fold content
  return index < Math.min(4, Math.ceil(total / 3))
}

/**
 * Get blur data URL for image placeholder
 */
export function getBlurDataURL(width = 10, height = 10): string {
  const canvas = typeof document !== 'undefined' 
    ? document.createElement('canvas') 
    : null
    
  if (!canvas) {
    // Return a simple base64 blur placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg=='
  }
  
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f5f5f5')
  gradient.addColorStop(1, '#e5e5e5')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL()
}

/**
 * Image cache manager
 */
class ImageCache {
  private cache = new Map<string, boolean>()
  private maxSize = 100

  has(src: string): boolean {
    return this.cache.has(src)
  }

  add(src: string): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(src, true)
  }

  clear(): void {
    this.cache.clear()
  }
}

export const imageCache = new ImageCache()

/**
 * Optimized image loader for Next.js Image component
 */
export function optimizedImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('/')) {
    // Local images - return as is
    return src
  }
  
  return getOptimizedImageUrl(src, { width, quality: quality || 75 })
}

/**
 * Image loading priority helper
 */
export function getImagePriority(position: 'hero' | 'above-fold' | 'below-fold'): boolean {
  return position === 'hero' || position === 'above-fold'
}

/**
 * Lazy load images with IntersectionObserver
 */
export function setupLazyLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        
        if (src && !imageCache.has(src)) {
          img.src = src
          imageCache.add(src)
          imageObserver.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  })

  // Observe all images with data-src
  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img)
  })
  
  return imageObserver
}
