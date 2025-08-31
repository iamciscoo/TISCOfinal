/**
 * LoadingSpinner component for consistent loading states across the application
 * 
 * Features:
 * - Multiple size variants
 * - Optional loading text
 * - Full-screen overlay option
 * - Accessible with proper ARIA labels
 * - Smooth animations
 */

import React, { memo } from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  fullScreen?: boolean
  overlay?: boolean
  'aria-label'?: string
}

const LoadingSpinnerComponent: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className,
  fullScreen = false,
  overlay = false,
  'aria-label': ariaLabel,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }
  
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  const content = (
    <div 
      className={cn('flex flex-col items-center justify-center', className)}
      role="status"
      aria-label={ariaLabel || text || 'Loading content'}
    >
      <div 
        className={cn(
          'animate-spin rounded-full border-2 border-gray-200 border-t-blue-600',
          sizeClasses[size],
          text ? 'mb-3' : ''
        )}
        aria-hidden="true"
      />
      {text && (
        <p className={cn('text-gray-600 font-medium', textSizes[size])}>
          {text}
        </p>
      )}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        {content}
      </div>
    )
  }

  return content
}

// Export memoized component for better performance
export const LoadingSpinner = memo(LoadingSpinnerComponent)
