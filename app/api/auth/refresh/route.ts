import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/api-middleware'
import { refreshAccessToken } from '@/lib/security/jwt-handler'

async function handleTokenRefresh(request: NextRequest, context: any) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const result = await refreshAccessToken(
      refreshToken,
      supabaseUrl,
      supabaseServiceKey
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Set secure HTTP-only cookie with new access token
    const response = NextResponse.json({
      success: true,
      expiresAt: result.expiresAt
    })

    response.cookies.set('access_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    console.log(`Token refreshed for user from session context`)

    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    handleTokenRefresh,
    {
      requireAuth: false, // Refresh endpoint doesn't require valid session
      rateLimit: 'auth', // Strict rate limiting for auth endpoints
      allowedMethods: ['POST'],
      enableCORS: true,
      maxFileSize: 1024 // Small limit for JSON requests
    }
  )
}