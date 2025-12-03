'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FollowUp {
  id: string
  contact_id: string
  interaction_type: string
  subject: string | null
  notes: string | null
  next_follow_up: string
  outcome: string | null
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
  }
}

interface FollowUpManagerProps {
  contactId?: string
  onFollowUpScheduled?: () => void
}

export function FollowUpManager({ contactId, onFollowUpScheduled }: FollowUpManagerProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    contact_id: contactId || '',
    interaction_type: 'call',
    subject: '',
    notes: '',
    next_follow_up: '',
  })
  const [overdueOnly, setOverdueOnly] = useState(false)

  useEffect(() => {
    fetchFollowUps()
  }, [contactId, overdueOnly])

  async function fetchFollowUps() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (contactId) params.append('contact_id', contactId)
      if (overdueOnly) params.append('overdue_only', 'true')

      const response = await fetch(`/api/sales/follow-ups?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups')
      }

      const data = await response.json()
      setFollowUps(data.follow_ups || [])
    } catch (error: any) {
      console.error('Error fetching follow-ups:', error)
      toast.error('Failed to load follow-ups')
    } finally {
      setLoading(false)
    }
  }

  async function handleSchedule() {
    if (!formData.contact_id || !formData.next_follow_up) {
      toast.error('Contact and follow-up date are required')
      return
    }

    try {
      const response = await fetch('/api/sales/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to schedule follow-up')
      }

      toast.success('Follow-up scheduled')
      setShowForm(false)
      setFormData({
        contact_id: contactId || '',
        interaction_type: 'call',
        subject: '',
        notes: '',
        next_follow_up: '',
      })
      fetchFollowUps()
      onFollowUpScheduled?.()
    } catch (error: any) {
      console.error('Error scheduling follow-up:', error)
      toast.error(error.message || 'Failed to schedule follow-up')
    }
  }

  function isOverdue(followUpDate: string): boolean {
    return new Date(followUpDate) < new Date()
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return 'Today'
    } else if (diffDays === 1) {
      return 'Tomorrow'
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Follow-Ups
            </CardTitle>
            <CardDescription>
              {contactId ? 'Follow-ups for this contact' : 'All scheduled follow-ups'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setOverdueOnly(!overdueOnly)}
              variant={overdueOnly ? 'default' : 'outline'}
              size="sm"
            >
              {overdueOnly ? 'Show All' : 'Overdue Only'}
            </Button>
            <Button onClick={() => setShowForm(!showForm)} size="sm">
              Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 border rounded-lg space-y-3 bg-gray-50">
            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <select
                value={formData.interaction_type}
                onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="demo">Demo</option>
                <option value="proposal">Proposal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Follow-up subject..."
              />
            </div>
            <div className="space-y-2">
              <Label>Follow-Up Date & Time *</Label>
              <Input
                type="datetime-local"
                value={formData.next_follow_up}
                onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Follow-up notes..."
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSchedule} size="sm" disabled={!formData.next_follow_up}>
                Schedule
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {followUps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No follow-ups scheduled</p>
          ) : (
            followUps.map((followUp) => {
              const overdue = isOverdue(followUp.next_follow_up)
              return (
                <div
                  key={followUp.id}
                  className={cn(
                    'p-3 border rounded-lg',
                    overdue && 'border-red-300 bg-red-50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {overdue ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        <p className="font-medium">
                          {followUp.contact
                            ? `${followUp.contact.first_name} ${followUp.contact.last_name}`
                            : 'Contact'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {followUp.interaction_type}
                        </Badge>
                      </div>
                      {followUp.subject && (
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {followUp.subject}
                        </p>
                      )}
                      {followUp.notes && (
                        <p className="text-sm text-gray-600 mb-2">{followUp.notes}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className={cn(overdue && 'font-semibold text-red-600')}>
                            {formatDate(followUp.next_follow_up)}
                          </span>
                        </div>
                        {followUp.contact?.email && (
                          <span>{followUp.contact.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

