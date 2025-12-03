'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Trash2, Edit, Copy, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
}

interface BulkActionToolbarProps {
  selectedCount: number
  actions: BulkAction[]
  onClearSelection: () => void
  className?: string
}

export function BulkActionToolbar({
  selectedCount,
  actions,
  onClearSelection,
  className
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-theme-card border-t-2 border-theme-accent-primary shadow-elevated p-4",
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="default" className="text-sm">
            {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-theme-subtle hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              className={cn(
                action.variant === 'destructive'
                  ? "bg-red-500/20 border-red-400 hover:bg-red-500/30 text-red-300"
                  : "bg-theme-secondary border-theme-accent-primary hover:bg-theme-accent-primary/20"
              )}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

