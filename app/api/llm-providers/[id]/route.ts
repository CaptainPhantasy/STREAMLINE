import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'

type RouteContext = {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'owner')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, provider, model, apiKey, useCases, maxTokens, isActive, isDefault } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (provider !== undefined) updateData.provider = provider
    if (model !== undefined) updateData.model = model
    if (useCases !== undefined) updateData.use_case = useCases
    if (maxTokens !== undefined) updateData.max_tokens = maxTokens
    if (isActive !== undefined) updateData.is_active = isActive
    if (isDefault !== undefined) updateData.is_default = isDefault
    if (apiKey !== undefined && apiKey !== '') {
      // Update API key (in production, encrypt this)
      updateData.api_key_encrypted = apiKey
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updatedProvider, error } = await supabase
      .from('llm_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !updatedProvider) {
      console.error('Error updating provider:', error)
      return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true, provider: updatedProvider })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

