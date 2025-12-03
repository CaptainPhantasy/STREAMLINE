'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, MessageSquare, User, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DirectMessageConversation, MessageSortOption } from '@/types/direct-messages'

interface DirectMessageListProps {
  conversations: DirectMessageConversation[]
  selectedUserId: string | null
  onSelectConversation: (userId: string) => void
  sortBy?: MessageSortOption
  onSortChange?: (sort: MessageSortOption) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onNewMessage?: () => void
}

export function DirectMessageList({
  conversations,
  selectedUserId,
  onSelectConversation,
  sortBy = 'date',
  onSortChange,
  searchQuery = '',
  onSearchChange,
  onNewMessage,
}: DirectMessageListProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])

  function handleSearchChange(value: string) {
    setLocalSearch(value)
    onSearchChange?.(value)
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Messages</h2>
          </div>
          {onNewMessage && (
            <Button
              size="sm"
              onClick={onNewMessage}
              className="h-8 w-8 p-0"
              title="New message"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort Options */}
        {onSortChange && (
          <div className="flex gap-2 mt-3">
            <Button
              variant={sortBy === 'date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('date')}
              className="text-xs"
            >
              Date
            </Button>
            <Button
              variant={sortBy === 'sender' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('sender')}
              className="text-xs"
            >
              Sender
            </Button>
            <Button
              variant={sortBy === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSortChange('unread')}
              className="text-xs"
            >
              Unread
            </Button>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const isSelected = selectedUserId === conversation.other_user.id
              const hasUnread = conversation.unread_count > 0

              return (
                <button
                  key={conversation.other_user.id}
                  onClick={() => onSelectConversation(conversation.other_user.id)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-gray-50 transition-colors',
                    isSelected && 'bg-blue-50 border-l-4 border-blue-500'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={conversation.other_user.avatar_url || undefined}
                        alt={conversation.other_user.full_name || 'User'}
                      />
                      <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
                        {conversation.other_user.full_name?.[0]?.toUpperCase() || (
                          <User className="w-5 h-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p
                          className={cn(
                            'font-medium truncate',
                            hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          )}
                        >
                          {conversation.other_user.full_name || 'Unknown User'}
                        </p>
                        {hasUnread && (
                          <Badge variant="default" className="ml-2">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      {conversation.last_message && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                      {conversation.last_message && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conversation.last_message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

