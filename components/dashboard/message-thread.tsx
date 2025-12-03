'use client'

import { useEffect, useState, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Message, Conversation } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCompletion } from '@ai-sdk/react'
import { Send, Sparkles, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateJobDialog } from '@/components/jobs/create-job-dialog'
import { EmailQuickActions } from '@/components/conversations/email-quick-actions'
import { toast, error as toastError, success as toastSuccess } from '@/lib/toast'
import { useRouter } from 'next/navigation'
import { ContactDetailModal } from '@/components/contacts/contact-detail-modal'

interface MessageThreadProps {
  conversationId: string
}

export function MessageThread({ conversationId }: MessageThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [createJobOpen, setCreateJobOpen] = useState(false)
  const [contactDetailOpen, setContactDetailOpen] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  const { completion, complete, isLoading: isDrafting } = useCompletion({
    api: '/api/ai/draft',
    onFinish: (prompt, result) => {
      setNewMessage(result)
    }
  })

  // Update newMessage as completion streams in
  useEffect(() => {
    if (completion) {
      setNewMessage(completion)
    }
  }, [completion])

  useEffect(() => {
    if (!conversationId) return

    fetchData()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  async function fetchData() {
    setLoading(true)
    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*, contact:contacts(*)')
        .eq('id', conversationId)
        .single()
      
      if (convError) {
        console.error('Error fetching conversation:', convError)
      } else if (convData) {
        setConversation(convData as Conversation)
      }

      const { data: msgsData, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      
      if (msgsError) {
        console.error('Error fetching messages:', msgsError)
      } else if (msgsData) {
        setMessages(msgsData as Message[])
        scrollToBottom()
      }
    } finally {
      setLoading(false)
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  async function handleSend() {
    if (!newMessage.trim()) return
    setSending(true)

    try {
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message: newMessage,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }
      
      // Optimistic update or just wait for Realtime subscription to pick it up
      // Since the API inserts into DB, the Realtime subscription in useEffect will see it.
      setNewMessage('')
    } catch (error: any) {
      console.error('Error sending message:', error)
      toastError('Failed to send message', error.message || 'Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500">
        Select a conversation to start chatting
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 bg-white">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Loading conversation...</p>
          <p className="text-sm text-neutral-400">Fetching messages...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 bg-white">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Conversation not found</p>
          <p className="text-sm text-neutral-400">The conversation may have been deleted</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-[var(--card-bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-[#EBF0FF] to-white flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-[#3366FF] truncate">
            {conversation?.contact?.first_name || 'Unknown'} {conversation?.contact?.last_name || ''}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{conversation?.subject || 'No subject'}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <EmailQuickActions
            conversationId={conversationId}
            contactId={conversation?.contact_id}
            contactEmail={conversation?.contact?.email}
            contactName={conversation?.contact ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim() : undefined}
            emailBody={messages.length > 0 ? messages[messages.length - 1]?.body_text : undefined}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#3366FF] text-[#3366FF] hover:bg-[#EBF0FF]"
            onClick={() => {
              if (conversation?.contact_id) {
                router.push(`/contacts?id=${conversation.contact_id}`)
              }
            }}
            disabled={!conversation?.contact_id}
          >
            Details
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 px-4 py-4 min-h-full">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start the conversation by sending a message</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isMe = msg.direction === 'outbound'
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex max-w-[80%] flex-col gap-2 rounded-lg p-3 text-sm",
                        isMe 
                          ? "self-end bg-gradient-to-br from-[#4B79FF] to-[#3366FF] text-white shadow-md" 
                          : "self-start bg-gradient-to-br from-white to-[#F9FAFB] border-2 border-[#E4E7EC] shadow-sm"
                      )}
                    >
                      <div className={cn("whitespace-pre-wrap break-words", isMe ? "text-white" : "text-neutral-800")}>
                        {msg.body_text || (msg.body_html ? msg.body_html.replace(/<[^>]*>/g, '') : '')}
                      </div>
                      <div className={cn("text-[10px] opacity-70", isMe ? "text-white/80" : "text-neutral-500")}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )
                })}
                <div ref={scrollRef} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="px-0 py-4 bg-white border-t border-neutral-200 flex-shrink-0">
        <div className="flex gap-2 flex-col px-4">
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => complete('', { body: { conversationId } })}
              disabled={isDrafting}
              className="text-xs text-neutral-500 hover:text-neutral-800 hover:bg-neutral-50"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {isDrafting ? 'Drafting...' : 'Auto-Draft'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 min-h-[80px] border-neutral-300 focus:border-primary-600 focus:ring-primary-600 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button 
              onClick={handleSend} 
              disabled={sending || !newMessage.trim()}
              className="h-auto px-4 bg-gradient-to-r from-[#4B79FF] to-[#3366FF] hover:from-[#3366FF] hover:to-[#1C4DDE] text-white shadow-md flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create Job Dialog */}
      {conversation?.contact?.id && (
        <CreateJobDialog
          open={createJobOpen}
          onOpenChange={setCreateJobOpen}
          onSuccess={() => {
            // Job created successfully
            setCreateJobOpen(false)
          }}
          prefillContactId={conversation.contact.id}
        />
      )}
    </div>
  )
}

