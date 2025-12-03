'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Contact } from '@/types'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  prefillContactId?: string
  prefillConversationId?: string
}

export function CreateJobDialog({ open, onOpenChange, onSuccess, prefillContactId, prefillConversationId }: CreateJobDialogProps) {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [formData, setFormData] = useState({
    contactId: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    status: 'lead',
  })

  useEffect(() => {
    if (open) {
      fetchContacts()
      // Pre-fill contact if provided
      if (prefillContactId) {
        setFormData(prev => ({ ...prev, contactId: prefillContactId }))
      }
    } else {
      // Reset form when closed
      setFormData({
        contactId: prefillContactId || '',
        description: '',
        scheduledStart: '',
        scheduledEnd: '',
        status: 'lead',
      })
    }
  }, [open, prefillContactId])

  async function fetchContacts() {
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      if (response.ok) {
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // First, get or create conversation for this contact
      const contact = contacts.find(c => c.id === formData.contactId)
      if (!contact) {
        toastError('Please select a contact')
        setLoading(false)
        return
      }

      // Create job
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: formData.contactId,
          conversationId: prefillConversationId || null,
          description: formData.description,
          scheduledStart: formData.scheduledStart || null,
          scheduledEnd: formData.scheduledEnd || null,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toastSuccess('Job created successfully!')
        setFormData({
          contactId: '',
          description: '',
          scheduledStart: '',
          scheduledEnd: '',
          status: 'lead',
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toastError('Failed to create job', data.error || 'Unknown error occurred')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      toastError('Failed to create job', 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
          <DialogDescription>
            Create a new work order for a customer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact">Contact *</Label>
              <Select
                value={formData.contactId}
                onValueChange={(value) => setFormData({ ...formData, contactId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} - {contact.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the work to be done..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledStart">Scheduled Start</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledEnd">Scheduled End</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="en_route">En Route</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#4B79FF] hover:bg-[#3366FF]">
              {loading ? 'Creating...' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

