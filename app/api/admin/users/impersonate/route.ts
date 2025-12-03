import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession, createAuthenticatedClient } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/auth/permissions'
import jwt from 'jsonwebtoken'
import type {
  ImpersonationRequest,
  ImpersonationToken,
  ImpersonationSession
} from '@/lib/types/admin-user-management'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validation schema
const impersonationSchema = z.object({
  target_user_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').optional(),
  duration: z.number().min(1).max(24).default(1) // 1-24 hours
})

/**
 * POST /api/admin/users/impersonate - Start impersonating a user
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check impersonation permissions
    if (!hasPermission(auth.userRole, 'impersonate_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = impersonationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Validation Error',
        validation_errors: validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        }))
      }, { status: 400 })
    }

    const impersonationRequest: ImpersonationRequest = validation.data

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Get target user
    let targetUserQuery = supabase
      .from('users')
      .select(`
        id,
        account_id,
        email,
        full_name,
        role,
        is_active,
        banned_until
      `)
      .eq('id', impersonationRequest.target_user_id)

    // Non-admin users can only impersonate users in their account
    if (auth.userRole !== 'admin') {
      targetUserQuery = targetUserQuery.eq('account_id', auth.accountId)
    }

    const { data: targetUser, error: targetUserError } = await targetUserQuery.single()

    if (targetUserError || !targetUser) {
      return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 })
    }

    // Security checks
    if (!targetUser.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Cannot impersonate inactive user'
      }, { status: 400 })
    }

    if (targetUser.banned_until && new Date(targetUser.banned_until) > new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot impersonate banned user'
      }, { status: 400 })
    }

    // Prevent impersonating other admins unless you're a super admin
    if (targetUser.role === 'admin' && auth.userRole !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Cannot impersonate administrator users'
      }, { status: 403 })
    }

    // Prevent self-impersonation
    if (impersonationRequest.target_user_id === auth.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot impersonate yourself'
      }, { status: 400 })
    }

    // Check for existing active impersonation sessions
    const { data: existingSession } = await supabase
      .from('impersonation_sessions')
      .select('*')
      .eq('admin_id', auth.user.id)
      .eq('is_active', true)
      .single()

    if (existingSession) {
      // End existing session
      await endImpersonationSession(supabase, existingSession.id)
    }

    // Create impersonation session
    const expiresAt = new Date(Date.now() + impersonationRequest.duration * 60 * 60 * 1000).toISOString()

    const { data: session, error: sessionError } = await supabase
      .from('impersonation_sessions')
      .insert({
        admin_id: auth.user.id,
        target_user_id: impersonationRequest.target_user_id,
        target_account_id: targetUser.account_id,
        expires_at: expiresAt,
        is_active: true,
        reason: impersonationRequest.reason || null
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('Error creating impersonation session:', sessionError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create impersonation session'
      }, { status: 500 })
    }

    // Generate impersonation token
    const adminClient = getSupabaseAdmin()
    const { data: targetAuthUser } = await adminClient.auth.admin.getUserById(
      impersonationRequest.target_user_id
    )

    if (!targetAuthUser.user) {
      return NextResponse.json({
        success: false,
        error: 'Target auth user not found'
      }, { status: 404 })
    }

    // Create impersonation JWT token
    const impersonationToken: ImpersonationToken = {
      type: 'impersonation',
      admin_id: auth.user.id,
      target_user_id: impersonationRequest.target_user_id,
      target_account_id: targetUser.account_id,
      expires_at: expiresAt,
      session_id: session.id
    }

    const token = jwt.sign(
      impersonationToken,
      process.env.SUPABASE_JWT_SECRET || 'fallback-secret',
      { expiresIn: `${impersonationRequest.duration}h` }
    )

    // Get impersonation tokens for target user
    const { data: tokens, error: tokensError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: targetAuthUser.user.email!,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/impersonation`
      }
    })

    if (tokensError) {
      console.error('Error generating impersonation tokens:', tokensError)
      return NextResponse.json({
        success: false,
        error: 'Failed to generate impersonation tokens'
      }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'impersonation_started', {
      target_user_id: impersonationRequest.target_user_id,
      target_account_id: targetUser.account_id,
      session_id: session.id,
      reason: impersonationRequest.reason,
      duration_hours: impersonationRequest.duration,
      expires_at: expiresAt
    })

    return NextResponse.json({
      success: true,
      data: {
        session,
        impersonation_token: token,
        access_token: tokens.properties?.access_token,
        refresh_token: tokens.properties?.refresh_token,
        expires_at: expiresAt,
        target_user: {
          id: targetUser.id,
          email: targetAuthUser.user.email,
          full_name: targetUser.full_name,
          role: targetUser.role
        }
      },
      message: 'Impersonation session started successfully'
    })

  } catch (error) {
    console.error('Unexpected error in impersonation:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/impersonate - End impersonation
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Check for active impersonation session
    const { data: activeSession } = await supabase
      .from('impersonation_sessions')
      .select('*')
      .eq('admin_id', auth.user.id)
      .eq('is_active', true)
      .single()

    if (!activeSession) {
      return NextResponse.json({
        success: false,
        error: 'No active impersonation session found'
      }, { status: 404 })
    }

    // End the session
    const { error: endError } = await endImpersonationSession(supabase, activeSession.id)

    if (endError) {
      console.error('Error ending impersonation session:', endError)
      return NextResponse.json({
        success: false,
        error: 'Failed to end impersonation session'
      }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'impersonation_ended', {
      session_id: activeSession.id,
      target_user_id: activeSession.target_user_id,
      target_account_id: activeSession.target_account_id,
      session_duration: Math.floor((new Date().getTime() - new Date(activeSession.created_at).getTime()) / 1000 / 60) // minutes
    })

    return NextResponse.json({
      success: true,
      message: 'Impersonation session ended successfully'
    })

  } catch (error) {
    console.error('Unexpected error ending impersonation:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

/**
 * GET /api/admin/users/impersonate - Get current impersonation status
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
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

    // Check for active impersonation sessions
    const { data: activeSessions } = await supabase
      .from('impersonation_sessions')
      .select(`
        *,
        admin_user:admin_id(id, full_name, email, role),
        target_user:target_user_id(id, full_name, email, role)
      `)
      .eq('admin_id', auth.user.id)
      .eq('is_active', true)

    // Check if we're currently being impersonated
    const { data: beingImpersonated } = await supabase
      .from('impersonation_sessions')
      .select(`
        *,
        admin_user:admin_id(id, full_name, email, role)
      `)
      .eq('target_user_id', auth.user.id)
      .eq('is_active', true)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        active_sessions: activeSessions || [],
        is_impersonating: (activeSessions?.length || 0) > 0,
        is_being_impersonated: !!beingImpersonated,
        impersonation_info: beingImpersonated ? {
          admin_id: beingImpersonated.admin_id,
          admin_name: beingImpersonated.admin_user?.full_name,
          admin_email: beingImpersonated.admin_user?.email,
          started_at: beingImpersonated.created_at,
          expires_at: beingImpersonated.expires_at,
          reason: beingImpersonated.reason
        } : null
      }
    })

  } catch (error) {
    console.error('Unexpected error getting impersonation status:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

// Helper functions
async function endImpersonationSession(supabase: any, sessionId: string) {
  return await supabase
    .from('impersonation_sessions')
    .update({
      is_active: false,
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId)
}

async function logAdminAction(supabase: any, adminId: string, action: string, details: any) {
  try {
    await supabase
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        details,
        ip_address: 'unknown', // TODO: Get from request
        user_agent: 'unknown'  // TODO: Get from request
      })
  } catch (error) {
    console.error('Failed to log admin action:', error)
  }
}