'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1
          const isFilled = starValue <= rating
          const isPartiallyFilled = starValue - 1 < rating && rating < starValue

          return (
            <button
              key={index}
              type="button"
              className={cn(
                'relative',
                interactive && 'hover:scale-110 transition-transform cursor-pointer',
                !interactive && 'cursor-default'
              )}
              onClick={() => handleStarClick(starValue)}
              disabled={!interactive}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors',
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-transparent text-gray-300'
                )}
              />
              {isPartiallyFilled && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${(rating - (starValue - 1)) * 100}%` }}
                >
                  <Star
                    className={cn(
                      sizeClasses[size],
                      'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}
