import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export interface AdminUser {
  id: string
  account_id: string
  full_name: string | null
  role: 'owner' | 'admin' | 'dispatcher' | 'tech' | null
  avatar_url: string | null
}

/**
 * Check if current user is admin (owner or admin role)
 * Returns user if admin, null otherwise
 */
export async function getAdminUser(): Promise<AdminUser | null> {
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Use getUser() for secure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return null
    }

    const { data: userData, error } = await supabase
      .from('users')
      .select('id, account_id, full_name, role, avatar_url')
      .eq('id', user.id)
      .single()

    if (error || !userData) {
      return null
    }

    // Check if user is admin or owner
    if (userData.role === 'admin' || userData.role === 'owner') {
      return userData as AdminUser
    }

    return null
  } catch (error) {
    console.error('Error checking admin access:', error)
    return null
  }
}

/**
 * Get Supabase admin client (service role) for admin operations
 * Use only in server-side admin routes
 */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

