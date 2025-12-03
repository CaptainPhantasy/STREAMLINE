import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface LLMRouterRequest {
  accountId?: string
  useCase: 'draft' | 'summary' | 'complex' | 'vision' | 'general'
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  modelOverride?: string // Optional: force specific model
}

interface LLMProvider {
  id: string
  name: string
  provider: string
  model: string
  api_key_encrypted: string
  is_default: boolean
  use_case: string[]
  max_tokens: number
}

Deno.serve(async (req) => {
  try {
    const body: LLMRouterRequest = await req.json()
    const { accountId, useCase, prompt, systemPrompt, maxTokens, temperature, modelOverride } = body

    if (!useCase || !prompt) {
      return new Response(
        JSON.stringify({ error: 'useCase and prompt are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get LLM provider for this use case
    let provider: LLMProvider | null = null

    if (modelOverride) {
      // Find specific model
      const { data } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('model', modelOverride)
        .eq('is_active', true)
        .or(`account_id.is.null,account_id.eq.${accountId || 'null'}`)
        .order('account_id', { ascending: false }) // Prefer account-specific over global
        .limit(1)
        .single()
      
      provider = data as LLMProvider
    } else {
      // Find provider by use case - prioritize non-default providers for specific use cases
      // For complex tasks, prefer Anthropic over default OpenAI
      const { data } = await supabase
        .from('llm_providers')
        .select('*')
        .eq('is_active', true)
        .contains('use_case', [useCase])
        .or(`account_id.is.null,account_id.eq.${accountId || 'null'}`)
        .order('account_id', { ascending: false }) // Prefer account-specific
        .order('is_default', { ascending: useCase === 'complex' ? true : false }) // For complex, prefer non-default (Anthropic)
        .limit(1)
        .single()
      
      provider = data as LLMProvider

      // Fallback to default if no use-case match
      if (!provider) {
        const { data: defaultProvider } = await supabase
          .from('llm_providers')
          .select('*')
          .eq('is_default', true)
          .eq('is_active', true)
          .or(`account_id.is.null,account_id.eq.${accountId || 'null'}`)
          .order('account_id', { ascending: false })
          .limit(1)
          .single()
        
        provider = defaultProvider as LLMProvider
      }
    }

    // Fallback to OpenAI if no provider found
    if (!provider) {
      provider = {
        id: 'default',
        name: 'openai-gpt4o-mini',
        provider: 'openai',
        model: 'gpt-4o-mini',
        api_key_encrypted: Deno.env.get('OPENAI_API_KEY') || '',
        is_default: true,
        use_case: ['draft', 'summary', 'general'],
        max_tokens: maxTokens || 1000
      } as LLMProvider
    }

    // Decrypt API key (for now, assume it's stored encrypted but we'll use env var)
    // In production, use pgcrypto to decrypt
    const apiKey = provider.api_key_encrypted || Deno.env.get('OPENAI_API_KEY') || ''

    // Route to appropriate LLM provider
    let response: any
    const finalMaxTokens = maxTokens || provider.max_tokens || 1000
    const finalTemperature = temperature ?? 0.7

    if (provider.provider === 'openai') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: finalMaxTokens,
          temperature: finalTemperature,
        }),
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      response = await openaiResponse.json()
    } else if (provider.provider === 'anthropic') {
      // Claude API
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          max_tokens: finalMaxTokens,
          temperature: finalTemperature,
          system: systemPrompt || '',
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!claudeResponse.ok) {
        const error = await claudeResponse.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      response = await claudeResponse.json()
    } else if (provider.provider === 'google' || provider.provider === 'gemini') {
      // Google Gemini API
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}` }]
          }],
          generationConfig: {
            maxOutputTokens: finalMaxTokens,
            temperature: finalTemperature,
          },
        }),
      })

      if (!geminiResponse.ok) {
        const error = await geminiResponse.text()
        throw new Error(`Google Gemini API error: ${error}`)
      }

      const geminiData = await geminiResponse.json()
      response = {
        choices: [{
          message: {
            content: geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          }
        }],
        usage: {
          total_tokens: geminiData.usageMetadata?.totalTokenCount || 0
        }
      }
    } else if (provider.provider === 'zai' || provider.provider === 'glm') {
      // Zai GLM API
      const zaiResponse = await fetch('https://api.zai.chat/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: finalMaxTokens,
          temperature: finalTemperature,
        }),
      })

      if (!zaiResponse.ok) {
        const error = await zaiResponse.text()
        throw new Error(`Zai GLM API error: ${error}`)
      }

      response = await zaiResponse.json()
    } else {
      throw new Error(`Unsupported provider: ${provider.provider}`)
    }

    // Extract text from response
    let text = ''
    if (provider.provider === 'openai') {
      text = response.choices[0]?.message?.content || ''
    } else if (provider.provider === 'anthropic') {
      text = response.content[0]?.text || ''
    } else if (provider.provider === 'google' || provider.provider === 'gemini') {
      text = response.choices[0]?.message?.content || ''
    } else if (provider.provider === 'zai' || provider.provider === 'glm') {
      text = response.choices[0]?.message?.content || ''
    }

    // Log to audit trail
    if (accountId) {
      await supabase.from('crmai_audit').insert({
        account_id: accountId,
        action: 'llm_request',
        entity_type: 'llm_provider',
        entity_id: provider.id,
        new_values: {
          provider: provider.provider,
          model: provider.model,
          use_case: useCase,
          tokens_used: response.usage?.total_tokens || 0,
        },
        metadata: { prompt_length: prompt.length }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        text,
        provider: provider.name,
        model: provider.model,
        usage: response.usage || {},
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('LLM Router error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

