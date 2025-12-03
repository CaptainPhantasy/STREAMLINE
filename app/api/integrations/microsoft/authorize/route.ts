import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { getMicrosoftAuthUrl } from '@/lib/microsoft/auth'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { MicrosoftAuthUrlResponse } from '@/lib/types/microsoft'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request): Promise<NextResponse<MicrosoftAuthUrlResponse>> {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({
        authUrl: '',
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get user's account_id
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
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({
        authUrl: '',
        error: 'User not found'
      }, { status: 404 })
    }

    // Generate state with user and account info
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        accountId: user.account_id,
      })
    ).toString('base64')

    // Generate authorization URL
    const authUrl = await getMicrosoftAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error: unknown) {
    console.error('Error generating Microsoft auth URL:', error)
    return NextResponse.json({
      authUrl: '',
      error: error instanceof Error ? error.message : 'Failed to generate auth URL'
    }, { status: 500 })
  }
}

