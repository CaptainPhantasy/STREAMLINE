"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Tag, 
  FileText, 
  Plus,
  ExternalLink
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Contact, Job, ContactTag } from "@/types"
import { ContactDetailModal } from "@/components/contacts/contact-detail-modal"
import { toast, error as toastError, success as toastSuccess } from "@/lib/toast"

interface ConversationSidebarProps {
  conversationId: string | null
}

export function ConversationSidebar({ conversationId }: ConversationSidebarProps) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [tags, setTags] = useState<ContactTag[]>([])
  const [notes, setNotes] = useState<Array<{ id: string; content: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [contactDetailOpen, setContactDetailOpen] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!conversationId) {
      setContact(null)
      setJobs([])
      setTags([])
      setNotes([])
      setLoading(false)
      return
    }

    fetchConversationData()
  }, [conversationId])

  async function fetchConversationData() {
    if (!conversationId) return

    setLoading(true)
    try {
      // Fetch conversation with contact
      const { data: convData } = await supabase
        .from('conversations')
        .select('*, contact:contacts(*)')
        .eq('id', conversationId)
        .single()

      if (convData?.contact) {
        const contactData = convData.contact as Contact
        setContact(contactData)

        // Fetch related jobs
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('*')
          .eq('contact_id', contactData.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (jobsData) {
          setJobs(jobsData as Job[])
        }

        // Fetch contact tags
        const { data: tagsData } = await supabase
          .from('contact_tags')
          .select('*, tag:contact_tag_definitions(*)')
          .eq('contact_id', contactData.id)

        if (tagsData) {
          setTags(tagsData.map((t: any) => t.tag).filter(Boolean) as ContactTag[])
        }

        // Fetch conversation notes
        const notesResponse = await fetch(`/api/conversations/${conversationId}/notes`)
        if (notesResponse.ok) {
          const notesData = await notesResponse.json()
          setNotes(notesData.notes || [])
        }
      }
    } catch (error) {
      console.error('Error fetching conversation data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!conversationId) {
    return (
      <div className="hidden xl:block w-80 border-l bg-white p-4 flex-shrink-0">
        <div className="text-sm font-semibold text-neutral-500 mb-4">CONTACT DETAILS</div>
        <div className="p-4 border border-dashed rounded text-center text-neutral-400 text-sm">
          Select a conversation to view details
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="hidden xl:block w-80 flex-shrink-0">
        <div className="p-3">
          <div className="text-sm font-semibold text-neutral-500 mb-4">CONTACT DETAILS</div>
          <div className="p-4 text-center text-neutral-400 text-sm">Loading...</div>
        </div>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="hidden xl:block w-80 flex-shrink-0">
        <div className="p-3">
          <div className="text-sm font-semibold text-neutral-500 mb-4">CONTACT DETAILS</div>
          <div className="p-4 border border-dashed rounded text-center text-neutral-400 text-sm">
            No contact information available
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-full flex-shrink-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-neutral-500">CONTACT DETAILS</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setContactDetailOpen(true)}
                  className="h-6 text-xs px-2"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Full
                </Button>
              </div>
              
              {/* Contact Info */}
              <Card className="py-2">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-gradient-to-br from-[#EBF0FF] to-[#C8D7FF] text-[#3366FF] text-xs font-semibold">
                        {contact.first_name?.[0] || contact.email?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">
                        {contact.first_name} {contact.last_name}
                      </CardTitle>
                      {contact.email && (
                        <CardDescription className="text-xs truncate">{contact.email}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs px-4 pb-3">
                  {contact.phone && (
                    <div className="flex items-center gap-1.5 text-neutral-600">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs">{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-start gap-1.5 text-neutral-600">
                      <MapPin className="w-3 h-3 text-neutral-400 mt-0.5" />
                      <span className="text-xs">{contact.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Separator className="my-2" />

            {/* Tags */}
            <div>
              <div className="text-xs font-semibold text-neutral-500 mb-1.5">TAGS</div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: tag.color ? `${tag.color}20` : '#EBF0FF',
                        color: tag.color || '#3366FF',
                        borderColor: tag.color || '#3366FF',
                        borderWidth: '1px',
                      }}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">No tags</p>
              )}
            </div>

            <Separator className="my-2" />

            {/* Related Jobs */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-semibold text-neutral-500">RELATED JOBS</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/jobs?contactId=${contact.id}`)}
                  className="h-5 text-xs px-2"
                >
                  View All
                </Button>
              </div>
              {jobs.length > 0 ? (
                <div className="space-y-1.5">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="cursor-pointer hover:bg-neutral-50 transition-colors py-1"
                      onClick={() => router.push(`/jobs?id=${job.id}`)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-neutral-800 truncate">
                              {job.description || 'Job'}
                            </div>
                            <div className="text-xs text-neutral-500 mt-0.5">
                              {job.status?.replace('_', ' ') || 'N/A'}
                            </div>
                          </div>
                          <Briefcase className="w-3 h-3 text-neutral-400 ml-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">No related jobs</p>
              )}
            </div>

            <Separator className="my-2" />

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-xs font-semibold text-neutral-500">NOTES</div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs px-2"
                  onClick={() => {
                    const content = prompt('Enter note:')
                    if (content && content.trim()) {
                      fetch(`/api/conversations/${conversationId}/notes`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ content }),
                      })
                        .then((res) => res.json())
                        .then(() => {
                          fetchConversationData()
                        })
                        .catch((err) => {
                          console.error('Error creating note:', err)
                          toastError('Failed to create note')
                        })
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              {notes.length > 0 ? (
                <div className="space-y-1.5">
                  {notes.map((note) => (
                    <Card key={note.id} className="py-1">
                      <CardContent className="p-2">
                        <p className="text-xs text-neutral-600">{note.content}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(note.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-400">No notes yet</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Contact Detail Modal */}
      {contact && (
        <ContactDetailModal
          open={contactDetailOpen}
          onOpenChange={setContactDetailOpen}
          contactId={contact.id}
        />
      )}
    </>
  )
}

