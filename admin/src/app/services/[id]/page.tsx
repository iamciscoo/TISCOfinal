'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Service {
  id: string
  title: string
  description: string
  features: string[]
  duration: string
  image: string
  display_order: number
}

export default function EditServicePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState<Service>({
    id: '',
    title: '',
    description: '',
    features: [],
    duration: '',
    image: '',
    display_order: 0,
  })
  const [newFeature, setNewFeature] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handlePickFile = () => fileInputRef.current?.click()

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/uploads/service-image', {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to upload image')
      }
      setFormData(prev => ({ ...prev, image: data.url }))
      toast({ title: 'Image uploaded', description: 'Main image URL set from upload' })
    } catch (err) {
      toast({ title: 'Upload failed', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    fetchService(id)
  }, [id])

  const fetchService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`)
      if (!response.ok) throw new Error('Failed to fetch service')
      
      const service = await response.json()
      // Normalize null/undefined values to avoid passing null to controlled inputs
      setFormData(prev => ({
        ...prev,
        id: service?.id ?? prev.id ?? '',
        title: service?.title ?? '',
        description: service?.description ?? '',
        duration: service?.duration ?? '',
        image: service?.image ?? '',
        display_order: service?.display_order ?? 0,
        features: Array.isArray(service?.features) ? service.features.filter(Boolean) : []
      }))
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load service',
        variant: 'destructive'
      })
      router.push('/services')
    } finally {
      setFetching(false)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!id) throw new Error('Missing service id')
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update service')
      }

      toast({
        title: 'Success',
        description: 'Service updated successfully'
      })
      router.push('/services')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update service',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="container mx-auto py-10">Loading service...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Edit Service</h1>
          <p className="text-muted-foreground">
            Update service information and settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter service title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter service description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 2-4 hours"
                />
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Lower numbers appear first. 0 = default order.
                </p>
              </div>

              <div>
                <Label htmlFor="image">Main Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="Enter image URL or use Upload"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadImage(f)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={handlePickFile} disabled={isUploading}>
                    {isUploading ? 'Uploading…' : 'Upload'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a feature"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2 items-start">
                  {formData.features.map((feature, index) => (
                    <Badge
                      key={`${feature}-${index}`}
                      variant="secondary"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm"
                    >
                      <span className="truncate max-w-[220px]" title={feature}>
                        {feature}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${feature}`}
                        onClick={() => removeFeature(index)}
                        className="ml-1 -mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                      >
                        <X className="h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {formData.features.length === 0 && (
                <p className="text-sm text-muted-foreground">No features added yet. Add features to highlight what's included in this service.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/services')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

