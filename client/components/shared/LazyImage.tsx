/**
 * LazyImage component with intersection observer for performance optimization
 * 
 * Features:
 * - Lazy loading with intersection observer
 * - Placeholder/skeleton loading states
 * - Error handling with fallback images
 * - Progressive image loading
 * - Responsive image sizing
 */

'use client'

import { useState, useCallback, memo } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useLazyLoad } from '@/hooks/useIntersectionObserver'

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholderClassName?: string
  fallbackSrc?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

const LazyImageComponent: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  fallbackSrc = '/circular.svg',
  priority = false,
  sizes,
  fill = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Use lazy loading unless priority is set
  const { shouldLoad, ref } = useLazyLoad({
    threshold: 0.1,
    rootMargin: '50px',
  })

  const handleLoad = useCallback(() => {
    setImageLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setImageError(true)
    onError?.()
  }, [onError])

  const shouldShowImage = priority || shouldLoad
  const imageSrc = imageError ? fallbackSrc : src

  return (
    <div 
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={!fill ? { width, height } : undefined}
    >
      {/* Loading placeholder */}
      {!imageLoaded && shouldShowImage && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse',
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {shouldShowImage && (
        <Image
          src={imageSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          className={cn(
            'transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0',
            fill ? 'object-cover' : ''
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {/* Error state indicator */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
          Image unavailable
        </div>
      )}
    </div>
  )
}

export const LazyImage = memo(LazyImageComponent)
