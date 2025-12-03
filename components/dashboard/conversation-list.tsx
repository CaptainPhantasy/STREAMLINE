// components/dashboard/conversation-list.tsx - FIXED VERSION
'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useSearchParams } from 'next/navigation'
import { Conversation, Contact } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAccountId } from '@/hooks/use-account'
import { useDebouncedCallback } from '@/lib/utils/debounce'

interface ConversationListProps {
  initialConversations?: Conversation[]
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [errorCount, setErrorCount] = useState(0)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id') || searchParams.get('conversation')
  const fetchRef = useRef(false)
  
  // CRITICAL FIX: Get account ID for filtering
  const accountId = useAccountId()

  async function fetchConversations() {
    // Stop retrying after 3 consecutive errors to prevent DoS
    if (errorCount >= 3) {
      console.warn('Too many errors, stopping fetch attempts')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Use API endpoint which bypasses RLS for development
      const response = await fetch('/api/conversations', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const apiData = await response.json()
        setConversations((apiData.conversations || []) as Conversation[])
        setErrorCount(0) // Reset error count on success
      } else {
        // Handle unauthorized gracefully - user might not be logged in
        if (response.status === 401) {
          console.warn('Not authenticated - conversations will be empty')
          setConversations([])
          setErrorCount(0) // Don't count auth errors
        } else {
          console.error('Failed to fetch conversations:', response.status, response.statusText)
          setErrorCount(prev => prev + 1)
          setConversations([])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setErrorCount(prev => prev + 1)
      // Don't crash the page - just show empty state
      setConversations([])
    } finally {
      setLoading(false)
    }
  }
  
  // PERFORMANCE FIX: Debounce fetch to batch rapid updates
  const debouncedFetch = useDebouncedCallback(fetchConversations, 1000)

  useEffect(() => {
    // CRITICAL FIX: Don't subscribe without account context
    if (!accountId) {
      console.log('[ConversationList] Waiting for account ID...')
      return
    }

    // Prevent multiple simultaneous fetches
    if (fetchRef.current) return
    fetchRef.current = true

    fetchConversations()

    // CRITICAL FIX: Add account filter to subscription
    const channel = supabase
      .channel(`conversations_${accountId}`)  // Unique channel per account
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `account_id=eq.${accountId}`  // CRITICAL: Only this account's data
        },
        (payload) => {
          console.log('[ConversationList] New conversation:', payload.new)
          // Optimistic update - add directly to state
          setConversations(prev => [payload.new as Conversation, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `account_id=eq.${accountId}`  // CRITICAL: Only this account's data
        },
        (payload) => {
          console.log('[ConversationList] Updated conversation:', payload.new)
          // Optimistic update - update in state
          setConversations(prev => prev.map(conv =>
            conv.id === payload.new.id ? payload.new as Conversation : conv
          ))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `account_id=eq.${accountId}`  // CRITICAL: Only this account's data
        },
        (payload) => {
          console.log('[ConversationList] Deleted conversation:', payload.old)
          // Optimistic update - remove from state
          setConversations(prev => prev.filter(conv => conv.id !== payload.old.id))
        }
      )
      .subscribe((status) => {
        console.log('[ConversationList] Subscription status:', status, 'for account:', accountId)
      })

    return () => {
      fetchRef.current = false
      supabase.removeChannel(channel)
      console.log('[ConversationList] Unsubscribed from account:', accountId)
    }
  }, [accountId]) // Re-subscribe when account changes

  async function handleStatusChange(conversationId: string, newStatus: 'open' | 'closed' | 'snoozed') {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        // Update local state
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, status: newStatus } : conv
        ))
      } else {
        console.error('Failed to update conversation status')
      }
    } catch (error) {
      console.error('Error updating conversation status:', error)
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--card-bg)]">
      <div className="p-4 border-b border-theme-border bg-theme-card flex-shrink-0">
        <h2 className="text-lg font-semibold text-theme-accent-primary mb-3">Inbox</h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-theme-accent-primary" />
            <Input 
            type="text" 
            placeholder="Search..." 
            className="pl-10"
            />
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-theme-secondary">
        <ScrollArea className="h-full">
          <div className="flex flex-col">
            {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/inbox?conversation=${conv.id}`)}
              className={cn(
                "flex flex-col gap-2 px-4 py-3 text-left transition-all border-b border-theme-border hover:bg-theme-secondary",
                selectedId === conv.id && "bg-theme-secondary border-l-4 border-l-theme-accent-primary shadow-inner"
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {conv.contact?.first_name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm text-white truncate">
                      {conv.contact?.first_name} {conv.contact?.last_name}
                    </span>
                    <span className="text-xs text-theme-subtle/70 whitespace-nowrap">
                      {conv.last_message_at && new Date(conv.last_message_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-theme-subtle/50 truncate mt-0.5">
                    {conv.subject || 'No Subject'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-11">
                 <Select
                   value={conv.status}
                   onValueChange={(value: 'open' | 'closed' | 'snoozed') => handleStatusChange(conv.id, value)}
                 >
                   <SelectTrigger className="h-6 w-24 text-[10px] px-2 border-theme-border">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="open">Open</SelectItem>
                     <SelectItem value="closed">Closed</SelectItem>
                     <SelectItem value="snoozed">Snoozed</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </button>
            ))}
            {!loading && conversations.length === 0 && (
              <div className="p-8 text-center text-theme-subtle/50 text-sm">
                <p className="mb-2">No conversations yet.</p>
                <p className="text-xs text-theme-subtle/30">Seed test data from the Jobs page to see conversations.</p>
              </div>
            )}
            {loading && (
              <div className="p-8 text-center text-theme-subtle text-sm">
                <p>Loading conversations...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
