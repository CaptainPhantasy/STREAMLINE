'use client'

import { ReactNode } from 'react'
import { SidebarNav } from './sidebar-nav'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-theme-primary text-theme-primary">
      {/* Left Navigation */}
      <SidebarNav />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-theme-primary overflow-hidden">
        {children}
      </main>
    </div>
  )
}
