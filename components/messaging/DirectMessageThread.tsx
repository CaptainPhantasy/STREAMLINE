'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Loader2, User } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DirectMessage } from '@/types/direct-messages'
import { createClient } from '@/lib/supabase/client'

interface DirectMessageThreadProps {
  userId: string
  otherUserId: string
  otherUserName?: string | null
  otherUserAvatar?: string | null
}

export function DirectMessageThread({
  userId,
  otherUserId,
  otherUserName,
  otherUserAvatar,
}: DirectMessageThreadProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`direct_messages:${userId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `or(and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId}))`,
        },
        (payload) => {
          const newMsg = payload.new as DirectMessage
          setMessages((prev) => [...prev, newMsg])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, otherUserId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function fetchMessages() {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/direct/${otherUserId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || sending) return

    setSending(true)

    try {
      const response = await fetch('/api/messages/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: otherUserId,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const { message } = await response.json()
      setMessages((prev) => [...prev, message])
      setNewMessage('')
      scrollToBottom()
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUserAvatar || undefined} alt={otherUserName || 'User'} />
            <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF]">
              {otherUserName?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{otherUserName || 'Unknown User'}</p>
            <p className="text-sm text-gray-500">Direct message</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.sender_id === userId

              return (
                <div
                  key={message.id}
                  className={cn('flex gap-3', isOwn && 'flex-row-reverse')}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage
                      src={
                        isOwn
                          ? undefined // Could fetch current user's avatar
                          : otherUserAvatar || undefined
                      }
                      alt={isOwn ? 'You' : otherUserName || 'User'}
                    />
                    <AvatarFallback className="bg-[#EBF0FF] text-[#4B79FF] text-xs">
                      {isOwn
                        ? 'You'
                        : otherUserName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn('flex-1', isOwn && 'flex flex-col items-end')}>
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[70%]',
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 px-2">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

