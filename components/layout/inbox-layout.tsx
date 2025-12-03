'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ConversationList } from '@/components/dashboard/conversation-list'
import { MessageThread } from '@/components/dashboard/message-thread'
import { ConversationSidebar } from '@/components/inbox/conversation-sidebar'
import { getQueryParamWithFallback } from '@/lib/query-params'
import { useSearchParams } from 'next/navigation'

interface InboxLayoutProps {
  children?: ReactNode
}

export function InboxLayout({ children }: InboxLayoutProps) {
  const searchParams = useSearchParams()
  const conversationId = getQueryParamWithFallback(searchParams, 'conversation', ['id'])

  const sidebarClasses = conversationId ? 'hidden md:flex' : 'flex'
  const mainChatClasses = conversationId ? 'flex' : 'hidden md:flex'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-theme-border px-4 py-3 bg-theme-surface">
        <div>
          <h1 className="text-lg font-semibold text-theme-primary">Inbox</h1>
          <p className="text-xs text-theme-secondary">
            Conversations from jobs, website, phone, and the AI agent.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-theme-border text-theme-primary hover:bg-theme-surface">
            Today
          </Button>
          <Button variant="ghost" size="sm" className="text-theme-secondary hover:bg-theme-surface hover:text-theme-primary">
            Last 7 days
          </Button>
          <Button variant="ghost" size="sm" className="text-theme-secondary hover:bg-theme-surface hover:text-theme-primary">
            All
          </Button>
        </div>
      </header>

      {/* Main Content Area - Optimized for viewport: no wasted space, no cropping */}
      <div className="flex flex-1 overflow-hidden p-4 gap-3">
        {/* List Panel - 1/4 of available space */}
        <section className={`${sidebarClasses} flex-[1] min-w-0 flex flex-col flex-shrink-0`}>
          <div className="h-full shadow-card bg-[var(--card-bg)] border-[var(--card-border)] rounded-lg overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
            <ConversationList />
          </div>
        </section>

        {/* Main Conversation Area - 2/4 of available space */}
        <section className={`${mainChatClasses} flex-[2] min-w-0 flex flex-shrink-0`}>
          <div className="h-full w-full shadow-card bg-[var(--card-bg)] border-[var(--card-border)] rounded-lg overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
            {conversationId ? (
              <MessageThread conversationId={conversationId} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-theme-secondary">
                <div className="text-center">
                  <p className="text-lg font-medium text-theme-primary mb-2">No conversation selected</p>
                  <p className="text-sm text-theme-secondary">Select a conversation from the sidebar to view messages</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Inspector Panel - 1/4 of available space, same as inbox */}
        <section className="flex-[1] min-w-0 flex-shrink-0">
          <div className="h-full shadow-card bg-[var(--card-bg)] border-[var(--card-border)] rounded-lg overflow-hidden transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-px">
            <ConversationSidebar conversationId={conversationId} />
          </div>
        </section>
      </div>
    </div>
  )
}
