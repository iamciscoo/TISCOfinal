'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Image from 'next/image'
import { 
  Calendar, 
  Search, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Settings,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { formatToEAT } from '@/lib/utils'
import { CartSidebar } from '@/components/CartSidebar'
import { LoadingSpinner } from '@/components/shared'

type ServiceBooking = {
  id: string
  created_at: string
  service_type: string
  description: string
  preferred_date: string
  preferred_time: string
  contact_email: string
  contact_phone: string | null
  customer_name: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  services?: {
    id: string
    title: string
    description: string
    duration: string
    image: string
  } | null
}

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const isLoaded = !loading
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchBookings(true)
  }, [])

  const fetchBookings = async (isInitial = false) => {
    try {
      if (isInitial) setInitialLoading(true)
      else setRefreshing(true)
      const response = await fetch('/api/service-bookings?fresh=1', {
        cache: 'no-store',
        headers: { 'x-no-cache': '1' }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(Array.isArray(data?.bookings) ? (data.bookings as ServiceBooking[]) : [])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      if (isInitial) setInitialLoading(false)
      else setRefreshing(false)
    }
  }

  // Client-side redirect when not signed in to prevent hook-order mismatch
  useEffect(() => {
    if (isLoaded && !user) {
      router.replace('/sign-in?redirect_url=/account/bookings')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner text="Loading bookings..." fullScreen />
      </div>
    )
  }

  if (isLoaded && !user) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Settings className="h-4 w-4 text-blue-600" />
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return variants[status as keyof typeof variants] || variants.pending
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.services?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Link href="/account">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {refreshing && <LoadingSpinner size="sm" />}
              <Button onClick={() => fetchBookings()} variant="outline" size="sm">
                Refresh
              </Button>
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Service Bookings</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your service appointments and bookings
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {initialLoading ? (
          <LoadingSpinner text="Loading your bookings..." />
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {bookings.length === 0 ? 'No bookings yet' : 'No bookings match your search'}
              </h3>
              <p className="text-gray-600 mb-6">
                {bookings.length === 0 
                  ? 'When you book a service, it will appear here.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {bookings.length === 0 && (
                <Button asChild>
                  <Link href="/services">Browse Services</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="flex items-start gap-4 flex-1 w-full">
                      {/* Service Image */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {booking.services?.image ? (
                          <Image
                            src={booking.services.image}
                            alt={booking.services.title || 'Service'}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Settings className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {booking.services?.title || 'Service Booking'}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Booking #{booking.id.slice(0, 8)}
                            </p>
                          </div>
                          <Badge className={`${getStatusBadge(booking.status)} border text-xs sm:text-sm whitespace-nowrap`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1 capitalize">{booking.status.replace('_', ' ')}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Service Type:</span> {booking.service_type}
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span> {booking.services?.duration || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Preferred Date:</span> {formatToEAT(booking.preferred_date, { includeTime: false, dateStyle: 'medium' })}
                          </div>
                          <div>
                            <span className="font-medium">Preferred Time:</span> {booking.preferred_time}
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="font-medium text-xs sm:text-sm text-gray-600">Description:</span>
                          <p className="text-xs sm:text-sm text-gray-800 mt-1 line-clamp-2">{booking.description}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="text-xs text-gray-500">
                            Booked on {formatToEAT(booking.created_at, { includeTime: false, dateStyle: 'medium' })}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/account/bookings/${booking.id}`} className="w-full sm:w-auto">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto"
                              >
                                <Eye className="h-4 w-4" />
                                <span className="text-xs sm:text-sm">View Details</span>
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <CartSidebar />
    </div>
  )
}
