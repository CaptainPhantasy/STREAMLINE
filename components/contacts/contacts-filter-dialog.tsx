"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { X, Calendar } from "lucide-react"
import type { ContactTag } from "@/types/contact-tags"

export interface ContactFilters {
  tags: string[]
  status: string[]
  dateRange: {
    start: string
    end: string
  }
  search: string
}

interface ContactsFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: ContactFilters
  onFiltersChange: (filters: ContactFilters) => void
}

export function ContactsFilterDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: ContactsFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<ContactFilters>(filters)
  const [availableTags, setAvailableTags] = useState<ContactTag[]>([])

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters, open])

  useEffect(() => {
    if (open) {
      fetchTags()
    }
  }, [open])

  async function fetchTags() {
    try {
      const response = await fetch('/api/contact-tags')
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data.tags || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  function handleTagToggle(tagId: string) {
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }))
  }

  function handleStatusToggle(status: string) {
    setLocalFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }))
  }

  function handleApply() {
    onFiltersChange(localFilters)
    onOpenChange(false)
  }

  function handleReset() {
    const resetFilters: ContactFilters = {
      tags: [],
      status: [],
      dateRange: { start: '', end: '' },
      search: '',
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  function handleClearTag(tagId: string) {
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((id) => id !== tagId),
    }))
  }

  function handleClearStatus(status: string) {
    setLocalFilters((prev) => ({
      ...prev,
      status: prev.status.filter((s) => s !== status),
    }))
  }

  const activeFilterCount =
    localFilters.tags.length +
    localFilters.status.length +
    (localFilters.dateRange.start ? 1 : 0) +
    (localFilters.dateRange.end ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Filter Contacts</DialogTitle>
          <DialogDescription>
            Filter contacts by tags, status, and date range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tags Filter */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Tags</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableTags.length === 0 ? (
                <p className="text-sm text-neutral-400">No tags available</p>
              ) : (
                availableTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={localFilters.tags.includes(tag.id)}
                      onCheckedChange={() => handleTagToggle(tag.id)}
                    />
                    <Label
                      htmlFor={`tag-${tag.id}`}
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <Badge
                        style={{
                          backgroundColor: tag.color ? `${tag.color}20` : '#EBF0FF',
                          color: tag.color || '#3366FF',
                          borderColor: tag.color || '#3366FF',
                          borderWidth: '1px',
                        }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    </Label>
                  </div>
                ))
              )}
            </div>
            {localFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {localFilters.tags.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId)
                  if (!tag) return null
                  return (
                    <Badge
                      key={tagId}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {tag.name}
                      <button
                        onClick={() => handleClearTag(tagId)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Status</Label>
            <div className="space-y-2">
              {['active', 'inactive', 'lead', 'customer'].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={localFilters.status.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {status}
                  </Label>
                </div>
              ))}
            </div>
            {localFilters.status.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {localFilters.status.map((status) => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="text-xs flex items-center gap-1 capitalize"
                  >
                    {status}
                    <button
                      onClick={() => handleClearStatus(status)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div>
            <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date-start" className="text-xs text-neutral-500">
                  Start Date
                </Label>
                <Input
                  id="date-start"
                  type="date"
                  value={localFilters.dateRange.start}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="date-end" className="text-xs text-neutral-500">
                  End Date
                </Label>
                <Input
                  id="date-end"
                  type="date"
                  value={localFilters.dateRange.end}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            {(localFilters.dateRange.start || localFilters.dateRange.end) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    dateRange: { start: '', end: '' },
                  }))
                }
                className="mt-2 text-xs"
              >
                Clear dates
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-neutral-500">
            {activeFilterCount > 0 && `${activeFilterCount} filter(s) active`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

