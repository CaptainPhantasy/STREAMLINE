'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete'
import { Contact } from '@/types'
import { toast } from '@/lib/toast'

interface EditContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: Contact | null
  onSuccess: () => void
}

export function EditContactDialog({ open, onOpenChange, contact, onSuccess }: EditContactDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
  })
  const [error, setError] = useState<string | null>(null)

  // Populate form when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        email: contact.email || '',
        phone: contact.phone || '',
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        address: contact.address || '',
      })
      setError(null)
    }
  }, [contact])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contact) return

    setLoading(true)
    setError(null)

    // Validate required fields
    if (!formData.email || !formData.firstName) {
      setError('Email and first name are required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone || undefined,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          address: formData.address || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Contact updated successfully')
        onOpenChange(false)
        onSuccess()
      } else {
        setError(data.error || 'Failed to update contact')
      }
    } catch (error) {
      console.error('Error updating contact:', error)
      setError('Failed to update contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!contact) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <PlacesAutocomplete
                id="edit-address"
                placeholder="123 Main St, City, State ZIP"
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setError(null)
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#56D470] hover:bg-[#37C856] text-white">
              {loading ? 'Updating...' : 'Update Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

