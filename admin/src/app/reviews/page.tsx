'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Star, Check, X, Eye } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import AddReview from '@/components/AddReview'

interface Review {
  id: string
  rating: number
  comment: string
  is_approved: boolean
  created_at: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  product: {
    id: string
    name: string
    price: number
    image_url?: string
  }
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  
  const { toast } = useToast()

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (!response.ok) throw new Error('Failed to fetch reviews')
      
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reviews',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${reviewId}`)
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_approved: action === 'approve'
        })
      })

      // Try to read server response to show a meaningful error
      const result = await response.json().catch(() => null as any)
      if (!response.ok) {
        const msg = (result && (result.error || result.message)) || `Failed to ${action} review`
        throw new Error(msg)
      }

      toast({
        title: 'Success',
        description: `Review ${action}d successfully`
      })
      
      fetchReviews()
    } catch (error) {
      console.error(`Failed to ${action} review`, error)
      toast({
        title: 'Error',
        description: (error as Error)?.message || `Failed to ${action} review`,
        variant: 'destructive'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const reviewColumns: ColumnDef<Review>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-gray-300 w-4 h-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-gray-300 w-4 h-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'productName',
      accessorFn: (row) => {
        // Handle both products (plural) and product (singular) naming
        const product = (row as any).products || (row as any).product
        return product?.name ?? ''
      },
      header: 'Product',
      cell: ({ row }) => {
        // Handle both products (plural) and product (singular) naming
        const product = (row.original as any).products || (row.original as any).product
        return (
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-[150px]">
            <img
              src={product?.image_url || '/circular.svg'}
              alt={product?.name || 'Product'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-medium text-xs sm:text-sm truncate">{product?.name || 'Unknown Product'}</p>
              <p className="text-xs text-gray-600 hidden sm:block">TZS {product?.price || 0}</p>
            </div>
          </div>
        )
      },
      enableHiding: false,
    },
    {
      id: 'userEmail',
      accessorFn: (row) => row.user?.email ?? (row as any).reviewer_name ?? 'Guest',
      header: 'Customer',
      cell: ({ row }) => {
        const review = row.original as any;
        const isGuestReview = !review.user && review.reviewer_name;
        
        if (isGuestReview) {
          return (
            <div className="min-w-[120px]">
              <p className="font-medium text-xs sm:text-sm">{review.reviewer_name}</p>
              <p className="text-xs text-gray-500 hidden sm:block">Guest Review</p>
            </div>
          );
        }
        
        return (
          <div className="min-w-[120px]">
            <p className="font-medium text-xs sm:text-sm">
              {review.user?.first_name} {review.user?.last_name}
            </p>
            <p className="text-xs text-gray-600 hidden sm:block truncate">
              {review.user?.email}
            </p>
          </div>
        );
      },
      enableHiding: true,
      meta: { hideOnMobile: true },
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {renderStars(row.original.rating)}
          <span className="text-xs sm:hidden ml-1">{row.original.rating}</span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'comment',
      header: 'Comment',
      cell: ({ row }) => (
        <div className="max-w-[150px] sm:max-w-xs">
          <p className="truncate text-xs sm:text-sm">{row.original.comment}</p>
        </div>
      ),
      enableHiding: true,
      meta: { hideOnMobile: true },
    },
    {
      accessorKey: 'is_approved',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_approved ? 'default' : 'secondary'} className="text-xs whitespace-nowrap">
          {row.original.is_approved ? 'Approved' : 'Pending'}
        </Badge>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs sm:text-sm whitespace-nowrap">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
      enableHiding: true,
      meta: { hideOnMobile: true },
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex gap-1 sm:gap-2">
          {!row.original.is_approved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReviewAction(row.original.id, 'approve')}
              disabled={actionLoading === `approve-${row.original.id}`}
              className="h-9 w-9 sm:h-8 sm:w-8 p-0"
            >
              {actionLoading === `approve-${row.original.id}` ? 
                <Loader2 className="w-4 h-4 animate-spin" /> : 
                <Check className="w-4 h-4" />
              }
            </Button>
          )}
          {row.original.is_approved && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReviewAction(row.original.id, 'reject')}
              disabled={actionLoading === `reject-${row.original.id}`}
              className="h-9 w-9 sm:h-8 sm:w-8 p-0"
            >
              {actionLoading === `reject-${row.original.id}` ? 
                <Loader2 className="w-4 h-4 animate-spin" /> : 
                <X className="w-4 h-4" />
              }
            </Button>
          )}
        </div>
      )
    }
  ]

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    averageRating: reviews.length > 0 ? 
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0'
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Reviews Management</h1>
        <Sheet open={addOpen} onOpenChange={setAddOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => setAddOpen(true)} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">Add Review</Button>
          </SheetTrigger>
          <AddReview onCreated={() => { fetchReviews(); setAddOpen(false) }} />
        </Sheet>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Reviews</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">All reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Approved</CardTitle>
            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Published reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Overall rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Product Reviews</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage and moderate customer product reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <DataTable 
              columns={reviewColumns} 
              data={reviews}
              searchKey="productName"
              entityName="Review"
              deleteApiBase="/api/reviews"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
