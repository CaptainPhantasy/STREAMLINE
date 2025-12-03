/**
 * Photo Compression Utility
 *
 * Reusable utility for compressing images before upload.
 * Reduces bandwidth usage and improves upload speed on mobile.
 */

import type { CompressionOptions, CompressedPhoto } from '@/lib/types/documents'

/**
 * Default compression options
 */
const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg',
  preserveExif: false,
}

/**
 * Compress a photo file or blob
 *
 * @param file - File or Blob to compress
 * @param options - Compression options
 * @returns Promise<CompressedPhoto>
 *
 * @example
 * ```typescript
 * const compressed = await compressPhoto(file, {
 *   maxWidth: 1280,
 *   quality: 0.8
 * })
 * console.log(`Reduced from ${compressed.originalSize} to ${compressed.compressedSize}`)
 * ```
 */
export async function compressPhoto(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<CompressedPhoto> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    // Check if file is an image
    const fileType = file.type
    if (!fileType.startsWith('image/')) {
      reject(new Error('File is not an image'))
      return
    }

    const originalSize = file.size

    // Create FileReader to read the file
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.onload = (e) => {
      const img = new Image()

      img.onerror = () => reject(new Error('Failed to load image'))

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img
          const aspectRatio = width / height

          if (width > opts.maxWidth) {
            width = opts.maxWidth
            height = width / aspectRatio
          }

          if (height > opts.maxHeight) {
            height = opts.maxHeight
            width = height * aspectRatio
          }

          // Create canvas for compression
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'))
                return
              }

              const compressedSize = blob.size
              const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(2)

              // Create data URL for preview
              const dataUrl = canvas.toDataURL(opts.mimeType, opts.quality)

              resolve({
                blob,
                dataUrl,
                originalSize,
                compressedSize,
                compressionRatio: parseFloat(compressionRatio),
                width,
                height,
              })
            },
            opts.mimeType,
            opts.quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple photos in parallel
 *
 * @param files - Array of files to compress
 * @param options - Compression options
 * @param onProgress - Progress callback (0-100)
 * @returns Promise<CompressedPhoto[]>
 *
 * @example
 * ```typescript
 * const compressed = await compressPhotos(files, {
 *   maxWidth: 1280,
 *   quality: 0.8
 * }, (progress) => {
 *   console.log(`Compression progress: ${progress}%`)
 * })
 * ```
 */
export async function compressPhotos(
  files: (File | Blob)[],
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<CompressedPhoto[]> {
  const results: CompressedPhoto[] = []
  let completed = 0

  for (const file of files) {
    try {
      const compressed = await compressPhoto(file, options)
      results.push(compressed)
      completed++
      onProgress?.(Math.round((completed / files.length) * 100))
    } catch (error) {
      console.error('Failed to compress photo:', error)
      // Skip failed compressions
      completed++
      onProgress?.(Math.round((completed / files.length) * 100))
    }
  }

  return results
}

/**
 * Check if compression is needed
 *
 * @param file - File to check
 * @param maxSize - Maximum file size in bytes
 * @param maxDimension - Maximum width or height
 * @returns true if compression is recommended
 */
export function shouldCompress(
  file: File | Blob,
  maxSize: number = 2 * 1024 * 1024, // 2MB
  maxDimension: number = 1920
): boolean {
  // Check file size
  if (file.size > maxSize) {
    return true
  }

  // For dimension check, we'd need to load the image
  // For now, compress if file is large
  return false
}

/**
 * Get image dimensions without loading into canvas
 *
 * @param file - File or Blob
 * @returns Promise with width and height
 */
export function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.onload = (e) => {
      const img = new Image()

      img.onerror = () => reject(new Error('Failed to load image'))

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        })
      }

      img.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Create thumbnail from image
 *
 * @param file - File or Blob
 * @param size - Thumbnail size (square)
 * @returns Promise<Blob>
 */
export async function createThumbnail(
  file: File | Blob,
  size: number = 200
): Promise<Blob> {
  const compressed = await compressPhoto(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    mimeType: 'image/jpeg',
  })

  return compressed.blob
}
