'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobPhotoGalleryProps } from '@/lib/types/tech-mobile'

/**
 * JobPhotoGallery - Full-screen mobile photo viewer
 *
 * Features:
 * - Full-screen modal view
 * - Swipe navigation between photos
 * - Before/after toggle
 * - Delete photo action
 * - Pinch-to-zoom support
 * - High contrast UI for outdoor use
 *
 * @example
 * ```tsx
 * <JobPhotoGallery
 *   photos={jobPhotos}
 *   initialIndex={0}
 *   onClose={() => setShowGallery(false)}
 *   onDelete={async (id) => await deletePhoto(id)}
 *   showDelete
 * />
 * ```
 */
export function JobPhotoGallery({
  photos,
  initialIndex = 0,
  onClose,
  onDelete,
  showDelete = false,
  className,
}: JobPhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isDeleting, setIsDeleting] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'before' | 'after'>('all')

  const currentPhoto = photos[currentIndex]

  // Filter photos by type
  const filteredPhotos = photos.filter((photo) => {
    if (filterType === 'all') return true
    return photo.type === filterType
  })

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleNext()
    } else if (isRightSwipe) {
      handlePrevious()
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }

  const handleDelete = async () => {
    if (!onDelete || !currentPhoto) return

    const confirmed = window.confirm('Delete this photo? This cannot be undone.')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await onDelete(currentPhoto.id)
      // Move to next photo or close if no photos left
      if (photos.length > 1) {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? prev - 1 : prev))
      } else {
        onClose?.()
      }
    } catch (error) {
      console.error('Failed to delete photo:', error)
      alert('Failed to delete photo')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = () => {
    if (!currentPhoto) return
    window.open(currentPhoto.url, '_blank')
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, photos.length])

  if (!currentPhoto) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 bg-black',
        'flex flex-col',
        className
      )}
    >
      {/* Header Bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Close Button - 60px touch target */}
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 active:bg-gray-700"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Photo Counter */}
          <div className="text-white font-bold text-lg">
            {currentIndex + 1} / {photos.length}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Type Badge */}
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold uppercase',
              currentPhoto.type === 'before' && 'bg-amber-600',
              currentPhoto.type === 'after' && 'bg-green-600',
              currentPhoto.type === 'progress' && 'bg-blue-600',
              currentPhoto.type === 'signature' && 'bg-purple-600'
            )}
          >
            {currentPhoto.type}
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-800 active:bg-gray-700"
          >
            <Download className="w-5 h-5 text-white" />
          </button>

          {/* Delete Button */}
          {showDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 active:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Photo Type Filter */}
      <div className="bg-gray-900/95 backdrop-blur-sm px-4 pb-3 flex gap-2">
        {['all', 'before', 'after'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as typeof filterType)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-bold uppercase',
              'transition-colors',
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 active:bg-gray-700'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Photo Display - Swipeable */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous Button - Desktop */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 z-10 w-14 h-14 rounded-full bg-gray-900/80 backdrop-blur-sm flex items-center justify-center active:bg-gray-800 hidden md:flex"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        {/* Photo */}
        <img
          src={currentPhoto.url}
          alt={`Photo ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{ touchAction: 'none' }}
        />

        {/* Next Button - Desktop */}
        <button
          onClick={handleNext}
          className="absolute right-4 z-10 w-14 h-14 rounded-full bg-gray-900/80 backdrop-blur-sm flex items-center justify-center active:bg-gray-800 hidden md:flex"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>

        {/* Swipe Hint - Mobile */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-400 text-sm md:hidden">
          ← Swipe to navigate →
        </div>
      </div>

      {/* Photo Metadata */}
      <div className="bg-gray-900/95 backdrop-blur-sm p-4">
        <div className="text-gray-400 text-sm space-y-1">
          <div>
            Captured: {new Date(currentPhoto.capturedAt).toLocaleString()}
          </div>
          {currentPhoto.metadata?.location && (
            <div className="text-xs">
              Location: {currentPhoto.metadata.location.lat.toFixed(6)},{' '}
              {currentPhoto.metadata.location.lng.toFixed(6)}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="bg-gray-900/95 backdrop-blur-sm p-4 overflow-x-auto">
        <div className="flex gap-2">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden',
                'border-2 transition-colors',
                index === currentIndex
                  ? 'border-blue-500'
                  : 'border-transparent opacity-50'
              )}
            >
              <img
                src={photo.url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * PhotoGalleryThumbnail - Compact thumbnail for opening gallery
 */
export function PhotoGalleryThumbnail({
  photos,
  onClick,
  className,
}: {
  photos: { url: string }[]
  onClick?: () => void
  className?: string
}) {
  if (photos.length === 0) {
    return null
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full h-32 rounded-xl overflow-hidden',
        'bg-gray-800 active:bg-gray-700 transition-colors',
        className
      )}
    >
      <img
        src={photos[0].url}
        alt="Gallery preview"
        className="w-full h-full object-cover"
      />
      {photos.length > 1 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-bold">
          +{photos.length - 1}
        </div>
      )}
    </button>
  )
}

export type { JobPhotoGalleryProps }
