'use client'
import { useEffect, useState, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ServiceProcessingOverlay } from '@/components/ServiceProcessingOverlay'

type Service = { id: string; title: string }

export const ServiceBookingForm = ({ defaultServiceId, services: servicesProp }: { defaultServiceId?: string; services?: Service[] }) => {
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null)
  const [services, setServices] = useState<Service[]>(servicesProp ?? [])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<'processing' | 'success' | 'error' | 'idle'>('idle')
  const [processingError, setProcessingError] = useState<string>('')
  const [today] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedService, setSelectedService] = useState<string | undefined>(defaultServiceId)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [resetKey, setResetKey] = useState<number>(0)

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
      setSelectedService(undefined)
    }
  }, [defaultServiceId, servicesProp, services])

  async function onSubmit(formData: FormData) {
    try {
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
        throw new Error(j?.error || 'Failed to create booking')
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
      setSelectedService(undefined)
      setSelectedTime(undefined)
      setResetKey(prev => prev + 1)
    }
    setProcessingStatus('idle')
    setProcessingError('')
  }

  return (
    <Card className="shadow-xl">
      <CardContent className="p-4 sm:p-6 md:p-8">
        <form ref={formRef} onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          onSubmit(formData)
        }} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="service_id" className="text-sm font-medium">Service *</Label>
              <Select key={`service-${resetKey}`} value={selectedService || undefined} onValueChange={setSelectedService}>
                <SelectTrigger id="service_id" aria-required="true" className="w-full touch-manipulation">
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
              <input type="hidden" name="service_id" value={selectedService ?? ''} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm font-medium">Email *</Label>
              <Input id="contact_email" name="contact_email" type="email" autoComplete="email" required className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="text-sm font-medium">Phone</Label>
              <Input id="contact_phone" name="contact_phone" type="tel" autoComplete="tel" placeholder="+255 700 000 000" className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_date" className="text-sm font-medium">Preferred Date *</Label>
              <Input id="preferred_date" name="preferred_date" type="date" min={today} required className="touch-manipulation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time" className="text-sm font-medium">Preferred Time Range *</Label>
              <Select key={`time-${resetKey}`} value={selectedTime || undefined} onValueChange={setSelectedTime}>
                <SelectTrigger id="preferred_time" aria-required="true" className="w-full touch-manipulation">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]" position="popper">
                  {TIME_RANGES.map((r) => (
                    <SelectItem key={r.id} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="preferred_time" value={selectedTime ?? ''} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_name" className="text-sm font-medium">Full Name *</Label>
              <Input id="customer_name" name="customer_name" type="text" autoComplete="name" placeholder="Your full name" required className="touch-manipulation" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Service Description *</Label>
            <Textarea id="description" name="description" placeholder="Briefly describe the issue or request...  (Swahili, English or French feel free)" required className="min-h-[100px] sm:min-h-[120px] touch-manipulation" />
          </div>

          <Button type="submit" disabled={loading} className="w-full md:w-auto bg-gray-900 hover:bg-gray-800 touch-manipulation py-2.5 sm:py-2">{loading ? 'Submitting…' : 'Submit Service Request'}</Button>
        </form>
      </CardContent>
      
      {/* Processing Overlay */}
      <ServiceProcessingOverlay
        isVisible={processingStatus !== 'idle'}
        status={processingStatus}
        onClose={handleOverlayClose}
        errorMessage={processingError}
      />
    </Card>
  )
}


