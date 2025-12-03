import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { requireValidToken, isTokenExpiringSoon, refreshAccessToken } from '@/lib/security/jwt-handler'

export async function getAuthenticatedSession(request?: Request) {
  // Support Bearer token authentication with custom JWT validation
  if (request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)

      // First try custom JWT validation
      try {
        const jwtPayload = requireValidToken(token)
        if (jwtPayload) {
          // Custom token is valid, get user info from database
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
                    cookiesToSet.forEach(({ name, value, options }) =>
                      cookieStore.set(name, value, options)
                    )
                  } catch { }
                },
              },
            }
          )

          // Get user details from database
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', jwtPayload.userId)
            .eq('account_id', jwtPayload.accountId)
            .single()

          if (user) {
            return {
              user: {
                id: jwtPayload.userId,
                email: user.email,
                role: jwtPayload.role,
                account_id: jwtPayload.accountId
              },
              session: {
                user: {
                  id: jwtPayload.userId,
                  email: user.email
                },
                access_token: token
              }
            }
          }
        }
      } catch (error) {
        console.error('Custom JWT validation failed, trying Supabase:', error)
      }

      // Fallback to Supabase token validation
      try {
        const supabaseClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        )
        const { data: { user }, error } = await supabaseClient.auth.getUser()
        if (user && !error) {
          // Get user role and account_id
          const { data: userData } = await supabaseClient
            .from('users')
            .select('role, account_id')
            .eq('id', user.id)
            .single()
          
          return { 
            user, 
            session: { user, access_token: token },
            userRole: userData?.role,
            accountId: userData?.account_id
          }
        } else {
          console.error('Supabase getUser error:', error)
        }
      } catch (err) {
        console.error('Error validating Bearer token:', err)
      }
    }
  }

  // Fallback to cookie-based authentication
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { }
        },
      },
    }
  )

  // Use getUser() instead of getSession() for better security
  const { data: { user }, error } = await supabase.auth.getUser()

  if (user && !error) {
    // Get user role and account_id from database in same call
    const { data: userData } = await supabase
      .from('users')
      .select('role, account_id')
      .eq('id', user.id)
      .single()

    // Get the session to include the access token
    const { data: { session } } = await supabase.auth.getSession()

    // Check if token is expiring soon and attempt refresh
    if (session?.access_token && isTokenExpiringSoon(session.access_token)) {
      try {
        const refreshResult = await refreshAccessToken(
          session.refresh_token!,
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        if (refreshResult.success) {
          // Update session with new token
          session.access_token = refreshResult.accessToken
          console.log('Token auto-refreshed for user:', user.id)
        }
      } catch (refreshError) {
        console.error('Auto token refresh failed:', refreshError)
        // Continue with existing token, will expire soon
      }
    }

    if (!session?.access_token) {
      // If no session token, user isn't fully authenticated
      return null
    }

    return { 
      user, 
      session,
      userRole: userData?.role,
      accountId: userData?.account_id
    }
  }

  return null
}

/**
 * Create authenticated Supabase client using access token from session
 */
export function createAuthenticatedClient(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  )
}

/**
 * Validate user has access to specific account
 */
export async function validateAccountAccess(userId: string, accountId: string): Promise<boolean> {
  try {
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', userId)
      .single()

    return user?.account_id === accountId
  } catch (error) {
    console.error('Account access validation error:', error)
    return false
  }
}

/**
 * Get user's account and role information
 */
export async function getUserContext(userId: string): Promise<{
  accountId: string
  role: string
  permissions: string[]
} | null> {
  try {
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
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )

    const { data: user } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', userId)
      .single()

    if (!user) {
      return null
    }

    // Get permissions based on role
    const { hasPermission, getPermissionsForRole } = await import('@/lib/auth/permissions')
    const permissions = getPermissionsForRole(user.role)

    return {
      accountId: user.account_id,
      role: user.role,
      permissions
    }
  } catch (error) {
    console.error('User context retrieval error:', error)
    return null
  }
}

