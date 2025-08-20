'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, X, Star, ArrowUp, ArrowDown } from 'lucide-react'
import Image from 'next/image'

interface ProductImage {
  id: string
  url: string
  is_main: boolean
  sort_order: number
}

interface ProductImageManagerProps {
  productId: string
  images: ProductImage[]
  onImagesUpdated: () => void
}

export const ProductImageManager = ({ productId, images, onImagesUpdated }: ProductImageManagerProps) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      Array.from(files).forEach(file => formData.append('files', file))
      formData.append('productId', productId)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        onImagesUpdated()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [productId, onImagesUpdated])

  const updateImageOrder = async (imageId: string, newSortOrder: number) => {
    try {
      await fetch(`/api/product-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: newSortOrder }),
      })
      onImagesUpdated()
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const setMainImage = async (imageId: string) => {
    try {
      await fetch(`/api/product-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_main: true }),
      })
      onImagesUpdated()
    } catch (error) {
      console.error('Failed to set main image:', error)
    }
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    
    try {
      await fetch(`/api/product-images/${imageId}`, {
        method: 'DELETE',
      })
      onImagesUpdated()
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFileUpload(e.dataTransfer.files)
        }}
      >
        <CardContent className="p-6 text-center">
          {uploading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading images...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Drop images here or click to upload</p>
                <p className="text-xs text-gray-500">Supports JPG, PNG, WebP up to 10MB each</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="image-upload" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images
            .sort((a, b) => {
              if (a.is_main && !b.is_main) return -1
              if (!a.is_main && b.is_main) return 1
              return (a.sort_order || 0) - (b.sort_order || 0)
            })
            .map((image, index) => (
              <Card key={image.id} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover rounded"
                    />
                    
                    {image.is_main && (
                      <Badge className="absolute top-1 left-1 bg-green-600">
                        <Star className="h-3 w-3 mr-1" />
                        Main
                      </Badge>
                    )}
                    
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity space-y-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-6 h-6 p-0"
                        onClick={() => deleteImage(image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-6 h-6 p-0"
                            onClick={() => updateImageOrder(image.id, Math.max(0, (image.sort_order || 0) - 1))}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-6 h-6 p-0"
                            onClick={() => updateImageOrder(image.id, (image.sort_order || 0) + 1)}
                            disabled={index === images.length - 1}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        {!image.is_main && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-0 h-6"
                            onClick={() => setMainImage(image.id)}
                          >
                            Set Main
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
