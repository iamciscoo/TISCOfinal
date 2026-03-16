'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface ProductImagePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  alt: string
  currentIndex: number
  totalImages: number
  onNavigate: (direction: 'prev' | 'next') => void
}

export function ProductImagePreview({
  open,
  onOpenChange,
  imageSrc,
  alt,
  currentIndex,
  totalImages,
  onNavigate,
}: ProductImagePreviewProps) {
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setImageError(false)
  }, [imageSrc, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        data-testid="product-image-preview-dialog"
        className="w-full max-w-[calc(100%-1rem)] border-none bg-transparent p-0 shadow-none sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        <DialogDescription className="sr-only">
          Enlarged preview of the selected product image.
        </DialogDescription>
        <div className="relative rounded-2xl bg-black/95 p-3 sm:p-4">
          {totalImages > 1 ? (
            <>
              <div className="pointer-events-none absolute top-3 bottom-12 left-3 z-[1] w-20 rounded-l-xl bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute top-3 right-3 bottom-12 z-[1] w-20 rounded-r-xl bg-gradient-to-l from-black/60 via-black/25 to-transparent" />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute top-1/2 left-5 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-black/70 hover:text-white disabled:border-white/10 disabled:bg-black/35 disabled:opacity-60"
                onClick={() => onNavigate('prev')}
                aria-label="Previous preview image"
                data-testid="product-image-preview-prev"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="absolute top-1/2 right-5 z-10 h-11 w-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/55 text-white shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-md hover:bg-black/70 hover:text-white disabled:border-white/10 disabled:bg-black/35 disabled:opacity-60"
                onClick={() => onNavigate('next')}
                aria-label="Next preview image"
                data-testid="product-image-preview-next"
                disabled={currentIndex === totalImages - 1}
              >
                <ChevronRight className="h-6 w-6 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              </Button>
            </>
          ) : null}

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close image preview"
            data-testid="product-image-preview-close"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="relative mx-auto aspect-square max-h-[80vh] w-full overflow-hidden rounded-xl">
            <Image
              src={imageError ? '/circular.svg' : (imageSrc || '/circular.svg')}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              onError={() => setImageError(true)}
              unoptimized={imageError}
            />
          </div>

          {totalImages > 1 ? (
            <div className="mt-3 text-center text-sm font-medium text-white/80">
              {currentIndex + 1} / {totalImages}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
