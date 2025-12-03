'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { DirectMessageList } from '@/components/messaging/DirectMessageList'
import { DirectMessageThread } from '@/components/messaging/DirectMessageThread'
import { NewMessageDialog } from '@/components/messaging/NewMessageDialog'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DirectMessageConversation, MessageSortOption } from '@/types/direct-messages'

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const [conversations, setConversations] = useState<DirectMessageConversation[]>([])
  // Initialize selected user from URL or default to null
  const initialSelectedUserId = searchParams.get('user') || null
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialSelectedUserId)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<MessageSortOption>('date')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const supabase = createClient()
  
  // Sync selected user with URL parameter
  useEffect(() => {
    const userIdParam = searchParams.get('user')
    if (userIdParam && userIdParam !== selectedUserId) {
      setSelectedUserId(userIdParam)
    } else if (!userIdParam && selectedUserId) {
      // Keep selection if URL param is removed but we have a selection
      // This allows navigation without losing context
    }
  }, [searchParams, selectedUserId])

  useEffect(() => {
    fetchCurrentUser()
    fetchConversations()
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [sortBy, searchQuery])

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
    }
  }

  async function fetchConversations() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (sortBy) params.append('sort_by', sortBy)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/messages/direct?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])

      // Auto-select first conversation if none selected and no URL param
      if (!selectedUserId && !searchParams.get('user') && data.conversations?.length > 0) {
        const firstUserId = data.conversations[0].other_user.id
        setSelectedUserId(firstUserId)
        // Update URL without page reload
        const url = new URL(window.location.href)
        url.searchParams.set('user', firstUserId)
        window.history.replaceState({}, '', url.toString())
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedConversation = conversations.find(
    c => c.other_user.id === selectedUserId
  )

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Conversations List */}
      <div className="w-80 flex-shrink-0">
        <DirectMessageList
          conversations={conversations}
          selectedUserId={selectedUserId}
          onSelectConversation={(userId) => {
            setSelectedUserId(userId)
            // Update URL without page reload
            const url = new URL(window.location.href)
            url.searchParams.set('user', userId)
            window.history.replaceState({}, '', url.toString())
          }}
          sortBy={sortBy}
          onSortChange={setSortBy}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewMessage={() => setNewMessageOpen(true)}
        />
      </div>

      {/* Message Thread */}
      <div className="flex-1">
        {selectedUserId && currentUserId ? (
          <DirectMessageThread
            userId={currentUserId}
            otherUserId={selectedUserId}
            otherUserName={selectedConversation?.other_user.full_name}
            otherUserAvatar={selectedConversation?.other_user.avatar_url || undefined}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        open={newMessageOpen}
        onOpenChange={setNewMessageOpen}
        onSelectUser={(userId) => {
          setSelectedUserId(userId)
          // Update URL
          const url = new URL(window.location.href)
          url.searchParams.set('user', userId)
          window.history.replaceState({}, '', url.toString())
          // Refresh conversations to include the new one
          fetchConversations()
        }}
        currentUserId={currentUserId}
      />
    </div>
  )
}

