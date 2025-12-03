import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createRouterClient } from '@/lib/llm/integration'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  // Support Bearer token authentication
  const auth = await getAuthenticatedSession(request)
  if (!auth) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )

  // Get user's account_id
  const { data: user } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', auth.user.id)
    .single()

  const { conversationId } = await request.json()

  // 2. Fetch History
  const { data: messages } = await supabase
    .from('messages')
    .select('direction, body_text, sender_type')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20) // Last 20 messages

  if (!messages || messages.length === 0) {
    return new Response('No messages found', { status: 404 })
  }

  // 3. Format History for AI
  const history = messages.map(m => 
    `${m.direction === 'inbound' ? 'Customer' : 'You'}: ${m.body_text}`
  ).join('\n')

  // 3.5. Get RAG context from knowledge docs (if available)
  let ragContext = ''
  if (user?.account_id && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const lastCustomerMessage = messages.filter(m => m.direction === 'inbound').pop()
      if (lastCustomerMessage) {
        const ragUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rag-search`
        const ragResponse = await fetch(ragUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: user.account_id,
            query: lastCustomerMessage.body_text,
            limit: 3,
          }),
        })
        
        if (ragResponse.ok) {
          const ragData = await ragResponse.json()
          if (ragData.context) {
            ragContext = `\n\nRelevant Knowledge:\n${ragData.context}\n`
          }
        }
      }
    } catch (error) {
      console.error('RAG search error:', error)
      // Continue without RAG context
    }
  }

  // 4. Get persona config from account
  let personaConfig: any = {}
  if (user?.account_id) {
    const { data: account } = await supabase
      .from('accounts')
      .select('persona_config')
      .eq('id', user.account_id)
      .single()
    
    personaConfig = account?.persona_config || {}
  }

  // 5. Use LLM Router with automatic fallback
  const routerClient = createRouterClient()

  // Get auth token for router call
  // SECURITY: Verify authentication first with getUser(), then get session for token
  let authToken = request.headers.get('authorization')
  if (!authToken) {
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
    if (!userError && authUser) {
      const { data: { session } } = await supabase.auth.getSession()
      authToken = session?.access_token ? `Bearer ${session.access_token}` : null
    }
  }

  const defaultSystemPrompt = personaConfig.systemPrompt || `You are Carl, an assistant for CRM-AI PRO.
Service Area: Indianapolis, Carmel, Fishers.
Pricing: $89 Diagnostic Fee (waived if work is done).
Urgency: If water is actively leaking, tell them to shut off the main valve immediately.

Your goal is to be helpful, brief, and ask for the address if missing.
Draft a response to the customer based on the conversation history.
You can use tools to create jobs or search contacts if needed.
Do not include "Subject:" lines. Just the body.`

  // 6. Define tools for function calling
  const tools = {
    create_job: {
      description: 'Create a new job if the customer needs service',
      parameters: {
        type: 'object',
        properties: {
          contactId: { type: 'string' },
          description: { type: 'string' },
          scheduledStart: { type: 'string' },
        },
        required: ['contactId', 'description'],
      },
    },
    search_contacts: {
      description: 'Search for a contact by name, email, or phone',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string' },
        },
        required: ['search'],
      },
    },
  }

  // 7. Call LLM Router with fallback to direct OpenAI
  const result = await routerClient.callWithFallback(
    {
      accountId: user?.account_id,
      useCase: 'draft',
      prompt: `Conversation History:\n${history}${ragContext}\n\nDraft a reply:`,
      systemPrompt: defaultSystemPrompt,
      maxTokens: 500,
      temperature: 0.7,
      stream: true,
      tools,
      maxSteps: 3,
    },
    // Fallback function: use direct OpenAI if router fails
    () => streamText({
      model: openai('gpt-4o-mini'),
      system: defaultSystemPrompt,
      prompt: `Conversation History:\n${history}${ragContext}\n\nDraft a reply:`,
      tools,
      maxSteps: 3,
    }).toTextStreamResponse(),
    authToken
  )

  return result
}

