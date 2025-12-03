'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { User, Mail, Briefcase, FileText, Edit, Trash2, Copy, History } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ContactContextMenuProps {
  contactId: string
  children: React.ReactNode
  onSendEmail?: () => void
  onCreateJob?: () => void
  onViewHistory?: () => void
  onAddNote?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ContactContextMenu({
  contactId,
  children,
  onSendEmail,
  onCreateJob,
  onViewHistory,
  onAddNote,
  onEdit,
  onDelete,
}: ContactContextMenuProps) {
  const router = useRouter()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onViewHistory && (
          <ContextMenuItem onClick={onViewHistory}>
            <History className="w-4 h-4 mr-2" />
            View History
          </ContextMenuItem>
        )}
        {onEdit && (
          <ContextMenuItem onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Contact
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onSendEmail && (
          <ContextMenuItem onClick={onSendEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </ContextMenuItem>
        )}
        {onCreateJob && (
          <ContextMenuItem onClick={onCreateJob}>
            <Briefcase className="w-4 h-4 mr-2" />
            Create Job
          </ContextMenuItem>
        )}
        {onAddNote && (
          <ContextMenuItem onClick={onAddNote}>
            <FileText className="w-4 h-4 mr-2" />
            Add Note
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            navigator.clipboard.writeText(contactId)
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Contact ID
        </ContextMenuItem>
        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onDelete}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Contact
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}

