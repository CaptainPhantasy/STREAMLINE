import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession, createAuthenticatedClient } from '@/lib/auth-helper'
import { hasPermission } from '@/lib/auth/permissions'
import type {
  UserStatistics,
  StatisticsPeriod,
  AdminUser
} from '@/lib/types/admin-user-management'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/users/statistics - Get comprehensive user statistics
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!auth.userRole || !auth.accountId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (!hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Parse period parameter
    const { searchParams } = new URL(request.url)
    const period: StatisticsPeriod = (searchParams.get('period') as any) || 'month'
    const accountId = searchParams.get('account_id')

    // Calculate date ranges for the period
    const now = new Date()
    let periodStart: Date
    let comparisonStart: Date
    let comparisonEnd: Date = new Date(now.getTime() - 1) // Yesterday

    switch (period) {
      case 'today':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        comparisonStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
        break
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        comparisonStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        comparisonEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        comparisonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        comparisonEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        periodStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
        comparisonStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
        comparisonEnd = new Date(now.getFullYear(), currentQuarter * 3, 0)
        break
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1)
        comparisonStart = new Date(now.getFullYear() - 1, 0, 1)
        comparisonEnd = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        comparisonStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }

    // Build base user query
    let baseUserQuery = supabase.from('users').select('*')

    // Super Admin can see all stats or filter by account_id
    if (auth.userRole !== 'admin') {
      baseUserQuery = baseUserQuery.eq('account_id', auth.accountId)
    } else if (accountId) {
      baseUserQuery = baseUserQuery.eq('account_id', accountId)
    }

    // Get all users for statistics
    const { data: allUsers, error: usersError } = await baseUserQuery

    if (usersError) {
      console.error('Error fetching users for statistics:', usersError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user statistics'
      }, { status: 500 })
    }

    // Get auth user data for additional metrics
    const adminClient = require('@/lib/admin-auth').getSupabaseAdmin()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()

    const authUserData = authUsers.users.reduce((acc: any, user: any) => {
      acc[user.id] = {
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        phone: user.phone,
        phone_confirmed_at: user.phone_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        created_at: user.created_at,
        user_metadata: user.user_metadata
      }
      return acc
    }, {})

    // Get activity logs for period metrics
    let activityQuery = supabase
      .from('user_activity_logs')
      .select('*')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', now.toISOString())

    if (adminUser.role !== 'admin') {
      activityQuery = activityQuery.eq('account_id', adminUser.account_id)
    } else if (accountId) {
      activityQuery = activityQuery.eq('account_id', accountId)
    }

    const { data: activityLogs } = await activityQuery

    // Get comparison period activity
    let comparisonActivityQuery = supabase
      .from('user_activity_logs')
      .select('*')
      .gte('created_at', comparisonStart.toISOString())
      .lte('created_at', comparisonEnd.toISOString())

    if (adminUser.role !== 'admin') {
      comparisonActivityQuery = comparisonActivityQuery.eq('account_id', adminUser.account_id)
    } else if (accountId) {
      comparisonActivityQuery = comparisonActivityQuery.eq('account_id', accountId)
    }

    const { data: comparisonActivityLogs } = await comparisonActivityQuery

    // Calculate statistics
    const stats: UserStatistics = calculateUserStatistics(
      allUsers || [],
      authUserData,
      activityLogs || [],
      comparisonActivityLogs || [],
      periodStart,
      now
    )

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        period,
        period_start: periodStart.toISOString(),
        period_end: now.toISOString(),
        comparison_start: comparisonStart.toISOString(),
        comparison_end: comparisonEnd.toISOString(),
        total_users: allUsers?.length || 0
      }
    })

  } catch (error) {
    console.error('Unexpected error generating statistics:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error'
    }, { status: 500 })
  }
}

