'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Template {
  id: string
  name: string
  description?: string
  category: 'job' | 'contact' | 'email' | 'invoice'
  data: Record<string, any>
  isDefault?: boolean
}

interface TemplateSelectorProps {
  type: 'job' | 'contact' | 'email' | 'invoice'
  onSelect: (template: Template) => void
  trigger?: React.ReactNode
  className?: string
}

export function TemplateSelector({
  type,
  onSelect,
  trigger,
  className,
}: TemplateSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  async function loadTemplates() {
    setLoading(true)
    try {
      const response = await fetch(`/api/templates/${type}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen) {
      loadTemplates()
    } else {
      setSearchQuery('')
    }
  }

  function handleSelect(template: Template) {
    onSelect(template)
    setOpen(false)
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const defaultTrigger = (
    <Button variant="outline" size="sm" className={className}>
      <FileText className="w-4 h-4 mr-2" />
      Use Template
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-theme-card border-theme-accent-primary">
        <DialogHeader>
          <DialogTitle className="text-white">Select {type} Template</DialogTitle>
          <DialogDescription className="text-theme-subtle/70">
            Choose a template to quickly fill in the form
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-subtle" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-theme-secondary border-theme-border text-white"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-theme-subtle/70">
              Loading templates...
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-8 text-center text-sm text-theme-subtle/70">
              {searchQuery ? 'No templates found' : 'No templates available'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelect(template)}
                  className={cn(
                    "text-left p-4 rounded-md border-2 transition-all",
                    template.isDefault
                      ? "border-theme-accent-primary bg-theme-secondary/50 hover:bg-theme-secondary shadow-glow"
                      : "border-theme-border bg-theme-card hover:bg-theme-secondary hover:border-theme-accent-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-theme-accent-primary" />
                      <span className="font-medium text-white">{template.name}</span>
                    </div>
                    {template.isDefault && (
                      <Badge variant="default" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-theme-subtle/70 mt-1">
                      {template.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

