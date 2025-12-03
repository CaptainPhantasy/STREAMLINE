'use client'

import { useState, useEffect } from 'react'
import { Clock, X, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getSearchHistory, removeFromSearchHistory, clearSearchHistory, type SearchHistoryItem } from '@/lib/search-history'

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void
  onClose: () => void
  className?: string
}

export function SearchHistory({ onSelectQuery, onClose, className }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([])

  useEffect(() => {
    setHistory(getSearchHistory())
  }, [])

  function handleSelect(query: string) {
    onSelectQuery(query)
    onClose()
  }

  function handleRemove(query: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeFromSearchHistory(query)
    setHistory(getSearchHistory())
  }

  function handleClear() {
    clearSearchHistory()
    setHistory([])
  }

  if (history.length === 0) {
    return null
  }

  return (
    <Card className={`mt-2 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-600">Recent Searches</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 text-xs text-neutral-500 hover:text-neutral-700"
          >
            Clear
          </Button>
        </div>
        <div className="space-y-1">
          {history.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSelect(item.query)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-neutral-50 text-left group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <TrendingUp className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-700 truncate">{item.query}</span>
                {item.resultCount !== undefined && (
                  <span className="text-xs text-neutral-400">
                    ({item.resultCount} results)
                  </span>
                )}
              </div>
              <button
                onClick={(e) => handleRemove(item.query, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-200 rounded"
              >
                <X className="w-3 h-3 text-neutral-400" />
              </button>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

