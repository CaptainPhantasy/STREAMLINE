import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Only try to sign out if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

      await supabase.auth.signOut()
    }

    // Clear all auth-related cookies manually
    const response = NextResponse.json({ success: true })
    
    // Clear common Supabase cookie names
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'sb-auth-token',
    ]
    
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
      })
    })

    return response
  } catch (error) {
    console.error('Error signing out:', error)
    // Still return success and clear cookies even on error
    const response = NextResponse.json({ success: true })
    response.cookies.set('sb-access-token', '', { expires: new Date(0), path: '/' })
    response.cookies.set('sb-refresh-token', '', { expires: new Date(0), path: '/' })
    return response
  }
}