function calculateUserStatistics(
  users: any[],
  authUserData: any,
  activityLogs: any[],
  comparisonActivityLogs: any[],
  periodStart: Date,
  periodEnd: Date
): UserStatistics {
  // Basic counts
  const totalUsers = users.length
  let activeUsers = 0
  let bannedUsers = 0
  let suspendedUsers = 0
  let pendingUsers = 0

  // Role counts
  const roleCounts: Record<string, number> = {}
  const statusCounts: Record<string, number> = {}
  const departmentCounts: Record<string, number> = {}

  // Activity metrics
  let usersWith2FA = 0
  let usersVerifiedEmail = 0
  let newUsersThisPeriod = 0

  users.forEach(user => {
    const authUser = authUserData[user.id]

    // Determine status
    let status: string
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      status = 'banned'
      bannedUsers++
    } else if (!user.is_active) {
      status = 'suspended'
      suspendedUsers++
    } else if (authUser && !authUser.email_confirmed_at) {
      status = 'pending'
      pendingUsers++
    } else {
      status = 'active'
      activeUsers++
    }

    statusCounts[status] = (statusCounts[status] || 0) + 1

    // Role counts
    roleCounts[user.role] = (roleCounts[user.role] || 0) + 1

    // Department counts
    if (user.department) {
      departmentCounts[user.department] = (departmentCounts[user.department] || 0) + 1
    }

    // Check if created in this period
    if (user.created_at >= periodStart.toISOString()) {
      newUsersThisPeriod++
    }

    // Check auth user metrics
    if (authUser) {
      if (authUser.email_confirmed_at) {
        usersVerifiedEmail++
      }

      if (authUser.user_metadata?.two_factor_enabled) {
        usersWith2FA++
      }
    }
  })

  // Activity metrics
  const loginsToday = activityLogs.filter(log =>
    log.action === 'login' &&
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length

  const loginsThisWeek = activityLogs.filter(log =>
    log.action === 'login' &&
    new Date(log.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length

  const loginsThisMonth = activityLogs.filter(log => log.action === 'login').length

  const uniqueActiveToday = new Set(
    activityLogs
      .filter(log =>
        log.action === 'login' &&
        new Date(log.created_at).toDateString() === new Date().toDateString()
      )
      .map(log => log.user_id)
  ).size

  const uniqueActiveThisWeek = new Set(
    activityLogs
      .filter(log =>
        log.action === 'login' &&
        new Date(log.created_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
      .map(log => log.user_id)
  ).size

  const uniqueActiveThisMonth = new Set(
    activityLogs
      .filter(log => log.action === 'login')
      .map(log => log.user_id)
  ).size

  // Security metrics
  const failedLoginsToday = activityLogs.filter(log =>
    log.action === 'login_failed' &&
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length

  const suspiciousActivitiesToday = activityLogs.filter(log =>
    log.action === 'suspicious_activity' &&
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length

  const accountsLockedToday = activityLogs.filter(log =>
    log.action === 'account_locked' &&
    new Date(log.created_at).toDateString() === new Date().toDateString()
  ).length

  // Calculate comparison metrics
  const previousLoginsThisMonth = comparisonActivityLogs.filter(log => log.action === 'login').length
  const loginGrowth = previousLoginsThisMonth > 0
    ? ((loginsThisMonth - previousLoginsThisMonth) / previousLoginsThisMonth) * 100
    : 0

  return {
    total_users: totalUsers,
    active_users: activeUsers,
    banned_users: bannedUsers,
    suspended_users: suspendedUsers,
    pending_users: pendingUsers,

    users_by_role: Object.entries(roleCounts).map(([role, count]) => ({
      role: role as any,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
    })),

    users_by_status: Object.entries(statusCounts).map(([status, count]) => ({
      status: status as any,
      count,
      percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
    })),

    users_by_department: Object.entries(departmentCounts).map(([department, count]) => ({
      department,
      count
    })),

    new_users_this_period: newUsersThisPeriod,
    users_with_2fa: usersWith2FA,
    users_verified_email: usersVerifiedEmail,

    activity_metrics: {
      logins_today: loginsToday,
      logins_this_week: loginsThisWeek,
      logins_this_month: loginsThisMonth,
      active_today: uniqueActiveToday,
      active_this_week: uniqueActiveThisWeek,
      active_this_month: uniqueActiveThisMonth,
      login_growth_percentage: loginGrowth
    },

    security_metrics: {
      failed_login_attempts_today: failedLoginsToday,
      suspicious_activities_today: suspiciousActivitiesToday,
      accounts_locked_today: accountsLockedToday
    }
  }
}