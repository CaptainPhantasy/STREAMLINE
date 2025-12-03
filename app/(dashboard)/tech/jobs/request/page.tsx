'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Calendar, Phone } from 'lucide-react'
import { toast } from '@/lib/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Contact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
}

export default function TechJobRequestPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    contactId: '',
    description: '',
    scheduledStart: '',
    scheduledEnd: '',
    needsOfficeCall: false,
    notes: '',
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    try {
      setLoading(true)
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.contactId || !formData.description) {
      toast.error('Validation Error', 'Contact and description are required')
      return
    }

    if (!formData.needsOfficeCall && !formData.scheduledStart) {
      toast.error('Validation Error', 'Please provide a scheduled time or mark as needing office call')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/jobs/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: formData.contactId,
          description: formData.description,
          scheduledStart: formData.scheduledStart || null,
          scheduledEnd: formData.scheduledEnd || null,
          needsOfficeCall: formData.needsOfficeCall,
          notes: formData.notes || null,
        }),
      })

      if (response.ok) {
        toast.success('Job request submitted', 'Your request has been sent to dispatch for approval')
        router.push('/tech/dashboard')
      } else {
        const errorData = await response.json()
        toast.error('Failed to submit request', errorData.error || 'Unknown error')
      }
    } catch (error) {
      console.error('Error submitting job request:', error)
      toast.error('Failed to submit request', 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedContact = contacts.find((c) => c.id === formData.contactId)

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/tech/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Request New Job</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Submit a job request for dispatch approval
            </p>
          </div>
        </div>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle>Job Request Details</CardTitle>
            <CardDescription>
              Fill out the details below. Your request will be reviewed by dispatch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contactId">Customer *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.contactId}
                    onValueChange={(value) => setFormData({ ...formData, contactId: value })}
                    required
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name || ''} {contact.last_name || ''} {contact.phone ? `(${contact.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setContactDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {selectedContact && (
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {selectedContact.email && <div>Email: {selectedContact.email}</div>}
                    {selectedContact.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {selectedContact.phone}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the work needed..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="needsOfficeCall"
                    checked={formData.needsOfficeCall}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        needsOfficeCall: e.target.checked,
                        scheduledStart: e.target.checked ? '' : formData.scheduledStart,
                        scheduledEnd: e.target.checked ? '' : formData.scheduledEnd,
                      })
                    }}
                    className="rounded"
                  />
                  <Label htmlFor="needsOfficeCall" className="cursor-pointer">
                    Needs office to call customer
                  </Label>
                </div>

                {!formData.needsOfficeCall && (
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
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/tech/dashboard')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#56D470] hover:bg-[#37C856] text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Contact Creation Dialog - Simplified */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Create a new contact to use for this job request
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              Please use the main contacts page to add new contacts, then return here to select them.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setContactDialogOpen(false)
                router.push('/contacts')
              }}
              className="bg-[#56D470] hover:bg-[#37C856] text-white"
            >
              Go to Contacts
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

