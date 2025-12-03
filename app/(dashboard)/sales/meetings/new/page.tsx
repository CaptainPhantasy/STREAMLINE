'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, MapPin, User, Clock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Contact {
  id: string
  name: string
  email: string
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    contactId: '',
    location: '',
    scheduledAt: '',
    meetingType: 'in_person',
    notes: ''
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts')
      if (res.ok) {
        const data = await res.json()
        setContacts(data.contacts || [])
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/sales/meetings/${data.meeting.id}`)
      } else {
        alert('Failed to create meeting')
      }
    } catch (error) {
      console.error('Failed to create meeting:', error)
      alert('Failed to create meeting')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/sales/meetings">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Meetings
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-theme-primary">Schedule New Meeting</h1>
            <p className="text-xs text-theme-secondary">
              Create a new meeting with a contact
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-theme-border">
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>Fill in the information below to schedule a meeting</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Meeting Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Product Demo, Follow-up Call"
                    className="border-theme-border bg-theme-input text-theme-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-4 py-2 border border-theme-border rounded-md bg-theme-input text-theme-primary"
                    required
                  >
                    <option value="">Select a contact</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name} ({contact.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="border-theme-border bg-theme-input text-theme-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Office, Zoom, Customer Site"
                    className="border-theme-border bg-theme-input text-theme-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                    className="w-full px-4 py-2 border border-theme-border rounded-md bg-theme-input text-theme-primary"
                  >
                    <option value="in_person">In Person</option>
                    <option value="phone">Phone Call</option>
                    <option value="video">Video Call</option>
                    <option value="demo">Product Demo</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-primary mb-2">
                    Notes (Optional)
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes or agenda items..."
                    className="min-h-[120px] border-theme-border bg-theme-input text-theme-primary"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-theme-accent-primary hover:bg-theme-accent-primary/90 text-black h-12 text-base"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Creating...' : 'Create Meeting'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/sales/meetings')}
                    className="border-theme-border"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
