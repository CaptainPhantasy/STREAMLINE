'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus, Tag } from 'lucide-react'
import type { ContactTag } from '@/types/contact-tags'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'

interface TagSelectorProps {
  contactId: string
  assignedTags: ContactTag[]
  onTagsChange: () => void
}

export function TagSelector({ contactId, assignedTags, onTagsChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<ContactTag[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(
    new Set(assignedTags.map(t => t.id))
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAllTags()
  }, [])

  useEffect(() => {
    setSelectedTagIds(new Set(assignedTags.map(t => t.id)))
  }, [assignedTags])

  async function fetchAllTags() {
    try {
      const response = await fetch('/api/contact-tags')
      if (response.ok) {
        const data = await response.json()
        setAllTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  async function handleTagToggle(tagId: string, checked: boolean) {
    const newSelected = new Set(selectedTagIds)
    if (checked) {
      newSelected.add(tagId)
    } else {
      newSelected.delete(tagId)
    }
    setSelectedTagIds(newSelected)
  }

  async function handleSave() {
    setLoading(true)
    try {
      // Get tags to add and remove
      const currentTagIds = new Set(assignedTags.map(t => t.id))
      const tagsToAdd = Array.from(selectedTagIds).filter(id => !currentTagIds.has(id))
      const tagsToRemove = Array.from(currentTagIds).filter(id => !selectedTagIds.has(id))

      // Add new tags
      for (const tagId of tagsToAdd) {
        await fetch(`/api/contacts/${contactId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tagId }),
        })
      }

      // Remove tags
      for (const tagId of tagsToRemove) {
        await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
          method: 'DELETE',
        })
      }

      onTagsChange()
      setDialogOpen(false)
      toastSuccess('Tags updated successfully')
    } catch (error) {
      console.error('Error updating tags:', error)
      toastError('Failed to update tags', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      const response = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onTagsChange()
      }
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tags</label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Manage
        </Button>
      </div>

      {assignedTags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {assignedTags.map((tag) => (
            <Badge
              key={tag.id}
              className="flex items-center gap-1"
              style={{
                backgroundColor: tag.color ? `${tag.color}20` : '#EBF0FF',
                color: tag.color || '#4B79FF',
                borderColor: tag.color || '#4B79FF',
                borderWidth: '1px',
              }}
            >
              <Tag className="w-3 h-3" />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="ml-1 hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">No tags assigned</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Select tags to assign to this contact</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allTags.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">No tags available</p>
            ) : (
              allTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-neutral-50"
                >
                  <Checkbox
                    id={tag.id}
                    checked={selectedTagIds.has(tag.id)}
                    onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  />
                  <label
                    htmlFor={tag.id}
                    className="flex-1 flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || '#4B79FF' }}
                    />
                    <span className="text-sm">{tag.name}</span>
                  </label>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

