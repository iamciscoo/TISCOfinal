'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface BookingResponse {
  data: {
    id: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
    preferred_date: string | null
    preferred_time: string | null
    notes: string | null
    created_at: string
    updated_at: string
    service_id: string
    user_id: string
    service_type: string
    description: string
    contact_email: string
    contact_phone: string
    customer_name: string
    service?: { id: string; title: string | null }
    user?: { id: string; first_name?: string | null; last_name?: string | null; email?: string | null }
  }
}

interface FormState {
  id: string
  serviceTitle: string
  customerName: string
  customerEmail: string
  status: string
  scheduledDate: string // yyyy-MM-ddTHH:mm
  totalAmount: string
  notes: string
  createdAt: string
}

const toLocalInputValue = (date?: string | null, time?: string | null): string => {
  if (!date) return ''
  try {
    // Combine date and time, defaulting time to 00:00 if not provided
    const timeStr = time || '00:00:00'
    const combined = `${date}T${timeStr}`
    const d = new Date(combined)
    if (Number.isNaN(d.getTime())) return ''
    
    const pad = (n: number) => String(n).padStart(2, '0')
    const y = d.getFullYear()
    const m = pad(d.getMonth() + 1)
    const day = pad(d.getDate())
    const h = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${y}-${m}-${day}T${h}:${min}`
  } catch {
    return ''
  }
}

export default function EditServiceBookingPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState<FormState>({
    id: '',
    serviceTitle: '',
    customerName: '',
    customerEmail: '',
    status: 'pending',
    scheduledDate: '',
    totalAmount: '0',
    notes: '',
    createdAt: ''
  })

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fetch(`/api/service-bookings/${id}`)
        if (!res.ok) throw new Error('Failed to fetch booking')
        const payload: BookingResponse = await res.json()
        const b = payload?.data
        const fullName = [b?.user?.first_name, b?.user?.last_name].filter(Boolean).join(' ')
        setForm(prev => ({
          ...prev,
          id: String(b?.id ?? ''),
          serviceTitle: b?.service?.title ?? b?.service_type ?? 'Unknown Service',
          customerName: fullName || b?.customer_name || b?.contact_email || 'Unknown User',
          customerEmail: b?.user?.email ?? b?.contact_email ?? '-',
          status: b?.status ?? 'pending',
          scheduledDate: toLocalInputValue(b?.preferred_date, b?.preferred_time),
          totalAmount: '0', // No total_amount in current schema
          notes: b?.notes ?? '',
          createdAt: b?.created_at ?? ''
        }))
      } catch (e) {
        toast({ title: 'Failed to load booking', variant: 'destructive' })
        router.push('/service-bookings')
      } finally {
        setFetching(false)
      }
    })()
  }, [id, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setLoading(true)
    try {
      const body: Record<string, unknown> = {}
      // Normalize and include editable fields
      if (form.scheduledDate !== undefined) body.scheduled_date = form.scheduledDate || null
      if (form.totalAmount !== undefined) {
        const n = Number(form.totalAmount)
        if (!Number.isNaN(n)) body.total_amount = n
      }
      if (form.notes !== undefined) body.notes = form.notes

      const res = await fetch(`/api/service-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error('Failed to update booking')
      toast({ title: 'Booking updated successfully' })
      router.push('/service-bookings')
    } catch (e) {
      toast({ title: 'Failed to update booking', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="container mx-auto py-10">Loading booking...</div>
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    confirmed: 'secondary',
    in_progress: 'outline',
    cancelled: 'destructive',
    pending: 'secondary'
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Booking</h1>
          <p className="text-muted-foreground">Update scheduled date, total amount, and notes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusVariant[form.status] || 'secondary'}>
                  {form.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Service</Label>
                  <div className="mt-1 text-sm font-medium">{form.serviceTitle}</div>
                </div>
                <div>
                  <Label>Customer</Label>
                  <div className="mt-1 text-sm font-medium">{form.customerName}</div>
                  <div className="text-xs text-muted-foreground">{form.customerEmail}</div>
                </div>
              </div>
              <div>
                <Label>Created at</Label>
                <div className="mt-1 text-sm">{form.createdAt ? new Date(form.createdAt).toLocaleString() : '-'}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Edit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="scheduledDate">Scheduled date & time</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={form.scheduledDate}
                  onChange={(e) => setForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="totalAmount">Total amount (TZS)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="1"
                  inputMode="numeric"
                  value={form.totalAmount}
                  onChange={(e) => setForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add admin notes about this booking"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/service-bookings')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
