'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/search/global-search'
import { UserMenu } from '@/components/dashboard/user-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { CommandPalette } from '@/components/ui/command-palette'
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help'
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/lib/keyboard-shortcuts'
import { cn } from '@/lib/utils'
import { BarChart3, DollarSign, Settings as SettingsIcon } from 'lucide-react'
import { VoiceNavigationProvider } from '@/hooks/use-voice-navigation'
import { AppShell } from '@/components/layout/app-shell'
import { NotificationProvider } from '@/lib/contexts/NotificationContext'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/inbox') {
      return pathname === '/inbox'
    }
    if (path === '/jobs') {
      return pathname === '/jobs' || pathname.startsWith('/jobs/')
    }
    if (path === '/contacts') {
      return pathname === '/contacts' || pathname.startsWith('/contacts/')
    }
    if (path === '/analytics') {
      return pathname === '/analytics' || pathname.startsWith('/analytics/')
    }
    if (path === '/finance') {
      return pathname === '/finance' || pathname.startsWith('/finance/')
    }
    if (path === '/tech/dashboard') {
      return pathname === '/tech/dashboard' || pathname.startsWith('/tech/')
    }
    if (path === '/settings') {
      return pathname === '/settings' || pathname.startsWith('/settings/') || pathname.startsWith('/admin/settings')
    }
    if (path === '/marketing/campaigns') {
      return pathname === '/marketing/campaigns' || pathname.startsWith('/marketing/campaigns')
    }
    if (path === '/marketing/email-templates') {
      return pathname === '/marketing/email-templates'
    }
    if (path === '/marketing/tags') {
      return pathname === '/marketing/tags'
    }
    return false
  }


  const getNavLinkClasses = (path: string, glowColor: 'blue' | 'green' = 'blue') => {
    const active = isActive(path)
    const borderColor = glowColor === 'blue' ? 'border-theme-accent-primary' : 'border-theme-accent-secondary'
    const glowClass = glowColor === 'blue' ? 'shadow-glow' : 'shadow-glow'
    const hoverBorder = glowColor === 'blue' ? 'hover:border-theme-accent-primary/30' : 'hover:border-theme-accent-secondary/30'
    
    return cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all relative border-2",
      active
        ? `text-theme-primary bg-theme-surface ${borderColor} ${glowClass}`
        : `text-theme-secondary hover:text-theme-primary hover:bg-theme-surface/50 border-transparent ${hoverBorder}`
    )
  }

  // Keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      meta: true,
      action: () => setCommandPaletteOpen(true),
      description: 'Open command palette',
      category: 'general'
    },
    {
      key: '/',
      meta: true,
      action: () => setShortcutsHelpOpen(true),
      description: 'Show keyboard shortcuts',
      category: 'general'
    },
    {
      key: 'n',
      meta: true,
      action: () => {
        if (pathname.startsWith('/jobs')) {
          router.push('/jobs?action=create')
        } else if (pathname.startsWith('/contacts')) {
          router.push('/contacts?action=create')
        } else {
          router.push('/jobs?action=create')
        }
      },
      description: 'Create new (context-aware)',
      category: 'actions'
    },
    {
      key: 'j',
      meta: true,
      action: () => router.push('/jobs'),
      description: 'Go to Jobs',
      category: 'navigation'
    },
    {
      key: 'c',
      meta: true,
      action: () => router.push('/contacts'),
      description: 'Go to Contacts',
      category: 'navigation'
    },
    {
      key: 'i',
      meta: true,
      action: () => router.push('/inbox'),
      description: 'Go to Inbox',
      category: 'navigation'
    },
    {
      key: 'Escape',
      action: () => {
        setCommandPaletteOpen(false)
        setShortcutsHelpOpen(false)
      },
      description: 'Close modals/dialogs',
      category: 'general'
    }
  ]

  useKeyboardShortcuts(shortcuts)

  return (
      <NotificationProvider>
        <AppShell>
          {/* Header with global search and user controls */}
          <header className="flex-none h-16 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between">
            <div className="flex-1">
              <GlobalSearch />
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell variant="ghost" size="icon" enableSound={true} />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

        {/* Main content area - extra padding on outer edges for shadow breathing room */}
        <div className="flex-1 overflow-y-auto bg-theme-primary px-4">
            {children}
        </div>
      
      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
      
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        open={shortcutsHelpOpen}
        onOpenChange={setShortcutsHelpOpen}
        shortcuts={shortcuts}
      />
      
      {/* Voice Navigation - listens for commands from the voice agent */}
      <VoiceNavigationProvider />
        </AppShell>
      </NotificationProvider>
  )
}
