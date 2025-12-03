/**
 * POST /api/admin/users/bulk - Perform bulk operations on users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { hasPermission } from '@/lib/auth/permissions'

// Validation schemas
const bulkOperationSchema = z.object({
  action: z.enum(['ban', 'unban', 'delete', 'activate', 'deactivate', 'change_role']),
  userIds: z.array(z.string().uuid()),
  reason: z.string().optional(),
  newRole: z.enum(['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr']).optional()
})

const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr']),
  account_id: z.string().uuid().optional(),
  password: z.string().min(8).optional(),
  sendInvite: z.boolean().default(true)
})

// Helper function to get authenticated session
async function getAuthenticatedSession(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Get user role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role, account_id')
    .eq('id', user.id)
    .single()

  if (!userData) {
    return null
  }

  return {
    user,
    userRole: userData.role,
    accountId: userData.account_id
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!auth.userRole || !hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    const body = await request.json()
    const validation = bulkOperationSchema.safeParse(body)

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

    const supabase = createClient()
    const { action, userIds, reason, newRole } = validation.data
    const results = []
    const errors = []

    for (const userId of userIds) {
      try {
        // Check if user is protected before any destructive action
        if (action === 'delete') {
          const { data: userToDelete } = await supabase
            .from('users')
            .select('do_not_delete')
            .eq('id', userId)
            .single()

          if (userToDelete?.do_not_delete === true) {
            errors.push({
              userId,
              error: 'This user is protected and cannot be deleted'
            })
            continue
          }
        }

        let updateData: any = {}
        let logMessage = ''

        switch (action) {
          case 'ban':
            updateData = { banned_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() }
            logMessage = `Banned user for 90 days. Reason: ${reason || 'No reason provided'}`
            break

          case 'unban':
            updateData = { banned_until: null }
            logMessage = 'Unbanned user'
            break

          case 'delete':
            // Soft delete by setting deleted_at
            updateData = { deleted_at: new Date().toISOString() }
            logMessage = `Deleted user. Reason: ${reason || 'No reason provided'}`
            break

          case 'activate':
            updateData = { active: true, banned_until: null }
            logMessage = 'Activated user'
            break

          case 'deactivate':
            updateData = { active: false }
            logMessage = `Deactivated user. Reason: ${reason || 'No reason provided'}`
            break

          case 'change_role':
            if (!newRole) {
              errors.push({
                userId,
                error: 'New role is required for role change action'
              })
              continue
            }
            updateData = { role: newRole }
            logMessage = `Changed role to ${newRole}. Reason: ${reason || 'No reason provided'}`
            break
        }

        // Update user
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)

        if (updateError) {
          errors.push({
            userId,
            error: updateError.message
          })
        } else {
          results.push({
            userId,
            action,
            success: true
          })

          // Log the action
          await supabase
            .from('user_activity_logs')
            .insert({
              user_id: userId,
              action: `bulk_${action}`,
              details: logMessage,
              performed_by: auth.user.id,
              performed_at: new Date().toISOString()
            })
        }
      } catch (error: any) {
        errors.push({
          userId,
          error: error.message || 'Unknown error occurred'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed`,
      results,
      errors,
      summary: {
        total: userIds.length,
        successful: results.length,
        failed: errors.length
      }
    })

  } catch (error: any) {
    console.error('Bulk operation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}