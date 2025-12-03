import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSession, createAuthenticatedClient } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/admin-auth'
import { hasPermission } from '@/lib/auth/permissions'
import type {
  UserSearchParams,
  UserListResponse,
  CreateUserRequest,
  BulkOperation,
  BulkOperationResult
} from '@/lib/types/admin-user-management'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  full_name: z.string().optional(),
  role: z.enum(['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr']),
  phone: z.string().optional(),
  department: z.string().optional(),
  send_invite: z.boolean().default(false),
  account_id: z.string().uuid().optional()
})

const bulkOperationSchema = z.object({
  action: z.enum(['ban', 'unban', 'delete', 'activate', 'deactivate', 'change_role']),
  userIds: z.array(z.string().uuid()).min(1).max(100),
  payload: z.object({
    reason: z.string().optional(),
    duration: z.enum(['permanent', 'temporal']).optional(),
    days: z.number().min(1).max(365).optional(),
    role: z.enum(['owner', 'admin', 'dispatcher', 'tech', 'sales', 'csr']).optional()
  }).optional()
})

/**
 * GET /api/admin/users - Get comprehensive user list with filtering
 */
export async function GET(request: NextRequest) {
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

    const userRole = auth.userRole
    const accountId = auth.accountId

    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const params: UserSearchParams = {
      q: searchParams.get('q') || undefined,
      role: searchParams.get('role') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      account_id: searchParams.get('account_id') || undefined,
      department: searchParams.get('department') || undefined,
      email_verified: searchParams.get('email_verified') === 'true' ? true :
                      searchParams.get('email_verified') === 'false' ? false : undefined,
      two_factor_enabled: searchParams.get('two_factor_enabled') === 'true' ? true :
                          searchParams.get('two_factor_enabled') === 'false' ? false : undefined,
      created_after: searchParams.get('created_after') || undefined,
      created_before: searchParams.get('created_before') || undefined,
      last_active_after: searchParams.get('last_active_after') || undefined,
      last_active_before: searchParams.get('last_active_before') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      sort_by: searchParams.get('sort_by') as any || 'created_at',
      sort_order: searchParams.get('sort_order') as any || 'desc'
    }

    const offset = (params.page! - 1) * params.limit!

    // Build query for public.users
    let usersQuery = supabase
      .from('users')
      .select(`
        id,
        account_id,
        full_name,
        role,
        avatar_url,
        phone,
        department,
        is_active,
        banned_until,
        ban_reason,
        created_at,
        updated_at
      `, { count: 'exact' })

    // For Super Admin, show all users unless account_id is specified
    if (userRole !== 'admin') {
      usersQuery = usersQuery.eq('account_id', accountId)
    } else if (params.account_id) {
      usersQuery = usersQuery.eq('account_id', params.account_id)
    }

    // Apply filters
    if (params.q) {
      usersQuery = usersQuery.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%`)
    }

    if (params.role && !Array.isArray(params.role)) {
      usersQuery = usersQuery.eq('role', params.role)
    }

    if (params.department) {
      usersQuery = usersQuery.eq('department', params.department)
    }

    if (params.created_after) {
      usersQuery = usersQuery.gte('created_at', params.created_after)
    }

    if (params.created_before) {
      usersQuery = usersQuery.lte('created_at', params.created_before)
    }

    // Apply sorting
    usersQuery = usersQuery.order(params.sort_by!, { ascending: params.sort_order === 'asc' })

    // Apply pagination
    usersQuery = usersQuery.range(offset, offset + params.limit! - 1)

    const { data: users, error, count } = await usersQuery

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get additional user data from auth.users
    if (users && users.length > 0) {
      const adminClient = getSupabaseAdmin()
      const userIds = users.map(u => u.id)

      const { data: authUsers } = await adminClient.auth.admin.listUsers()
      const authUserData = authUsers.users.reduce((acc, user) => {
        if (userIds.includes(user.id)) {
          acc[user.id] = {
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            phone: user.phone,
            phone_confirmed_at: user.phone_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
            created_at: user.created_at,
            user_metadata: user.user_metadata,
            app_metadata: user.app_metadata
          }
        }
        return acc
      }, {} as any)

      // Merge data
      users.forEach((user: any) => {
        const authUser = authUserData[user.id]
        if (authUser) {
          user.email = authUser.email
          user.email_verified = !!authUser.email_confirmed_at
          user.email_confirmed_at = authUser.email_confirmed_at
          user.phone = authUser.phone || user.phone
          user.phone_confirmed_at = authUser.phone_confirmed_at
          user.last_sign_in_at = authUser.last_sign_in_at
          user.two_factor_enabled = authUser.user_metadata?.two_factor_enabled || false

          // Determine status
          if (user.banned_until && new Date(user.banned_until) > new Date()) {
            user.status = 'banned'
          } else if (!user.is_active) {
            user.status = 'suspended'
          } else if (!user.email_verified) {
            user.status = 'pending'
          } else {
            user.status = 'active'
          }
        }
      })
    }

    // Get filter statistics
    const filtersData = await getUserFilters(supabase, userRole, accountId)

    const response: UserListResponse = {
      users: users || [],
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit!),
        hasNext: (offset + params.limit!) < (count || 0),
        hasPrev: params.page! > 1
      },
      filters: filtersData
    }

    return NextResponse.json({ success: true, data: response })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/users - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession(request)
    if (!auth || !auth.userRole || !auth.accountId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions
    if (!hasPermission(auth.userRole, 'manage_users')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validation = createUserSchema.safeParse(body)

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

    const userData: CreateUserRequest = validation.data

    // Use access token from authenticated session
    const supabase = createAuthenticatedClient(auth.session.access_token)

    // Determine account_id (Super Admin can specify, others use their own)
    const targetAccountId = auth.userRole === 'admin' && userData.account_id
      ? userData.account_id
      : auth.accountId

    const adminClient = getSupabaseAdmin()

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === userData.email)

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User with this email already exists'
      }, { status: 409 })
    }

    // Generate password if not provided
    const password = userData.password || generateRandomPassword()

    // Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password,
      email_confirm: !userData.send_invite,
      user_metadata: {
        full_name: userData.full_name,
        department: userData.department,
        created_by: auth.user.id,
        two_factor_enabled: false
      }
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 })
    }

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        account_id: targetAccountId,
        full_name: userData.full_name || null,
        role: userData.role,
        phone: userData.phone || null,
        department: userData.department || null,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      // Rollback: delete auth user if user record creation fails
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      console.error('Error creating user record:', userError)
      return NextResponse.json({ success: false, error: 'Failed to create user record' }, { status: 500 })
    }

    // Log admin action
    await logAdminAction(supabase, auth.user.id, 'user_created', {
      target_user_id: user.id,
      target_account_id: targetAccountId,
      user_data: {
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name
      }
    })

    // Send invite email if requested
    if (userData.send_invite) {
      // TODO: Implement invite email sending
      console.log('Invite email would be sent to:', userData.email)
    }

    return NextResponse.json({
      success: true,
      data: {
        user,
        temp_password: userData.password ? undefined : password // Only return generated password
      },
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
