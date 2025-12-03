import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// RAG (Retrieval-Augmented Generation) for Knowledge Docs
// Searches knowledge_docs using vector similarity and returns relevant context

interface RAGRequest {
  accountId: string
  query: string
  limit?: number
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const body: RAGRequest = await req.json()
    const { accountId, query, limit = 3 } = body

    if (!accountId || !query) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate embedding for the query using OpenAI
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    })

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI embedding error: ${await embeddingResponse.text()}`)
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // Search knowledge_docs using vector similarity
    const { data: docs, error } = await supabase.rpc('match_knowledge_docs', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      account_id: accountId,
    })

    if (error) {
      // If the function doesn't exist, fallback to text search
      const { data: fallbackDocs } = await supabase
        .from('knowledge_docs')
        .select('id, title, content')
        .eq('account_id', accountId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(limit)
      
      return new Response(
        JSON.stringify({
          success: true,
          docs: fallbackDocs || [],
          method: 'text_search',
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format context for AI
    const context = docs?.map((doc: any) => 
      `[${doc.title || 'Knowledge Doc'}]\n${doc.content}`
    ).join('\n\n') || ''

    return new Response(
      JSON.stringify({
        success: true,
        docs: docs || [],
        context,
        method: 'vector_search',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('RAG error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

