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

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const validStatuses = ['open', 'closed', 'snoozed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 })
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error || !conversation) {
      console.error('Error updating conversation:', error)
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversation })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

