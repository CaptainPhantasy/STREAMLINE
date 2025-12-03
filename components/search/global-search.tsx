'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, X, Briefcase, User, MessageSquare, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SearchResults, SearchResponse } from '@/types/search'
import { addToSearchHistory, getSearchHistory } from '@/lib/search-history'
import { SearchHistory } from './search-history'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query)
        setShowHistory(false)
      } else {
        setResults(null)
        setShowHistory(query.length === 0 && open)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, open])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  async function performSearch(searchQuery: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
        setOpen(true)
        
        // Save to search history
        const totalResults = (data.results?.jobs?.length || 0) + 
                           (data.results?.contacts?.length || 0) + 
                           (data.results?.conversations?.length || 0)
        addToSearchHistory(searchQuery, totalResults)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleResultClick(type: 'job' | 'contact' | 'conversation', id: string) {
    setOpen(false)
    setShowHistory(false)
    setQuery('')
    if (type === 'job') {
      router.push(`/jobs?id=${id}`)
    } else if (type === 'contact') {
      router.push(`/contacts?id=${id}`)
    } else if (type === 'conversation') {
      router.push(`/inbox?conversation=${id}`)
    }
  }

  function handleHistorySelect(query: string) {
    setQuery(query)
    setShowHistory(false)
    performSearch(query)
  }

  function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.length < 2) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-theme-accent-primary/30 text-theme-accent-primary px-0.5 rounded">{part}</mark>
      ) : (
        part
      )
    )
  }

  const totalResults = results
    ? results.jobs.length + results.contacts.length + results.conversations.length
    : 0

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-subtle z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search jobs, contacts, conversations..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value.length >= 2) {
              setOpen(true)
            }
          }}
          onFocus={() => {
            setOpen(true)
            if (query.length >= 2 && results) {
              setShowHistory(false)
            } else if (query.length === 0) {
              setShowHistory(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setShowHistory(false)
            } else if (e.key === 'ArrowDown' && results && totalResults > 0) {
              e.preventDefault()
              setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1))
            } else if (e.key === 'ArrowUp' && results && totalResults > 0) {
              e.preventDefault()
              setSelectedIndex(prev => Math.max(prev - 1, -1))
            } else if (e.key === 'Enter' && selectedIndex >= 0 && results) {
              e.preventDefault()
              // Handle enter key navigation
            }
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
              setOpen(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme-subtle hover:text-theme-accent-primary z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            <Loader2 className="w-4 h-4 animate-spin text-theme-accent-primary" />
          </div>
        )}
      </div>

      {open && showHistory && query.length === 0 && (
        <SearchHistory
          onSelectQuery={handleHistorySelect}
          onClose={() => setShowHistory(false)}
        />
      )}

      {open && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-elevated max-h-96 overflow-y-auto border-theme-accent-primary">
          <CardContent className="p-0 bg-theme-card">
            {loading ? (
              <div className="p-4 text-center text-sm text-theme-subtle">
                Searching...
              </div>
            ) : results && totalResults > 0 ? (
              <div className="divide-y divide-theme-accent-primary">
                {/* Jobs Results */}
                {results.jobs.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-theme-subtle uppercase">
                      Jobs ({results.jobs.length})
                    </div>
                    {results.jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleResultClick('job', job.id)}
                        className="w-full text-left px-2 py-2 hover:bg-theme-secondary rounded flex items-center gap-2 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-theme-accent-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate text-white">
                              {highlightText(
                                job.contact
                                  ? `${job.contact.first_name || ''} ${job.contact.last_name || ''}`.trim()
                                  : 'Unknown Contact',
                                query
                              )}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {job.status}
                            </Badge>
                          </div>
                          {job.description && (
                            <p className="text-xs text-theme-subtle truncate mt-1">
                              {highlightText(job.description, query)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Contacts Results */}
                {results.contacts.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-theme-subtle uppercase">
                      Contacts ({results.contacts.length})
                    </div>
                    {results.contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleResultClick('contact', contact.id)}
                        className="w-full text-left px-2 py-2 hover:bg-theme-secondary rounded flex items-center gap-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-theme-accent-secondary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">
                            {highlightText(`${contact.first_name} ${contact.last_name}`, query)}
                          </div>
                          {contact.email && (
                            <p className="text-xs text-theme-subtle truncate mt-1">
                              {highlightText(contact.email, query)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Conversations Results */}
                {results.conversations.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-xs font-semibold text-theme-subtle uppercase">
                      Conversations ({results.conversations.length})
                    </div>
                    {results.conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleResultClick('conversation', conversation.id)}
                        className="w-full text-left px-2 py-2 hover:bg-theme-secondary rounded flex items-center gap-2 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-theme-accent-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate text-white">
                              {highlightText(
                                conversation.contact
                                  ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim()
                                  : conversation.subject || 'No subject',
                                query
                              )}
                            </span>
                            <Badge variant={conversation.status === 'open' ? 'default' : conversation.status === 'closed' ? 'secondary' : 'outline'} className="text-xs">
                              {conversation.status}
                            </Badge>
                          </div>
                          {conversation.subject && (
                            <p className="text-xs text-theme-subtle truncate mt-1">
                              {highlightText(conversation.subject, query)}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-sm text-theme-subtle">
                No results found
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

