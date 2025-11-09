'use client'
import { useEffect, useState, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ServiceProcessingOverlay } from '@/components/ServiceProcessingOverlay'
import { AuthModal } from '@/components/auth/AuthModal'
import { Calendar, Clock, Mail, Phone, User, FileText, CheckCircle } from 'lucide-react'
import Image from 'next/image'

type Service = { id: string; title: string }

interface ServiceDetails {
  id: string
  title: string
  description?: string
  features?: string[]
  duration?: string
  image?: string
}

export const ServiceBookingForm = ({ defaultServiceId, services: servicesProp }: { defaultServiceId?: string; services?: Service[] }) => {
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const formRef = useRef<HTMLFormElement>(null)
  const [services, setServices] = useState<Service[]>(servicesProp ?? [])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error' | 'idle'>('idle')
  const [processingError, setProcessingError] = useState<string>('')
  const [today] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedService, setSelectedService] = useState<string>(defaultServiceId || '')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [resetKey, setResetKey] = useState<number>(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [serviceDetails, setServiceDetails] = useState<ServiceDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Submit the start time of the chosen range to keep DB type compatibility (TIME)
  const TIME_RANGES = [
    { id: 'morning', label: 'Morning (08:00 – 11:00)', value: '08:00' },
    { id: 'afternoon', label: 'Afternoon (12:00 – 16:00)', value: '12:00' },
    { id: 'evening', label: 'Evening (17:00 – 19:30)', value: '17:00' },
  ] as const

  useEffect(() => {
    setServices(servicesProp ?? [])
  }, [servicesProp])

  // Fallback: if no services are passed from the page, fetch from API to ensure dropdown is populated
  useEffect(() => {
    const shouldFetch = !servicesProp || servicesProp.length === 0
    if (!shouldFetch) return

    let isMounted = true
    setServicesLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/services', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load services')
        const j = await res.json()
        const apiServices: Service[] = (Array.isArray(j?.services) ? j.services : []).map(
          (s: { id: string; title: string }) => ({ id: s.id, title: s.title })
        )
        if (isMounted) setServices(apiServices)
      } catch (err) {
        console.error('[ServiceBookingForm] failed to fetch services', err)
        if (isMounted) {
          toast({ title: 'Unable to load services', description: 'Please refresh the page.', variant: 'destructive' })
        }
      } finally {
        if (isMounted) setServicesLoading(false)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [servicesProp, toast])

  useEffect(() => {
    const list = servicesProp ?? services
    if (defaultServiceId && list.some(s => s.id === defaultServiceId)) {
      setSelectedService(defaultServiceId)
    } else {
      setSelectedService('')
    }
  }, [defaultServiceId, servicesProp, services])

  // Fetch full service details when a service is selected
  useEffect(() => {
    if (!selectedService) {
      setServiceDetails(null)
      return
    }

    let isMounted = true
    setLoadingDetails(true)

    ;(async () => {
      try {
        const res = await fetch(`/api/services/${selectedService}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load service details')
        const data = await res.json()
        if (isMounted) {
          setServiceDetails(data.service)
        }
      } catch (err) {
        console.error('[ServiceBookingForm] Failed to fetch service details', err)
        // Don't show toast for this, just fail silently
      } finally {
        if (isMounted) {
          setLoadingDetails(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [selectedService])

  async function onSubmit(formData: FormData) {
    try {
      // Check if user is signed in
      if (!user) {
        toast({ 
          title: 'Sign in required', 
          description: 'Please sign in to continue booking your service.', 
          variant: 'default' 
        })
        // Open auth modal instead of redirecting
        setShowAuthModal(true)
        return
      }
      
      // Basic client-side validation for select-based fields
      if (!selectedService) {
        toast({ title: 'Missing service', description: 'Please select a service.', variant: 'destructive' })
        return
      }
      if (!selectedTime) {
        toast({ title: 'Missing time', description: 'Please select a preferred time range.', variant: 'destructive' })
        return
      }

      setLoading(true)
      setProcessingStatus('processing')
      setProcessingError('')
      
      const payload = Object.fromEntries(formData.entries()) as Record<string, string>
      const res = await fetch('/api/service-bookings', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          service_id: selectedService,
          description: payload.description,
          preferred_date: payload.preferred_date,
          preferred_time: selectedTime,
          contact_email: payload.contact_email,
          contact_phone: payload.contact_phone,
          customer_name: payload.customer_name,
        }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        
        // Handle specific error codes
        if (res.status === 401) {
          throw new Error('Authentication required. Please sign in and try again.')
        }
        
        // Show detailed error message if available
        const errorMsg = j?.message || j?.error || `Failed to create booking (${res.status})`
        throw new Error(errorMsg)
      }
      
      // Success state
      setProcessingStatus('success')
      // Don't reset immediately - let success overlay show first
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to create booking'
      setProcessingStatus('error')
      setProcessingError(errorMessage)
      // Keep toast as fallback for users who might miss the overlay
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClose = () => {
    // If closing from success state, reset the form
    if (processingStatus === 'success') {
      // Hard reset all form states
      console.log('Resetting form after success')
      formRef.current?.reset()
      // Force complete reset by changing key and clearing states
      setSelectedService('')
      setSelectedTime('')
      setResetKey(prev => prev + 1)
    }
    setProcessingStatus('idle')
    setProcessingError('')
  }

  const selectedTimeLabel = TIME_RANGES.find(r => r.value === selectedTime)?.label

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Left Column - Booking Form */}
        <div className="lg:col-span-3">
          <Card className="shadow-lg border-gray-200">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Service</h3>
                <p className="text-gray-600">Fill out the form below and we&apos;ll get back to you shortly. </p>
              </div>

              <form ref={formRef} onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                onSubmit(formData)
              }} className="space-y-6">
                {/* Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service_id" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Service *
                  </Label>
                  <Select key={`service-${resetKey}`} value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger id="service_id" aria-required="true" className="w-full h-12 border-gray-300">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]" position="popper">
                      {servicesLoading && (
                        <SelectItem value="__loading__" disabled>Loading services…</SelectItem>
                      )}
                      {!servicesLoading && services.length === 0 && (
                        <SelectItem value="__empty__" disabled>No services available</SelectItem>
                      )}
                      {!servicesLoading && services.length > 0 && services.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" id="service_id" name="service_id" value={selectedService ?? ''} required aria-label="Service ID" />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Full Name *
                      </Label>
                      <Input 
                        id="customer_name" 
                        name="customer_name" 
                        type="text" 
                        autoComplete="name" 
                        placeholder="Your full name" 
                        required 
                        className="h-12 border-gray-300" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        Email *
                      </Label>
                      <Input 
                        id="contact_email" 
                        name="contact_email" 
                        type="email" 
                        autoComplete="email" 
                        required 
                        className="h-12 border-gray-300" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Phone
                    </Label>
                    <Input 
                      id="contact_phone" 
                      name="contact_phone" 
                      type="tel" 
                      autoComplete="tel" 
                      placeholder="+255 700 000 000" 
                      className="h-12 border-gray-300" 
                    />
                  </div>
                </div>

                {/* Schedule */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Preferred Schedule</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferred_date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        Preferred Date *
                      </Label>
                      <Input 
                        id="preferred_date" 
                        name="preferred_date" 
                        type="date" 
                        min={today} 
                        required 
                        className="h-12 border-gray-300" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preferred_time" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        Preferred Time *
                      </Label>
                      <Select key={`time-${resetKey}`} value={selectedTime} onValueChange={setSelectedTime}>
                        <SelectTrigger id="preferred_time" aria-required="true" className="w-full h-12 border-gray-300">
                          <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]" position="popper">
                          {TIME_RANGES.map((r) => (
                            <SelectItem key={r.id} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input type="hidden" id="preferred_time_value" name="preferred_time" value={selectedTime ?? ''} required aria-label="Preferred Time" />
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Service Description *
                  </Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    placeholder="Briefly describe your requirements, issues, or what you need help with... (Swahili, English or French)" 
                    required 
                    className="min-h-[120px] border-gray-300 resize-none" 
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading || authLoading} 
                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white text-lg font-semibold"
                    onClick={(e) => {
                      if (!user && !authLoading) {
                        e.preventDefault()
                        setShowAuthModal(true)
                        toast({ 
                          title: 'Sign in required', 
                          description: 'Please sign in to continue booking your service.', 
                          variant: 'default' 
                        })
                      }
                    }}
                  >
                    {authLoading ? 'Checking authentication...' : loading ? 'Submitting…' : !user ? 'Sign in to Continue' : 'Submit Service Request'}
                  </Button>
                  
                  {!user && !authLoading && (
                    <p className="text-sm text-orange-600 mt-3 text-center">
                      Please <button 
                        type="button"
                        onClick={() => setShowAuthModal(true)} 
                        className="underline font-semibold hover:text-orange-700"
                      >
                        sign in
                      </button> to book a service
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Service Summary */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-gray-200 sticky top-24">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>
              
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading service details...</p>
                  </div>
                </div>
              ) : !selectedService ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">Select a service to view details</p>
                  <p className="text-sm text-gray-500">Choose from the dropdown above</p>
                </div>
              ) : serviceDetails ? (
                <div className="space-y-4">
                  {/* Service Image */}
                  {serviceDetails.image && (
                    <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                      <Image 
                        src={serviceDetails.image} 
                        alt={serviceDetails.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Selected Service */}
                  <div className="pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Selected Service</p>
                    <p className="text-lg font-semibold text-gray-900">{serviceDetails.title}</p>
                    {serviceDetails.description && (
                      <p className="text-sm text-gray-600 mt-2">{serviceDetails.description}</p>
                    )}
                  </div>

                  {/* Duration */}
                  {serviceDetails.duration && (
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Service Duration</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-medium text-gray-900">{serviceDetails.duration}</p>
                      </div>
                    </div>
                  )}

                  {/* Schedule Details */}
                  {selectedTime && (
                    <div className="pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Preferred Time</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="font-medium text-sm">{selectedTimeLabel || 'Not selected'}</p>
                      </div>
                    </div>
                  )}

                  {/* Service Features */}
                  {serviceDetails.features && serviceDetails.features.length > 0 && (
                    <div className="space-y-3 pb-4 border-b border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">What&apos;s Included</p>
                      <div className="space-y-2">
                        {serviceDetails.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Time */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 mb-1">Quick Response</p>
                        <p className="text-sm text-gray-600">We&apos;ll contact you shortly to confirm your booking</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Unable to load service details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Overlay */}
      <ServiceProcessingOverlay
        isVisible={processingStatus !== 'idle'}
        status={processingStatus}
        onClose={handleOverlayClose}
        errorMessage={processingError}
      />
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="signin"
      />
    </>
  )
}


