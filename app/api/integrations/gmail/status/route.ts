import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { GmailStatusResponse } from '@/lib/types/gmail'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request): Promise<NextResponse<GmailStatusResponse>> {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({
        connected: false,
        error: 'Unauthorized'
      }, { status: 401 })
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
            } catch {}
          },
        },
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({
        connected: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Get Gmail providers for this account
    const { data: providers, error } = await supabase
      .from('email_providers')
      .select('id, provider_email, is_active, is_default, created_at, user_id')
      .eq('account_id', user.account_id)
      .eq('provider', 'gmail')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching Gmail providers:', error)
      return NextResponse.json({
        connected: false,
        error: 'Failed to fetch providers'
      }, { status: 500 })
    }

    return NextResponse.json({
      connected: (providers || []).length > 0,
      providers: providers || [],
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/integrations/gmail/status:', error)
    return NextResponse.json({
      connected: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

