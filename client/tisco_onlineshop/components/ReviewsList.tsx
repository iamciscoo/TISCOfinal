'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/StarRating'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Review {
  id: string
  rating: number
  title?: string
  comment?: string
  created_at: string
  is_verified_purchase: boolean
  user: {
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

interface ReviewsListProps {
  productId: string
  refreshTrigger?: number
}

export function ReviewsList({ productId, refreshTrigger }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Customer Reviews ({reviews.length})</h3>
      
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Avatar>
                <AvatarImage src={review.user.avatar_url} />
                <AvatarFallback>
                  {review.user.first_name?.[0]}{review.user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {review.user.first_name} {review.user.last_name}
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
    </div>
  )
}
