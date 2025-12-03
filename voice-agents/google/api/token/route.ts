/**
 * Voice Token Route for Google Gemini
 *
 * Validates user and provides configuration for Gemini voice agent
 *
 * GET /api/voice/token - Returns API config and user context
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. Get user from auth header
    const authHeader = request.headers.get('authorization')
    let accessToken = authHeader?.replace('Bearer ', '')

    // If no token in header, try to get from query (for development)
    const url = new URL(request.url)
    const tokenQuery = url.searchParams.get('token')
    if (tokenQuery) {
      accessToken = tokenQuery
    }

    if (!accessToken) {
      return Response.json({ error: 'No access token provided' }, { status: 401 })
    }

    // 2. Verify user with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error('[Voice Token] Auth error:', error?.message)
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    // 3. Get account context for system prompt
    const { data: accountUser } = await supabase
      .from('account_users')
      .select('role, account_id')
      .eq('user_id', user.id)
      .single()

    // 4. Return connection configuration
    const config = {
      // For development, we may return the API key directly
      // In production, this should use a server-side token generator
      apiKey: process.env.GOOGLE_GEMINI_API_KEY || null,
      url: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
      model: 'models/gemini-2.0-flash-exp',
      userContext: {
        user_identifier: user.id,
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        user_email: user.email,
        user_role: accountUser?.role || 'tech',
        account_id: accountUser?.account_id || 'default'
      }
    }

    // Log for debugging
    console.log('[Voice Token] Config generated for user:', {
      userId: user.id,
      role: accountUser?.role,
      hasApiKey: !!config.apiKey
    })

    return Response.json(config)

  } catch (error) {
    console.error('[Voice Token] Unexpected error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}