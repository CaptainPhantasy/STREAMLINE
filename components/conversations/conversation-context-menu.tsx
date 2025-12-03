'use client'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { MessageSquare, Sparkles, Briefcase, X, Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ConversationContextMenuProps {
  conversationId: string
  children: React.ReactNode
  onGenerateDraft?: () => void
  onCreateJob?: () => void
  onMarkClosed?: () => void
  onMarkOpen?: () => void
}

export function ConversationContextMenu({
  conversationId,
  children,
  onGenerateDraft,
  onCreateJob,
  onMarkClosed,
  onMarkOpen,
}: ConversationContextMenuProps) {
  const router = useRouter()

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onGenerateDraft && (
          <ContextMenuItem onClick={onGenerateDraft}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Draft
          </ContextMenuItem>
        )}
        {onCreateJob && (
          <ContextMenuItem onClick={onCreateJob}>
            <Briefcase className="w-4 h-4 mr-2" />
            Create Job
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onMarkOpen && (
          <ContextMenuItem onClick={onMarkOpen}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Mark as Open
          </ContextMenuItem>
        )}
        {onMarkClosed && (
          <ContextMenuItem onClick={onMarkClosed}>
            <X className="w-4 h-4 mr-2" />
            Mark as Closed
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            navigator.clipboard.writeText(conversationId)
          }}
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Conversation ID
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

