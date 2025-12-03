'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Phone, MapPin, Briefcase, MessageSquare, Calendar, Edit } from 'lucide-react'
import { Contact, Job, Conversation } from '@/types'
import { useRouter } from 'next/navigation'
import { TagSelector } from '@/components/marketing/tag-selector'
import type { ContactTag } from '@/types/contact-tags'
import { usePermissions } from '@/lib/hooks/usePermissions'
import { EditContactDialog } from './edit-contact-dialog'

interface ContactDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactId: string | null
}

export function ContactDetailModal({ open, onOpenChange, contactId }: ContactDetailModalProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tags, setTags] = useState<ContactTag[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const router = useRouter()
  const { isOwner, isAdmin, isSales, isCSR, hasPermission, userRole } = usePermissions()

  const canEdit = isOwner || isAdmin || isSales || isCSR || hasPermission('edit_contacts')

  useEffect(() => {
    if (open && contactId) {
      fetchContactDetails()
    }
  }, [open, contactId])

  async function fetchContactDetails() {
    if (!contactId) return
    
    setLoading(true)
    try {
      // Fetch contact
      const contactResponse = await fetch(`/api/contacts/${contactId}`)
      if (contactResponse.ok) {
        const contactData = await contactResponse.json()
        setContact(contactData.contact)
      }

      // Fetch jobs for this contact (filter client-side since API doesn't support contactId filter yet)
      const jobsResponse = await fetch(`/api/jobs`)
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        const contactJobs = (jobsData.jobs || []).filter((job: Job) => job.contact_id === contactId)
        setJobs(contactJobs)
      }

      // Fetch conversations for this contact (filter client-side since API doesn't support contactId filter yet)
      const conversationsResponse = await fetch(`/api/conversations`)
      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json()
        const contactConversations = (conversationsData.conversations || []).filter(
          (conv: Conversation) => conv.contact_id === contactId
        )
        setConversations(contactConversations)
      }

      // Fetch tags for this contact
      if (contactId) {
        const tagsResponse = await fetch(`/api/contacts/${contactId}/tags`)
        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json()
          setTags(tagsData.tags?.map((t: { tag: ContactTag }) => t.tag) || [])
        }
      }
    } catch (error) {
      console.error('Error fetching contact details:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleViewJob(jobId: string) {
    onOpenChange(false)
    router.push(`/jobs?id=${jobId}`)
  }

  function handleViewConversation(conversationId: string) {
    onOpenChange(false)
    router.push(`/inbox?conversation=${conversationId}`)
  }

  if (!contact) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10" style={{ backgroundColor: '#EBF0FF' }}>
                <AvatarFallback className="text-[#4B79FF] font-semibold">
                  {contact.first_name?.[0]}{contact.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span>
                {contact.first_name} {contact.last_name}
              </span>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-neutral-500">Loading contact details...</div>
        ) : (
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">{contact.phone}</span>
                  </div>
                )}
                {contact.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">{contact.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Calendar className="w-4 h-4" />
                  <span>Added {new Date(contact.created_at).toLocaleDateString()}</span>
                </div>
                {contactId && (
                  <div className="pt-3 border-t">
                    <TagSelector
                      contactId={contactId}
                      assignedTags={tags}
                      onTagsChange={fetchContactDetails}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Job History ({jobs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-sm text-neutral-500">No jobs for this contact</p>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer"
                        onClick={() => handleViewJob(job.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{job.description || 'No description'}</span>
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor:
                                  job.status === 'completed'
                                    ? '#EAFCF1'
                                    : job.status === 'in_progress'
                                    ? '#EBF0FF'
                                    : '#FFF4E6',
                                color:
                                  job.status === 'completed'
                                    ? '#37C856'
                                    : job.status === 'in_progress'
                                    ? '#4B79FF'
                                    : '#FFA24D',
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderWidth: '1px',
                              }}
                            >
                              {job.status}
                            </Badge>
                          </div>
                          {job.scheduled_start && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Scheduled: {new Date(job.scheduled_start).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewJob(job.id)
                          }}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conversation History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Conversations ({conversations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conversations.length === 0 ? (
                  <p className="text-sm text-neutral-500">No conversations with this contact</p>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-neutral-50 cursor-pointer"
                        onClick={() => handleViewConversation(conversation.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {conversation.subject || 'No subject'}
                            </span>
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor:
                                  conversation.status === 'open'
                                    ? '#EBF0FF'
                                    : conversation.status === 'closed'
                                    ? '#EAFCF1'
                                    : '#FFF4E6',
                                color:
                                  conversation.status === 'open'
                                    ? '#4B79FF'
                                    : conversation.status === 'closed'
                                    ? '#37C856'
                                    : '#FFA24D',
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderWidth: '1px',
                              }}
                            >
                              {conversation.status}
                            </Badge>
                          </div>
                          {conversation.last_message_at && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Last message: {new Date(conversation.last_message_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewConversation(conversation.id)
                          }}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
      
      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        contact={contact}
        onSuccess={() => {
          fetchContactDetails()
        }}
      />
    </Dialog>
  )
}

