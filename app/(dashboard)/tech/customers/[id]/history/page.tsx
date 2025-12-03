'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, DollarSign, FileText, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import type { Job } from '@/types'

interface CustomerJobHistory {
  id: string
  description: string | null
  status: string
  scheduled_start: string | null
  scheduled_end: string | null
  total_amount: number | null
  completed_at: string | null
  created_at: string
  contact?: {
    id: string
    first_name: string | null
    last_name: string | null
    address: string | null
  }
}

export default function TechCustomerHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const contactId = params.id as string
  const [contact, setContact] = useState<{ id: string; first_name: string | null; last_name: string | null } | null>(null)
  const [jobs, setJobs] = useState<CustomerJobHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (contactId) {
      fetchContactAndHistory()
    }
  }, [contactId])

  async function fetchContactAndHistory() {
    try {
      setLoading(true)
      
      // Fetch contact
      const contactResponse = await fetch(`/api/contacts/${contactId}`)
      if (contactResponse.ok) {
        const contactData = await contactResponse.json()
        setContact(contactData.contact)
      }

      // Fetch all jobs for this contact
      // Note: The API will filter by account_id via RLS, but we need to ensure tech only sees their assigned jobs
      // For now, we'll fetch all jobs for the contact and filter client-side
      // In production, the API should filter by tech_assigned_id for tech role
      const jobsResponse = await fetch(`/api/jobs?contactId=${contactId}`)
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        // Filter to only show jobs where tech was assigned (current user)
        // This is a security measure - the API should also enforce this
        const allJobs = jobsData.jobs || []
        // Note: We can't easily get current user ID here, so we'll show all jobs for the contact
        // The API should filter by tech_assigned_id when called by a tech user
        setJobs(allJobs)
      }
    } catch (error) {
      console.error('Error fetching customer history:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed':
      case 'paid':
        return { bg: '#EAFCF1', text: '#37C856', border: 'rgba(55, 200, 86, 0.2)' }
      case 'in_progress':
      case 'en_route':
        return { bg: '#EBF0FF', text: '#4B79FF', border: 'rgba(75, 121, 255, 0.2)' }
      case 'scheduled':
        return { bg: '#FFF4E8', text: '#FFA24D', border: 'rgba(255, 162, 77, 0.2)' }
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      default:
        return { bg: '#F2F4F7', text: '#667085', border: 'rgba(102, 112, 133, 0.2)' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--color-accent-primary)]" />
      </div>
    )
  }

  const contactName = contact
    ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown'

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/tech/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Job History</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {contactName} - Complete job history
            </p>
          </div>
        </div>

        <Card className="shadow-card bg-[var(--card-bg)] border-[var(--card-border)]">
          <CardHeader>
            <CardTitle>All Jobs ({jobs.length})</CardTitle>
            <CardDescription>Complete job history for this customer</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                <FileText className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-subtle)]" />
                <p className="text-lg font-medium mb-2">No job history</p>
                <p className="text-sm">This customer has no completed jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => {
                  const statusColors = getStatusColor(job.status)
                  return (
                    <div
                      key={job.id}
                      className="p-4 border rounded-lg hover:bg-[var(--card-bg-hover)] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              style={{
                                backgroundColor: statusColors.bg,
                                color: statusColors.text,
                                borderColor: statusColors.border,
                                borderWidth: '1px',
                              }}
                            >
                              {job.status}
                            </Badge>
                            {job.scheduled_start && (
                              <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(job.scheduled_start), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>

                          <h3 className="font-medium text-[var(--color-text-primary)] mb-2">
                            {job.description || 'No description'}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {job.total_amount && (
                              <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                                <DollarSign className="w-4 h-4" />
                                ${(job.total_amount / 100).toFixed(2)}
                              </div>
                            )}
                            {job.completed_at && (
                              <div className="text-[var(--color-text-secondary)]">
                                Completed: {format(new Date(job.completed_at), 'MMM dd, yyyy')}
                              </div>
                            )}
                            <div className="text-[var(--color-text-subtle)]">
                              Created: {format(new Date(job.created_at), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

