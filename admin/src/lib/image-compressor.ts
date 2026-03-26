/**
 * Client-side image compression utility.
 * Resizes and compresses images before upload to reduce bandwidth
 * and avoid server timeouts on large uploads.
 */

const MAX_DIMENSION = 2048 // Max width or height in pixels
const TARGET_SIZE_KB = 1024 // Target ~1MB per image
const JPEG_QUALITY_START = 0.85

/**
 * Compresses a single image file using canvas.
 * Maintains aspect ratio while reducing dimensions and file size.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith('image/')) {
    return file
  }

  // If already small enough, skip compression
  if (file.size <= TARGET_SIZE_KB * 1024) {
    return file
  }

  return new Promise<File>((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      try {
        // Calculate scaled dimensions maintaining aspect ratio
        let { width, height } = img

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        const outputType = 'image/jpeg'
        let quality = JPEG_QUALITY_START

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file)
                return
              }

              if (blob.size > TARGET_SIZE_KB * 1024 && quality > 0.5) {
                quality -= 0.1
                tryCompress()
                return
              }

              const baseName = file.name.replace(/\.[^.]+$/, '')
              const compressedFile = new File([blob], `${baseName}.jpeg`, {
                type: outputType,
                lastModified: file.lastModified,
              })

              const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0)
              console.log(
                `[ImageCompressor] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${savings}% smaller)`
              )

              resolve(compressedFile)
            },
            outputType,
            quality
          )
        }

        tryCompress()
      } catch (err) {
        console.error('[ImageCompressor] Error compressing image:', err)
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      console.warn('[ImageCompressor] Failed to load image, using original')
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Compresses multiple images in parallel.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)))
}
