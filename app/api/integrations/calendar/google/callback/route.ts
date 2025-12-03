import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/gmail/encryption'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=missing_params`
      )
    }

    const { accountId, userId } = JSON.parse(state)

    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/calendar/google/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=no_tokens`
      )
    }

    // Get user email from Google
    oauth2Client.setCredentials(tokens)
    const oauth2 = await import('googleapis').then(m => m.google.oauth2({ version: 'v2', auth: oauth2Client }))
    const userInfo = await oauth2.userinfo.get()
    const email = userInfo.data.email || ''

    // Store calendar provider
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if provider already exists
    const { data: existing } = await supabase
      .from('calendar_providers')
      .select('id')
      .eq('account_id', accountId)
      .eq('provider', 'google')
      .eq(userId ? 'user_id' : 'user_id', userId || null)
      .single()

    const providerData = {
      account_id: accountId,
      user_id: userId || null,
      provider: 'google',
      provider_email: email,
      access_token_encrypted: encrypt(tokens.access_token),
      refresh_token_encrypted: encrypt(tokens.refresh_token),
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      is_active: true,
      is_default: true,
    }

    if (existing) {
      await supabase
        .from('calendar_providers')
        .update(providerData)
        .eq('id', existing.id)
    } else {
      await supabase.from('calendar_providers').insert(providerData)
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?success=calendar_connected`
    )
  } catch (error) {
    console.error('Error in Google Calendar callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=callback_failed`
    )
  }
}

