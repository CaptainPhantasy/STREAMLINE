'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Briefcase, User, MessageSquare, Plus, FileText, Settings, BarChart3, DollarSign, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export type CommandAction = {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  category: 'navigation' | 'actions' | 'general'
  action: () => void
  shortcut?: string
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions?: CommandAction[]
}

export function CommandPalette({ open, onOpenChange, actions = [] }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Default actions if none provided
  const defaultActions: CommandAction[] = [
    {
      id: 'new-job',
      label: 'Create New Job',
      description: 'Create a new job or work order',
      icon: <Briefcase className="w-4 h-4" />,
      category: 'actions',
      action: () => router.push('/jobs?action=create'),
      shortcut: '⌘N',
      keywords: ['job', 'work', 'order', 'create', 'new']
    },
    {
      id: 'new-contact',
      label: 'Create New Contact',
      description: 'Add a new contact to the CRM',
      icon: <User className="w-4 h-4" />,
      category: 'actions',
      action: () => router.push('/contacts?action=create'),
      keywords: ['contact', 'customer', 'client', 'add', 'new']
    },
    {
      id: 'jobs',
      label: 'Go to Jobs',
      description: 'View all jobs',
      icon: <Briefcase className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/jobs'),
      shortcut: '⌘J',
      keywords: ['jobs', 'work', 'orders']
    },
    {
      id: 'contacts',
      label: 'Go to Contacts',
      description: 'View all contacts',
      icon: <User className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/contacts'),
      shortcut: '⌘C',
      keywords: ['contacts', 'customers', 'clients']
    },
    {
      id: 'inbox',
      label: 'Go to Inbox',
      description: 'View conversations and messages',
      icon: <MessageSquare className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/inbox'),
      shortcut: '⌘I',
      keywords: ['inbox', 'messages', 'conversations', 'email']
    },
    {
      id: 'analytics',
      label: 'Go to Analytics',
      description: 'View business analytics and reports',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'reports', 'stats', 'dashboard']
    },
    {
      id: 'finance',
      label: 'Go to Finance',
      description: 'View financial information',
      icon: <DollarSign className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/finance/dashboard'),
      keywords: ['finance', 'money', 'revenue', 'invoices']
    },
    {
      id: 'settings',
      label: 'Go to Settings',
      description: 'Manage account settings',
      icon: <Settings className="w-4 h-4" />,
      category: 'navigation',
      action: () => router.push('/admin/settings'),
      shortcut: '⌘,',
      keywords: ['settings', 'preferences', 'config']
    }
  ]

  const allActions = [...defaultActions, ...actions]

  // Filter actions based on query
  const filteredActions = allActions.filter(action => {
    if (!query.trim()) return true
    
    const searchTerm = query.toLowerCase()
    const matchesLabel = action.label.toLowerCase().includes(searchTerm)
    const matchesDescription = action.description?.toLowerCase().includes(searchTerm)
    const matchesKeywords = action.keywords?.some(kw => kw.toLowerCase().includes(searchTerm))
    
    return matchesLabel || matchesDescription || matchesKeywords
  })

  // Group by category
  const groupedActions = filteredActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = []
    }
    acc[action.category].push(action)
    return acc
  }, {} as Record<string, CommandAction[]>)

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredActions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter' && filteredActions[selectedIndex]) {
        e.preventDefault()
        filteredActions[selectedIndex].action()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredActions, onOpenChange])

  function handleActionClick(action: CommandAction) {
    action.action()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-theme-card border-theme-accent-primary">
        <div className="flex items-center border-b border-theme-border px-4 py-3">
          <Search className="w-4 h-4 text-theme-subtle mr-3" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-theme-subtle/50"
          />
          {query && (
            <Badge variant="outline" className="ml-2 text-xs">
              {filteredActions.length} {filteredActions.length === 1 ? 'result' : 'results'}
            </Badge>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-theme-subtle/70">
              No commands found. Try a different search term.
            </div>
          ) : (
            Object.entries(groupedActions).map(([category, categoryActions]) => (
              <div key={category} className="mb-4">
                <div className="px-2 py-1.5 text-xs font-semibold text-theme-subtle/70 uppercase mb-1">
                  {category}
                </div>
                {categoryActions.map((action, index) => {
                  const globalIndex = filteredActions.indexOf(action)
                  const isSelected = globalIndex === selectedIndex
                  
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                        isSelected
                          ? "bg-theme-accent-primary/20 text-white border border-theme-accent-primary/50"
                          : "text-theme-subtle hover:bg-theme-secondary hover:text-white"
                      )}
                    >
                      <div className="text-theme-accent-primary">{action.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium">{action.label}</div>
                        {action.description && (
                          <div className="text-xs text-theme-subtle/70 mt-0.5">
                            {action.description}
                          </div>
                        )}
                      </div>
                      {action.shortcut && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {action.shortcut}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
        
        <div className="border-t border-theme-border px-4 py-2 text-xs text-theme-subtle/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>⌘K to open</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

