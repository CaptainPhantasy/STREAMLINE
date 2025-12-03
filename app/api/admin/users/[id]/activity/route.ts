import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession, createAuthenticatedClient } from '@/lib/auth-helper'
import { hasPermission } from '@/lib/auth/permissions'
import type {
  ActivityLogParams,
  ActivityLogResponse,
  UserActivityLog
} from '@/lib/types/admin-user-management'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/users/[id]/activity - Get user activity logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (!hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Check if target user exists and is accessible
    let userQuery = supabase
      .from('users')
      .select('id, account_id, email, full_name, role')
      .eq('id', params.id)

    // Non-admin users can only view activity for users in their account
    if (auth.userRole !== 'admin') {
      userQuery = userQuery.eq('account_id', auth.accountId)
    }

    const { data: targetUser, error: userError } = await userQuery.single()

    if (userError || !targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const queryParams: ActivityLogParams = {
      user_id: params.id,
      action: searchParams.get('action') as any || undefined,
      resource_type: searchParams.get('resource_type') || undefined,
      admin_id: searchParams.get('admin_id') || undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      sort_order: searchParams.get('sort_order') as any || 'desc'
    }

    const offset = (queryParams.page! - 1) * queryParams.limit!

    // Build activity logs query
    let query = supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', params.id)

    // Apply filters
    if (queryParams.action) {
      if (Array.isArray(queryParams.action)) {
        query = query.in('action', queryParams.action)
      } else {
        query = query.eq('action', queryParams.action)
      }
    }

    if (queryParams.resource_type) {
      query = query.eq('resource_type', queryParams.resource_type)
    }

    if (queryParams.admin_id) {
      query = query.eq('admin_id', queryParams.admin_id)
    }

    if (queryParams.created_after) {
      query = query.gte('created_at', queryParams.created_after)
    }

    if (queryParams.created_before) {
      query = query.lte('created_at', queryParams.created_before)
    }

    // Apply sorting and pagination
    query = query
      .order('created_at', { ascending: queryParams.sort_order === 'asc' })
      .range(offset, offset + queryParams.limit! - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching activity logs:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch activity logs'
      }, { status: 500 })
    }

    // Get additional context data
    const enhancedLogs: UserActivityLog[] = logs?.map(log => ({
      ...log,
      account_id: targetUser.account_id // Add account_id from target user
    })) || []

    // Get statistics for this user
    const { data: statsData } = await supabase
      .from('user_activity_logs')
      .select('action, created_at')
      .eq('user_id', params.id)

    const stats = {
      total_activities: statsData?.length || 0,
      login_count: statsData?.filter(log => log.action === 'login').length || 0,
      failed_login_count: statsData?.filter(log => log.action === 'login_failed').length || 0,
      password_changes: statsData?.filter(log => log.action === 'password_change').length || 0,
      profile_updates: statsData?.filter(log => log.action === 'profile_update').length || 0,
      last_activity: statsData?.[0]?.created_at || null,
      activity_this_week: statsData?.filter(log => {
        const logDate = new Date(log.created_at)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return logDate > weekAgo
      }).length || 0
    }

    const response: ActivityLogResponse = {
      logs: enhancedLogs,
      pagination: {
        page: queryParams.page!,
        limit: queryParams.limit!,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / queryParams.limit!)
      },
      stats,
      user_info: targetUser
    }

    return NextResponse.json({ success: true, data: response })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/users/[id]/activity - Log a manual activity entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (!hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { action, resource_type, resource_id, details } = body

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      }, { status: 400 })
    }

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Check if target user exists and is accessible
    let userQuery = supabase
      .from('users')
      .select('id, account_id')
      .eq('id', params.id)

    // Non-admin users can only log activity for users in their account
    if (auth.userRole !== 'admin') {
      userQuery = userQuery.eq('account_id', auth.accountId)
    }

    const { data: targetUser, error: userError } = await userQuery.single()

    if (userError || !targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Create activity log entry
    const { data: activityLog, error: logError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: params.id,
        action,
        resource_type: resource_type || 'manual',
        resource_id: resource_id || null,
        details: details || {},
        ip_address: 'admin_action', // Indicates this was logged by an admin
        user_agent: 'admin_interface',
        account_id: targetUser.account_id,
        admin_id: auth.user.id,
        admin_action: true
      })
      .select()
      .single()

    if (logError) {
      console.error('Error creating activity log:', logError)
      return NextResponse.json({
        success: false,
        error: 'Failed to create activity log'
      }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'user_activity_logged', {
      target_user_id: params.id,
      target_account_id: targetUser.account_id,
      activity_log_id: activityLog.id,
      activity_data: {
        action,
        resource_type,
        resource_id,
        details
      }
    })

    return NextResponse.json({
      success: true,
      data: activityLog,
      message: 'Activity logged successfully'
    })

  } catch (error) {
    console.error('Unexpected error logging activity:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

// Helper function
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