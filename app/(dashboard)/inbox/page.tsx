'use client'

import { Suspense } from 'react'
import { InboxLayout } from '@/components/layout/inbox-layout'
import { ErrorBoundary } from '@/components/error-boundary'

function InboxPageContent() {
  return (
    <ErrorBoundary context="inbox">
      <InboxLayout />
    </ErrorBoundary>
  )
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <header className="flex items-center justify-between border-b border-ops-border px-4 py-3 bg-ops-surface">
          <div>
            <div className="h-5 bg-ops-surfaceSoft rounded animate-pulse w-16 mb-1" />
            <div className="h-3 bg-ops-surfaceSoft rounded animate-pulse w-64" />
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-80 border-r border-ops-border bg-ops-surfaceSoft p-4">
            <div className="space-y-3">
              <div className="h-12 bg-ops-bg rounded animate-pulse" />
              <div className="h-12 bg-ops-bg rounded animate-pulse" />
              <div className="h-12 bg-ops-bg rounded animate-pulse" />
            </div>
          </div>
          <div className="flex-1 bg-ops-bg flex items-center justify-center">
            <div className="text-ops-textMuted">Loading...</div>
        </div>
          <div className="w-80 border-l border-ops-border bg-ops-surfaceSoft" />
        </div>
      </div>
    }>
      <InboxPageContent />
    </Suspense>
  )
}

