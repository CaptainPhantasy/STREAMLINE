import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validation schema
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
  sendEmail: z.boolean().default(false)
})

/**
 * POST /api/admin/users/[id]/reset-password - Reset user password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated session
    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Check admin permissions
    if (!['admin', 'owner'].includes(auth.userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden. Admin access required.'
      }, { status: 403 })
    }

    const userId = params.id

    // Parse request body
    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.issues
      }, { status: 400 })
    }

    const { newPassword, sendEmail } = validation.data

    // Get admin Supabase client
    const supabaseAdmin = getSupabaseAdmin()

    // Get user to reset
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Prevent resetting own password this way
    if (targetUser.id === auth.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot reset your own password through admin panel. Use profile settings instead.'
      }, { status: 400 })
    }

    // Reset password in auth.users
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (resetError) {
      console.error('Password reset error:', resetError)
      return NextResponse.json({
        success: false,
        error: 'Failed to reset password'
      }, { status: 500 })
    }

    // Log the password reset
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        user_id: auth.user.id,
        action: 'password_reset',
        target_user_id: userId,
        details: {
          target_email: targetUser.email,
          method: 'admin_reset',
          send_email: sendEmail
        },
        ip_address: request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'
      })

    // Optionally send email notification
    if (sendEmail && targetUser.email) {
      // TODO: Implement email sending
      console.log(`Password reset email would be sent to: ${targetUser.email}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name
      }
    })

  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}