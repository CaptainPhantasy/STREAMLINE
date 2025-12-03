'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getShortcutDisplay } from '@/lib/keyboard-shortcuts'
import { Keyboard } from 'lucide-react'

interface KeyboardShortcutsHelpProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcuts: Array<{
    key: string
    ctrl?: boolean
    meta?: boolean
    shift?: boolean
    alt?: boolean
    description: string
    category: 'navigation' | 'actions' | 'general'
  }>
}

export function KeyboardShortcutsHelp({ open, onOpenChange, shortcuts }: KeyboardShortcutsHelpProps) {
  const grouped = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, typeof shortcuts>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-theme-card border-theme-accent-primary">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Keyboard className="w-5 h-5 text-theme-accent-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-theme-subtle/70">
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {Object.entries(grouped).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-theme-accent-primary uppercase mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-theme-secondary transition-colors"
                  >
                    <span className="text-sm text-theme-subtle">
                      {shortcut.description}
                    </span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {getShortcutDisplay(
                        shortcut.key,
                        shortcut.ctrl,
                        shortcut.meta,
                        shortcut.shift,
                        shortcut.alt
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-theme-border text-xs text-theme-subtle/50 text-center">
          Press <Badge variant="outline" className="font-mono">⌘/</Badge> or <Badge variant="outline" className="font-mono">Ctrl/</Badge> to open this help anytime
        </div>
      </DialogContent>
    </Dialog>
  )
}

