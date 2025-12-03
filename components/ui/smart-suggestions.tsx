'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartSuggestion {
  id: string
  text: string
  action: () => void
  type: 'action' | 'hint' | 'completion'
}

interface SmartSuggestionsProps {
  context?: {
    entityType?: 'job' | 'contact' | 'conversation'
    entityId?: string
    currentPage?: string
  }
  onSuggestionClick?: (suggestion: SmartSuggestion) => void
  className?: string
}

export function SmartSuggestions({ context, onSuggestionClick, className }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!context) return

    async function fetchSuggestions() {
      setLoading(true)
      try {
        const response = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [context])

  function handleSuggestionClick(suggestion: SmartSuggestion) {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion)
    } else {
      suggestion.action()
    }
    setDismissed(prev => new Set(prev).add(suggestion.id))
  }

  function handleDismiss(id: string) {
    setDismissed(prev => new Set(prev).add(id))
  }

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id))

  if (loading || visibleSuggestions.length === 0) return null

  return (
    <div className={cn("space-y-2", className)}>
      {visibleSuggestions.map((suggestion) => (
        <Card
          key={suggestion.id}
          className="border-theme-border bg-theme-card/50 hover:bg-theme-card transition-colors"
        >
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-theme-accent-primary flex-shrink-0" />
              <span className="text-sm text-theme-subtle">
                {suggestion.text}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleSuggestionClick(suggestion)}
                className="h-7 px-2 text-xs text-theme-accent-primary hover:text-white"
              >
                {suggestion.type === 'action' ? 'Do it' : 'Use'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(suggestion.id)}
                className="h-7 w-7 p-0 text-theme-subtle hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

