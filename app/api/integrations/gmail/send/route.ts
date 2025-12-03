import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendGmailEmail } from '@/lib/gmail/service'
import { refreshAccessToken } from '@/lib/gmail/auth'
import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/lib/gmail/encryption'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { to, subject, html, text, replyTo, inReplyTo, references, accountId, userId } = body

    if (!to || !subject) {
      return NextResponse.json({ error: 'Missing required fields: to, subject' }, { status: 400 })
    }

    // Get Gmail provider for account/user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const cookieStore = await cookies()
    const clientSupabase = createServerClient(
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

    // Get user's account_id if not provided
    let targetAccountId = accountId
    if (!targetAccountId) {
      const { data: user } = await clientSupabase
        .from('users')
        .select('account_id')
        .eq('id', session.user.id)
        .single()
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      targetAccountId = user.account_id
    }

    // Get Gmail provider
    let query = supabase
      .from('email_providers')
      .select('*')
      .eq('account_id', targetAccountId)
      .eq('provider', 'gmail')
      .eq('is_active', true)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.is('user_id', null) // Account-level provider
    }

    const { data: providers, error: providerError } = await query

    if (providerError || !providers || providers.length === 0) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect your Gmail account first.' },
        { status: 400 }
      )
    }

    const provider = providers[0]

    // Decrypt tokens
    let accessToken = decrypt(provider.access_token_encrypted)
    const refreshToken = decrypt(provider.refresh_token_encrypted)

    // Check if token is expired
    const expiresAt = provider.token_expires_at ? new Date(provider.token_expires_at) : null
    const now = new Date()
    
    if (expiresAt && expiresAt <= now) {
      // Refresh token
      const refreshed = await refreshAccessToken(refreshToken)
      accessToken = refreshed.accessToken
      
      // Update stored token
      const encryptedAccess = encrypt(refreshed.accessToken)
      await supabase
        .from('email_providers')
        .update({
          access_token_encrypted: encryptedAccess,
          token_expires_at: refreshed.expiryDate?.toISOString() || null,
        })
        .eq('id', provider.id)
    }

    // Send email via Gmail
    const result = await sendGmailEmail(accessToken, refreshToken, {
      to,
      subject,
      html,
      text,
      replyTo,
      inReplyTo,
      references,
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
    })
  } catch (error: unknown) {
    console.error('Error sending Gmail:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    )
  }
}

