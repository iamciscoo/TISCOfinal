'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StarRating } from '@/components/ui/StarRating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  created_at: string
  is_verified_purchase: boolean
  reviewer_name?: string | null
  users?: {
    first_name: string
    last_name: string
    avatar_url?: string
  } | null
}

interface ReviewsListProps {
  productId: string
  refreshTrigger?: number
}

const REVIEWS_PER_PAGE = 3

export function ReviewsList({ productId, refreshTrigger }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?product_id=${productId}`)
        if (!response.ok) throw new Error('Failed to fetch reviews')
        
        const data = await response.json()
        setReviews(data.reviews || [])
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [productId, refreshTrigger])

  if (loading) {
    return <div className="text-center py-8">Loading reviews...</div>
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No reviews yet. Be the first to review this product!
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calculate pagination
  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)
  const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
  const endIndex = startIndex + REVIEWS_PER_PAGE
  const paginatedReviews = reviews.slice(startIndex, endIndex)

  // Get reviewer name - either from user or reviewer_name field
  const getReviewerName = (review: Review) => {
    if (review.users) {
      return `${review.users.first_name} ${review.users.last_name}`.trim()
    }
    return review.reviewer_name || 'Anonymous'
  }

  // Get reviewer initials
  const getReviewerInitials = (review: Review) => {
    if (review.users) {
      return `${review.users.first_name?.[0] || ''}${review.users.last_name?.[0] || ''}`
    }
    const name = review.reviewer_name || 'A'
    const parts = name.split(' ')
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customer Reviews ({reviews.length})</h3>
      
      {paginatedReviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={review.users?.avatar_url} />
                <AvatarFallback>
                  {getReviewerInitials(review)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {getReviewerName(review)}
                    </span>
                    {review.is_verified_purchase && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <StarRating rating={review.rating} size="sm" />
                
                {review.title && (
                  <h4 className="font-medium">{review.title}</h4>
                )}
                
                {review.comment && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
