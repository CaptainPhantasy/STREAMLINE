'use client'

/**
 * PhotoCaptureButton Component
 *
 * Mobile-optimized button for capturing photos using device camera.
 * Handles camera permissions, compression, and optional auto-upload.
 *
 * @example
 * ```tsx
 * <PhotoCaptureButton
 *   jobId="123"
 *   onUploadComplete={(photo) => console.log('Uploaded:', photo)}
 *   autoUpload
 *   compress
 * />
 * ```
 */

import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { compressPhoto } from '@/lib/utils/photo-compressor'
import type {
  PhotoCaptureButtonProps,
  PhotoCaptureResult,
  JobPhoto,
} from '@/lib/types/documents'
import { cn } from '@/lib/utils'

export function PhotoCaptureButton({
  jobId,
  onCapture,
  onUploadComplete,
  onError,
  autoUpload = true,
  compress = true,
  compressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.85,
  },
  category,
  disabled = false,
  className,
}: PhotoCaptureButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  /**
   * Request camera permission and open camera
   */
  const handleCaptureClick = () => {
    if (disabled || isCapturing || isUploading) return

    // Trigger file input which opens camera on mobile
    fileInputRef.current?.click()
  }

  /**
   * Handle photo captured from camera
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsCapturing(true)

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Selected file is not an image')
      }

      // Create data URL for preview
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target?.result as string

          // Get image dimensions
          const img = new Image()
          img.onload = async () => {
            const captureResult: PhotoCaptureResult = {
              file,
              dataUrl,
              width: img.width,
              height: img.height,
              timestamp: Date.now(),
            }

            // Notify parent component
            onCapture?.(captureResult)

            // Auto-upload if enabled
            if (autoUpload) {
              await uploadPhoto(file)
            }

            setIsCapturing(false)
          }

          img.onerror = () => {
            throw new Error('Failed to load image')
          }

          img.src = dataUrl
        } catch (error) {
          console.error('Error processing photo:', error)
          const err = error as Error
          onError?.(err)
          toast({
            title: 'Error',
            description: err.message || 'Failed to process photo',
            variant: 'destructive',
          })
          setIsCapturing(false)
        }
      }

      reader.onerror = () => {
        const error = new Error('Failed to read file')
        onError?.(error)
        toast({
          title: 'Error',
          description: 'Failed to read photo file',
          variant: 'destructive',
        })
        setIsCapturing(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error capturing photo:', error)
      const err = error as Error
      onError?.(err)
      toast({
        title: 'Error',
        description: err.message || 'Failed to capture photo',
        variant: 'destructive',
      })
      setIsCapturing(false)
    }

    // Reset input value to allow capturing same file again
    event.target.value = ''
  }

  /**
   * Upload photo to server
   */
  const uploadPhoto = async (file: File) => {
    setIsUploading(true)

    try {
      let uploadFile: File | Blob = file

      // Compress photo if enabled
      if (compress) {
        toast({
          title: 'Compressing photo...',
          description: 'Optimizing image for upload',
        })

        const compressed = await compressPhoto(file, compressionOptions)

        // Create a new File object from compressed blob
        uploadFile = new File([compressed.blob], file.name, {
          type: compressed.blob.type,
        })

        const savings = compressed.compressionRatio.toFixed(0)
        toast({
          title: 'Photo compressed',
          description: `Reduced size by ${savings}%`,
        })
      }

      // Create form data
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('jobId', jobId)
      if (category) {
        formData.append('category', category)
      }

      // Upload to API
      toast({
        title: 'Uploading photo...',
        description: 'Please wait',
      })

      const response = await fetch('/api/job-photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Upload failed: ${response.status}`)
      }

      const data = await response.json()
      const photo: JobPhoto = data.photo

      toast({
        title: 'Photo uploaded',
        description: 'Photo saved successfully',
      })

      onUploadComplete?.(photo)
    } catch (error) {
      console.error('Error uploading photo:', error)
      const err = error as Error
      onError?.(err)
      toast({
        title: 'Upload failed',
        description: err.message || 'Failed to upload photo',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const isLoading = isCapturing || isUploading

  return (
    <>
      <Button
        type="button"
        onClick={handleCaptureClick}
        disabled={disabled || isLoading}
        className={cn(
          'min-h-[60px] touch-target-comfortable', // Large touch target for mobile
          className
        )}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {isCapturing ? 'Processing...' : 'Uploading...'}
          </>
        ) : (
          <>
            <Camera className="mr-2 h-5 w-5" />
            Take Photo
          </>
        )}
      </Button>

      {/* Hidden file input for camera access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera on mobile
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isLoading}
      />
    </>
  )
}

/**
 * Export types for external use
 */
export type { PhotoCaptureButtonProps }
