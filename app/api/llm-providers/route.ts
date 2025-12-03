import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get providers for this account (or global if account_id is null)
    const { data: providers, error } = await supabase
      .from('llm_providers')
      .select('id, name, provider, model, use_case, max_tokens, is_active, is_default, account_id')
      .or(`account_id.is.null,account_id.eq.${currentUser.account_id}`)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching providers:', error)
      return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
    }

    // Check if environment variables are configured
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

    // Add env var status to each provider
    const providersWithEnvStatus = (providers || []).map(provider => ({
      ...provider,
      usesEnvVar: (provider.provider === 'openai' && hasOpenAIKey) || 
                  (provider.provider === 'anthropic' && hasAnthropicKey)
    }))

    return NextResponse.json({ 
      providers: providersWithEnvStatus,
      envVarsConfigured: {
        openai: hasOpenAIKey,
        anthropic: hasAnthropicKey
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, provider, model, apiKey, useCases, maxTokens, isActive, isDefault } = body

    if (!name || !provider || !model) {
      return NextResponse.json({ error: 'Name, provider, and model are required' }, { status: 400 })
    }

    // Note: API keys should be stored securely
    // For now, we'll store them in api_key_encrypted field
    // In production, consider using Supabase secrets or encryption functions
    const insertData: any = {
      name,
      provider,
      model,
      use_case: useCases || [],
      max_tokens: maxTokens || 4000,
      is_active: isActive !== false,
      is_default: isDefault || false,
      account_id: currentUser.account_id,
    }

    if (apiKey) {
      // Store API key (in production, encrypt this)
      insertData.api_key_encrypted = apiKey
    }

    const { data: newProvider, error } = await supabase
      .from('llm_providers')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating provider:', error)
      return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true, provider: newProvider }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

