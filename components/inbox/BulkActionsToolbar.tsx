'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreHorizontal, UserPlus, Tag, Archive, Trash2, Download, Mail } from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsToolbarProps {
  selectedIds: string[]
  onBulkAction: (action: string, data?: Record<string, unknown>) => Promise<void>
  availableUsers?: Array<{ id: string; full_name: string | null }>
  availableTags?: Array<{ id: string; name: string }>
}

export function BulkActionsToolbar({
  selectedIds,
  onBulkAction,
  availableUsers = [],
  availableTags = [],
}: BulkActionsToolbarProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [processing, setProcessing] = useState(false)

  if (selectedIds.length === 0) {
    return null
  }

  async function handleAssign() {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setProcessing(true)
    try {
      await onBulkAction('assign', { user_id: selectedUserId })
      setAssignDialogOpen(false)
      setSelectedUserId('')
      toast.success(`Assigned ${selectedIds.length} conversation(s)`)
    } catch (error) {
      toast.error('Failed to assign conversations')
    } finally {
      setProcessing(false)
    }
  }

  async function handleAddTags() {
    if (selectedTagIds.length === 0) {
      toast.error('Please select at least one tag')
      return
    }

    setProcessing(true)
    try {
      await onBulkAction('add_tags', { tag_ids: selectedTagIds })
      setTagDialogOpen(false)
      setSelectedTagIds([])
      toast.success(`Added tags to ${selectedIds.length} conversation(s)`)
    } catch (error) {
      toast.error('Failed to add tags')
    } finally {
      setProcessing(false)
    }
  }

  async function handleChangeStatus() {
    if (!selectedStatus) {
      toast.error('Please select a status')
      return
    }

    setProcessing(true)
    try {
      await onBulkAction('change_status', { status: selectedStatus })
      setStatusDialogOpen(false)
      setSelectedStatus('')
      toast.success(`Updated status for ${selectedIds.length} conversation(s)`)
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setProcessing(false)
    }
  }

  async function handleArchive() {
    setProcessing(true)
    try {
      await onBulkAction('archive')
      toast.success(`Archived ${selectedIds.length} conversation(s)`)
    } catch (error) {
      toast.error('Failed to archive conversations')
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} conversation(s)?`)) {
      return
    }

    setProcessing(true)
    try {
      await onBulkAction('delete')
      toast.success(`Deleted ${selectedIds.length} conversation(s)`)
    } catch (error) {
      toast.error('Failed to delete conversations')
    } finally {
      setProcessing(false)
    }
  }

  async function handleExport() {
    setProcessing(true)
    try {
      await onBulkAction('export')
      toast.success('Export started')
    } catch (error) {
      toast.error('Failed to export')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-gray-50 border-b">
        <span className="text-sm font-medium">
          {selectedIds.length} conversation(s) selected
        </span>
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
            disabled={processing}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTagDialogOpen(true)}
            disabled={processing}
          >
            <Tag className="w-4 h-4 mr-2" />
            Add Tags
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusDialogOpen(true)}
            disabled={processing}
          >
            Change Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            disabled={processing}
          >
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={processing}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={processing}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>More Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Conversations</DialogTitle>
            <DialogDescription>
              Assign {selectedIds.length} conversation(s) to a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || 'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={processing || !selectedUserId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedIds.length} conversation(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag.id}`}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTagIds([...selectedTagIds, tag.id])
                        } else {
                          setSelectedTagIds(selectedTagIds.filter(id => id !== tag.id))
                        }
                      }}
                    />
                    <Label htmlFor={`tag-${tag.id}`} className="font-normal cursor-pointer">
                      {tag.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags} disabled={processing || selectedTagIds.length === 0}>
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>
              Change status for {selectedIds.length} conversation(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="snoozed">Snoozed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeStatus} disabled={processing || !selectedStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

