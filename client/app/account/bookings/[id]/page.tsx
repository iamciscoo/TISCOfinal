import { notFound } from 'next/navigation'
import { getUser } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Mail, 
  FileText, 
  DollarSign,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CartSidebar } from '@/components/CartSidebar'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type ServiceBooking = {
  id: string
  service_id: string
  user_id: string
  service_type: string
  description: string | null
  preferred_date: string | null
  preferred_time: string | null
  contact_email: string
  contact_phone: string | null
  customer_name: string
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
  total_amount: number | null
  payment_status: string
  service: {
    id: string
    title: string
    description: string
    duration: string | null
    image: string | null
    features?: string[]
    gallery?: string[]
  }
}

const getServiceBooking = async (id: string, userId: string): Promise<ServiceBooking | null> => {
  const { data, error } = await supabase
    .from('service_bookings')
    .select(`
      id,
      service_id,
      user_id,
      service_type,
      description,
      preferred_date,
      preferred_time,
      contact_email,
      contact_phone,
      customer_name,
      status,
      notes,
      created_at,
      updated_at,
      total_amount,
      payment_status,
      services!inner(
        id,
        title,
        description,
        duration,
        image,
        features,
        gallery
      )
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching booking:', error)
    return null
  }

  if (!data) {
    return null
  }

  // Transform the data to match our type structure
  // Supabase returns services as an array when using !inner join, so we take the first item
  const service = Array.isArray(data.services) ? data.services[0] : data.services
  
  const booking: ServiceBooking = {
    id: data.id,
    service_id: data.service_id,
    user_id: data.user_id,
    service_type: data.service_type,
    description: data.description,
    preferred_date: data.preferred_date,
    preferred_time: data.preferred_time,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    customer_name: data.customer_name,
    status: data.status || 'pending',
    notes: data.notes,
    created_at: data.created_at,
    updated_at: data.updated_at,
    total_amount: data.total_amount,
    payment_status: data.payment_status,
    service: service || {
      id: '',
      title: 'Unknown Service',
      description: 'Service information not available',
      duration: 'Not specified',
      image: null,
      features: [],
      gallery: []
    }
  }

  return booking
}

const formatTZS = (amount: number) => {
  return `TZS ${Math.round(amount).toLocaleString()}`
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-600" />
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default'
    case 'confirmed':
      return 'secondary'
    case 'in_progress':
      return 'outline'
    case 'cancelled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getPaymentStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'paid':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'refunded':
      return 'outline'
    default:
      return 'secondary'
  }
}

// Generate static params for service bookings at build time
export async function generateStaticParams() {
  try {
    // Import server-side Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
      console.warn('Missing environment variables for service bookings generateStaticParams, skipping static generation')
      return []
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    )
    
    // Fetch recent booking IDs to generate static routes (limit for build performance)
    const { data: bookings, error } = await supabase
      .from('service_bookings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(100) // Reasonable limit for build time
    
    if (error) {
      console.error('Database error in service bookings generateStaticParams:', error)
      return []
    }
    
    console.log(`Generated static params for ${bookings?.length || 0} service bookings`)
    
    // Return array of params for each booking
    return (bookings || []).map((booking: { id: string }) => ({
      id: booking.id,
    }))
  } catch (error) {
    console.error('Error generating static params for service bookings:', error)
    // Return empty array to prevent build failure
    return []
  }
}

// Enable ISR with fallback for bookings not pre-generated
export const dynamicParams = true

const ServiceBookingDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const user = await getUser()
  const { id } = await params
  
  if (!user) {
    notFound()
  }

  const booking = await getServiceBooking(id, user.id)
  
  if (!booking) {
    notFound()
  }

  const scheduledDateTime = booking.preferred_date && booking.preferred_time ? 
    `${booking.preferred_date}T${booking.preferred_time}` : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <CartSidebar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/account/bookings">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Booking Details</h1>
              <p className="text-gray-600 mt-1">Booking #{booking.id.slice(-8)}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(booking.status || 'pending')}
              <Badge variant={getStatusBadgeVariant(booking.status || 'pending') as 'default' | 'secondary' | 'outline' | 'destructive'}>
                {(booking.status || 'pending').replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Service Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {booking.service?.image ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden relative bg-gray-100">
                      <Image
                        src={booking.service.image}
                        alt={booking.service?.title || 'Service'}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">No image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{booking.service?.title || 'Unknown Service'}</h3>
                    <p className="text-gray-600 mt-1">{booking.service?.description || 'No description available'}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {booking.service?.duration || 'Duration not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scheduling Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Scheduling Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Preferred Date</label>
                    <p className="text-gray-900 mt-1">
                      {booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Preferred Time</label>
                    <p className="text-gray-900 mt-1">{booking.preferred_time || 'Not specified'}</p>
                  </div>
                </div>
                
                {scheduledDateTime && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Scheduled Appointment</h4>
                    <p className="text-blue-800">
                      {new Date(scheduledDateTime).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Notes */}
            {booking.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount</span>
                  <span>{formatTZS(Number(booking.total_amount ?? 0))}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Payment Status</span>
                  <Badge variant={getPaymentStatusBadgeVariant(booking.payment_status || 'pending') as 'default' | 'secondary' | 'destructive' | 'outline'}>
                    {(booking.payment_status || 'pending')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Booking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Booking Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {booking.updated_at !== booking.created_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-gray-500">
                          {new Date(booking.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions about your booking? Our support team is here to help.
                </p>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}

export default ServiceBookingDetailsPage
