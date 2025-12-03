'use client'

import { Button } from '@/components/ui/button'
import { Briefcase, Calendar, UserPlus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { AddContactDialog } from '@/components/contacts/add-contact-dialog'
import { toast } from '@/lib/toast'

interface EmailQuickActionsProps {
  conversationId: string
  contactId?: string
  contactEmail?: string
  contactName?: string
  emailBody?: string
  className?: string
}

export function EmailQuickActions({
  conversationId,
  contactId,
  contactEmail,
  contactName,
  emailBody,
  className,
}: EmailQuickActionsProps) {
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [extractingActions, setExtractingActions] = useState(false)

  async function handleExtractActions() {
    if (!emailBody) {
      toast.error('No email content to analyze')
      return
    }

    setExtractingActions(true)
    try {
      const response = await fetch('/api/email/extract-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          emailBody,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Extracted ${data.actionItems?.length || 0} action items`)
        
        // If action items include a meeting, offer to add to calendar
        const meetings = data.actionItems?.filter((item: any) => item.type === 'meeting')
        if (meetings && meetings.length > 0) {
          // Could trigger calendar integration here
        }
      } else {
        toast.error('Failed to extract action items')
      }
    } catch (error) {
      console.error('Error extracting actions:', error)
      toast.error('Failed to extract action items')
    } finally {
      setExtractingActions(false)
    }
  }

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setCreateJobOpen(true)}
        className="border-theme-accent-primary hover:bg-theme-secondary"
      >
        <Briefcase className="w-4 h-4 mr-2" />
        Create Job
      </Button>

      {!contactId && contactEmail && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAddContactOpen(true)}
          className="border-theme-accent-secondary hover:bg-theme-secondary"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      )}

      {emailBody && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleExtractActions}
          disabled={extractingActions}
          className="border-theme-accent-primary hover:bg-theme-secondary"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {extractingActions ? 'Extracting...' : 'Extract Actions'}
        </Button>
      )}

      {createJobOpen && (
        <CreateJobDialog
          open={createJobOpen}
          onOpenChange={setCreateJobOpen}
          defaultContactId={contactId}
          defaultContactName={contactName}
        />
      )}

      {addContactOpen && (
        <AddContactDialog
          open={addContactOpen}
          onOpenChange={setAddContactOpen}
          defaultEmail={contactEmail}
          defaultName={contactName}
        />
      )}
    </div>
  )
}

