'use client'

/**
 * PhotoGallery Component
 *
 * Grid-based photo gallery with before/after filtering and lightbox.
 *
 * @example
 * ```tsx
 * <PhotoGallery
 *   jobId="123"
 *   showBeforeAfterToggle
 *   enableLightbox
 *   columns={3}
 * />
 * ```
 */

import { useState, useEffect } from 'react'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentViewer } from './DocumentViewer'
import type { PhotoGalleryProps, JobPhoto, PhotoCategory } from '@/lib/types/documents'
import { cn } from '@/lib/utils'

export function PhotoGallery({
  jobId,
  photos: initialPhotos,
  loading: initialLoading = false,
  error: initialError = null,
  onPhotoClick,
  onPhotoDelete,
  showBeforeAfterToggle = true,
  enableLightbox = true,
  columns = 3,
  className,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<JobPhoto[]>(initialPhotos || [])
  const [loading, setLoading] = useState(initialLoading)
  const [error, setError] = useState<Error | null>(initialError)
  const [selectedPhoto, setSelectedPhoto] = useState<JobPhoto | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<PhotoCategory | 'all'>('all')

  /**
   * Fetch photos if not provided
   */
  useEffect(() => {
    if (initialPhotos) {
      setPhotos(initialPhotos)
      return
    }

    const fetchPhotos = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/job-photos?jobId=${jobId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch photos')
        }

        const data = await response.json()
        setPhotos(data.photos || [])
      } catch (err) {
        console.error('Error fetching photos:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [jobId, initialPhotos])

  /**
   * Filter photos by category
   */
  const filteredPhotos =
    categoryFilter === 'all'
      ? photos
      : photos.filter((photo) => photo.category === categoryFilter)

  /**
   * Handle photo click
   */
  const handlePhotoClick = (photo: JobPhoto) => {
    onPhotoClick?.(photo)

    if (enableLightbox) {
      setSelectedPhoto(photo)
    }
  }

  /**
   * Handle photo delete
   */
  const handlePhotoDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/job-photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      // Remove from local state
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))

      onPhotoDelete?.(photoId)
    } catch (err) {
      console.error('Error deleting photo:', err)
    }
  }

  /**
   * Loading state
   */
  if (loading) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">Loading photos...</p>
      </Card>
    )
  }

  /**
   * Error state
   */
  if (error) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <p className="text-sm text-red-600">Error: {error.message}</p>
      </Card>
    )
  }

  /**
   * Empty state
   */
  if (photos.length === 0) {
    return (
      <Card className={cn('p-8 text-center', className)}>
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-4">No photos yet</p>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Category filter */}
      {showBeforeAfterToggle && (
        <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({photos.length})</TabsTrigger>
            <TabsTrigger value="before">
              Before ({photos.filter((p) => p.category === 'before').length})
            </TabsTrigger>
            <TabsTrigger value="after">
              After ({photos.filter((p) => p.category === 'after').length})
            </TabsTrigger>
            <TabsTrigger value="progress">
              Progress ({photos.filter((p) => p.category === 'progress').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Photo grid */}
      <div
        className={cn('grid gap-4', {
          'grid-cols-1': columns === 1,
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
        })}
      >
        {filteredPhotos.map((photo) => (
          <Card
            key={photo.id}
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handlePhotoClick(photo)}
          >
            <div className="aspect-square relative">
              <img
                src={photo.thumbnail_url || photo.photo_url}
                alt={photo.caption || 'Job photo'}
                className="w-full h-full object-cover"
              />

              {photo.category && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                  {photo.category}
                </div>
              )}
            </div>

            {photo.caption && (
              <div className="p-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty filtered state */}
      {filteredPhotos.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No {categoryFilter} photos
          </p>
        </Card>
      )}

      {/* Lightbox */}
      {enableLightbox && selectedPhoto && (
        <DocumentViewer
          document={selectedPhoto}
          open={!!selectedPhoto}
          onOpenChange={(open) => !open && setSelectedPhoto(null)}
          showDownload
          showDelete={!!onPhotoDelete}
          onDelete={handlePhotoDelete}
        />
      )}
    </div>
  )
}

export type { PhotoGalleryProps }
