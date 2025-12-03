import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface GenerateReplyRequest {
  accountId: string
  conversationId: string
  useCase?: 'draft' | 'summary' | 'complex'
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: GenerateReplyRequest = await req.json()
    const { accountId, conversationId, useCase = 'draft' } = body

    // Fetch conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('direction, body_text, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No messages found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get persona config
    const { data: account } = await supabase
      .from('accounts')
      .select('persona_config')
      .eq('id', accountId)
      .single()

    const personaConfig = account?.persona_config || {}
    const systemPrompt = personaConfig.systemPrompt || `You are Carl, an AI assistant for a plumbing business.
Service Area: Indianapolis, Carmel, Fishers.
Pricing: $89 Diagnostic Fee (waived if work is done).
Be helpful, brief, and ask for the address if missing.`

    // Format history
    const history = messages.map(m => 
      `${m.direction === 'inbound' ? 'Customer' : 'You'}: ${m.body_text}`
    ).join('\n')

    // Get RAG context from knowledge docs
    let ragContext = ''
    try {
      const lastCustomerMessage = messages.filter(m => m.direction === 'inbound').pop()
      if (lastCustomerMessage) {
        const ragUrl = `${supabaseUrl}/functions/v1/rag-search`
        const ragResponse = await fetch(ragUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId,
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

    // Call LLM router
    const llmRes = await fetch(`${supabaseUrl}/functions/v1/llm-router`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        useCase,
        prompt: `Conversation History:\n${history}${ragContext}\n\nDraft a reply:`,
        systemPrompt,
        maxTokens: 500,
        temperature: 0.7,
      }),
    })

    const llmData = await llmRes.json()

    if (!llmRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate reply', details: llmData.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: llmData.text,
        provider: llmData.provider,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

