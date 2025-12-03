'use client'

import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface FloatingActionButtonProps {
  actions: Array<{
    label: string
    icon: React.ReactNode
    onClick: () => void
  }>
  className?: string
}

export function FloatingActionButton({ actions, className }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false)

  if (actions.length === 0) return null

  // Single action - just show the button
  if (actions.length === 1) {
    return (
      <div className={cn("fixed bottom-6 right-6 z-50", className)}>
        <Button
          onClick={actions[0].onClick}
          className="h-14 w-14 rounded-full shadow-elevated shadow-glow border-2 border-theme-accent-primary bg-theme-card hover:bg-theme-secondary"
          size="icon"
        >
          {actions[0].icon}
          <span className="sr-only">{actions[0].label}</span>
        </Button>
      </div>
    )
  }

  // Multiple actions - show menu
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 items-end", className)}>
      {open && (
        <div className="flex flex-col-reverse gap-2 animate-in fade-in slide-in-from-bottom-2">
          {actions.map((action, index) => (
            <div
              key={index}
              className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-sm text-white bg-theme-card px-3 py-1.5 rounded-md border border-theme-border shadow-elevated whitespace-nowrap">
                {action.label}
              </span>
              <Button
                onClick={() => {
                  action.onClick()
                  setOpen(false)
                }}
                className="h-12 w-12 rounded-full shadow-elevated shadow-glow border-2 border-theme-accent-primary bg-theme-card hover:bg-theme-secondary"
                size="icon"
              >
                {action.icon}
                <span className="sr-only">{action.label}</span>
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-14 w-14 rounded-full shadow-elevated border-2 transition-transform",
          open
            ? "bg-red-500/20 border-red-400 hover:bg-red-500/30 shadow-sm"
            : "bg-theme-card border-theme-accent-primary hover:bg-theme-secondary shadow-glow"
        )}
        size="icon"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
        <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
      </Button>
    </div>
  )
}

