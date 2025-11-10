'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

/**
 * SafeImage - A wrapper around Next.js Image component with built-in error handling
 * 
 * Features:
 * - Automatic fallback to default image on load error
 * - Optional custom fallback image
 * - Error logging for debugging
 * - Prevents image optimization timeout issues
 * - Maintains all standard Next.js Image props
 */

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  /** Custom fallback image URL (defaults to /circular.svg) */
  fallbackSrc?: string
  /** Optional callback when image fails to load */
  onLoadError?: (error: Error) => void
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = '/circular.svg',
  onLoadError,
  ...props
}) => {
  const [imageError, setImageError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleError = () => {
    const errorMsg = `Failed to load image: ${currentSrc}`
    console.error(errorMsg)
    
    // Call optional error callback
    if (onLoadError) {
      onLoadError(new Error(errorMsg))
    }
    
    // Switch to fallback image
    setImageError(true)
    setCurrentSrc(fallbackSrc)
  }

  // Reset error state when src changes
  if (src !== currentSrc && !imageError) {
    setCurrentSrc(src)
  }

  return (
    <Image
      {...props}
      src={imageError ? fallbackSrc : currentSrc}
      alt={alt}
      onError={handleError}
      unoptimized={imageError} // Skip optimization for fallback image
    />
  )
}
