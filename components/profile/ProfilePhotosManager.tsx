'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Upload, X, GripVertical, Star } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfilePhoto } from '@/types/user-profiles'

interface ProfilePhotosManagerProps {
  userId: string
  photos: UserProfilePhoto[]
  onPhotosChange?: (photos: UserProfilePhoto[]) => void
}

export function ProfilePhotosManager({
  userId,
  photos: initialPhotos,
  onPhotosChange,
}: ProfilePhotosManagerProps) {
  const [photos, setPhotos] = useState<UserProfilePhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    setPhotos(initialPhotos)
  }, [initialPhotos])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    // Check photo count
    if (photos.length >= 6) {
      toast.error('Maximum 6 profile photos allowed')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('display_order', photos.length.toString())

      const response = await fetch(`/api/users/${userId}/profile-photos`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to upload photo' }))
        const errorMessage = data.error || 'Failed to upload photo'
        const errorDetails = data.details ? ` (${data.details})` : ''
        throw new Error(`${errorMessage}${errorDetails}`)
      }

      const data = await response.json()
      if (!data.photo) {
        throw new Error('Invalid response from server')
      }

      const { photo } = data
      const newPhotos = [...photos, photo].sort((a, b) => a.display_order - b.display_order)
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
      toast.success('Photo uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading photo:', error)
      const errorMessage = error.message || 'Failed to upload photo'
      toast.error(errorMessage)
      
      // Log additional details for debugging
      if (error.message?.includes('Bucket not found')) {
        console.error('Storage bucket issue. Please ensure the storage bucket exists in Supabase.')
      }
    } finally {
      setUploading(false)
      // Reset input
      e.target.value = ''
    }
  }

  async function handleDelete(photoId: string) {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const response = await fetch(
        `/api/users/${userId}/profile-photos/${photoId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete photo')
      }

      const newPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
      toast.success('Photo deleted successfully')
    } catch (error: any) {
      console.error('Error deleting photo:', error)
      toast.error(error.message || 'Failed to delete photo')
    }
  }

  async function handleSetPrimary(photoId: string) {
    try {
      const response = await fetch(
        `/api/users/${userId}/profile-photos/${photoId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_primary: true }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set primary photo')
      }

      const { photo } = await response.json()
      const newPhotos = photos.map(p =>
        p.id === photoId
          ? { ...p, is_primary: true }
          : { ...p, is_primary: false }
      )
      setPhotos(newPhotos)
      onPhotosChange?.(newPhotos)
      toast.success('Primary photo updated')
    } catch (error: any) {
      console.error('Error setting primary photo:', error)
      toast.error(error.message || 'Failed to set primary photo')
    }
  }

  async function handleReorder(newOrder: UserProfilePhoto[]) {
    setReordering(true)

    try {
      const photoIds = newOrder.map(p => p.id)

      const response = await fetch(
        `/api/users/${userId}/profile-photos/reorder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_ids: photoIds }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to reorder photos')
      }

      const { photos: updatedPhotos } = await response.json()
      setPhotos(updatedPhotos)
      onPhotosChange?.(updatedPhotos)
    } catch (error: any) {
      console.error('Error reordering photos:', error)
      toast.error(error.message || 'Failed to reorder photos')
    } finally {
      setReordering(false)
      setDraggedIndex(null)
    }
  }

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPhotos = [...photos]
    const draggedPhoto = newPhotos[draggedIndex]
    newPhotos.splice(draggedIndex, 1)
    newPhotos.splice(index, 0, draggedPhoto)
    setPhotos(newPhotos)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    if (draggedIndex !== null) {
      handleReorder(photos)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photos</CardTitle>
        <CardDescription>
          Upload up to 6 photos. Drag to reorder. Click star to set as primary.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative group"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 relative">
                <img
                  src={photo.photo_url}
                  alt={`Profile photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {photo.is_primary && (
                  <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-gray-100 transition-opacity"
                    title="Set as primary"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        photo.is_primary
                          ? 'fill-yellow-400 text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full hover:bg-red-100 transition-opacity"
                    title="Delete photo"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  <GripVertical className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}

          {/* Upload Button */}
          {photos.length < 6 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload</p>
                </div>
              )}
            </label>
          )}
        </div>

        {photos.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No photos uploaded yet. Click above to upload your first photo.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

