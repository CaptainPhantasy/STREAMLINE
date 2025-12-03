import { NextResponse } from 'next/server'
import { exchangeCodeForTokens, getUserInfo } from '@/lib/gmail/auth'
import { createClient } from '@supabase/supabase-js'
import { encrypt } from '@/lib/gmail/encryption'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=missing_params`
      )
    }

    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    const { userId, accountId } = stateData

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get user info from Google
    const userInfo = await getUserInfo(tokens.accessToken)

    // Store tokens in database (encrypted)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Check if provider already exists
    const { data: existing } = await supabase
      .from('email_providers')
      .select('id')
      .eq('account_id', accountId)
      .eq('provider', 'gmail')
      .eq('user_id', userId)
      .maybeSingle()

    const providerData = {
      account_id: accountId,
      user_id: userId,
      provider: 'gmail',
      provider_email: userInfo.email || '', // Store the user's Gmail address
      is_active: true,
      is_default: false, // User can set as default later
      access_token_encrypted: encrypt(tokens.accessToken),
      refresh_token_encrypted: encrypt(tokens.refreshToken),
      token_expires_at: tokens.expiryDate?.toISOString() || null,
      config: {
        name: userInfo.name,
        picture: userInfo.picture,
      },
    }

    if (existing) {
      // Update existing
      await supabase
        .from('email_providers')
        .update(providerData)
        .eq('id', existing.id)
    } else {
      // Create new
      await supabase
        .from('email_providers')
        .insert(providerData)
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?success=gmail_connected`
    )
  } catch (error: unknown) {
    console.error('Error in Gmail OAuth callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=oauth_failed`
    )
  }
}

