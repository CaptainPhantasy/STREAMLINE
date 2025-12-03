import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession, createAuthenticatedClient } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/auth/permissions'
import type { UpdateUserRequest, AdminUser } from '@/lib/types/admin-user-management'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validation schemas
const updateUserSchema = z.object({
  full_name: z.string().optional(),
  role: z.enum(['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr']).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  is_active: z.boolean().optional()
})

/**
 * GET /api/admin/users/[id] - Get detailed user information
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

    // Get user from public.users
    let query = supabase
      .from('users')
      .select('*')
      .eq('id', params.id)

    // Non-admin users can only see users in their account
    if (auth.userRole !== 'admin') {
      query = query.eq('account_id', auth.accountId)
    }

    const { data: user, error: userError } = await query.single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get additional user data from auth.users
    const adminClient = getSupabaseAdmin()
    const { data: authUsers } = await adminClient.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.id === params.id)

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Auth user not found' }, { status: 404 })
    }

    // Get user activity logs
    const { data: activityLogs } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', params.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Merge data
    const adminUserDetail: AdminUser = {
      id: user.id,
      account_id: user.account_id,
      email: authUser.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      status: user.banned_until && new Date(user.banned_until) > new Date() ? 'banned' :
              !user.is_active ? 'suspended' :
              !authUser.email_confirmed_at ? 'pending' : 'active',
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: authUser.last_sign_in_at,
      phone: user.phone || authUser.phone,
      department: user.department,
      is_active: user.is_active,
      banned_until: user.banned_until,
      ban_reason: user.ban_reason,
      email_verified: !!authUser.email_confirmed_at,
      email_confirmed_at: authUser.email_confirmed_at,
      phone_confirmed_at: authUser.phone_confirmed_at,
      two_factor_enabled: authUser.user_metadata?.two_factor_enabled || false,
      last_activity_at: activityLogs?.[0]?.created_at || null,
      login_count: activityLogs?.filter(log => log.action === 'login').length || 0,
      failed_login_attempts: activityLogs?.filter(log => log.action === 'login_failed').length || 0
    }

    return NextResponse.json({ success: true, data: adminUserDetail })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/users/[id] - Update user information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId || !auth.session?.access_token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (!hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = updateUserSchema.safeParse(body)

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

    const updateData: UpdateUserRequest = validation.data

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Get user to update
    let query = supabase
      .from('users')
      .select('*')
      .eq('id', params.id)

    // Non-admin users can only update users in their account
    if (auth.userRole !== 'admin') {
      query = query.eq('account_id', auth.accountId)
    }

    const { data: existingUser, error: fetchError } = await query.single()

    if (fetchError || !existingUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Prevent self-modification of certain fields
    if (params.id === auth.user.id) {
      if (updateData.role !== undefined && updateData.role !== auth.userRole) {
        return NextResponse.json({
          success: false,
          error: 'Cannot change your own role'
        }, { status: 400 })
      }

      if (updateData.is_active !== undefined && !updateData.is_active) {
        return NextResponse.json({
          success: false,
          error: 'Cannot deactivate yourself'
        }, { status: 400 })
      }
    }

    // Update user record
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }

    // Update auth user metadata if needed
    const adminClient = getSupabaseAdmin()
    const authMetadata: any = {}

    if (updateData.full_name) {
      authMetadata.full_name = updateData.full_name
    }

    if (updateData.department) {
      authMetadata.department = updateData.department
    }

    if (Object.keys(authMetadata).length > 0) {
      await adminClient.auth.admin.updateUserById(params.id, {
        user_metadata: authMetadata
      })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'user_updated', {
      target_user_id: params.id,
      target_account_id: existingUser.account_id,
      updates: updateData,
      previous_data: {
        role: existingUser.role,
        is_active: existingUser.is_active,
        full_name: existingUser.full_name,
        phone: existingUser.phone,
        department: existingUser.department
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete a user
 */
export async function DELETE(
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

    // Prevent self-deletion
    if (params.id === auth.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete yourself'
      }, { status: 400 })
    }

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Get user to delete (include do_not_delete field)
    let query = supabase
      .from('users')
      .select('*, do_not_delete')
      .eq('id', params.id)

    // Non-admin users can only delete users in their account
    if (auth.userRole !== 'admin') {
      query = query.eq('account_id', auth.accountId)
    }

    const { data: userToDelete, error: fetchError } = await query.single()

    if (fetchError || !userToDelete) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Prevent deletion of protected users (do_not_delete = true)
    if (userToDelete.do_not_delete === true) {
      return NextResponse.json({
        success: false,
        error: 'This user is protected and cannot be deleted. Contact system administrator if this is required.'
      }, { status: 403 })
    }

    // Prevent deletion of other admins unless you're a super admin
    if (userToDelete.role === 'admin' && auth.userRole !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete administrator users'
      }, { status: 403 })
    }

    const adminClient = getSupabaseAdmin()

    // Delete user record first
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting user record:', deleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 })
    }

    // Delete auth user
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(params.id)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete auth user' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'user_deleted', {
      target_user_id: params.id,
      target_account_id: userToDelete.account_id,
      deleted_user_data: {
        email: userToDelete.email,
        role: userToDelete.role,
        full_name: userToDelete.full_name
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
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