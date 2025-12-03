import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ session: null })
  }

  const cookieStore = cookies()

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name, options) {
        cookieStore.delete({ name, ...options })
      },
    },
  })

  // SECURITY: Verify authentication first with getUser(), then get session for token
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('Supabase auth verification error:', userError)
    return NextResponse.json({ session: null }, { status: 401 })
  }

  // Now get session for access token (user is already verified)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Supabase session fetch error:', sessionError)
    return NextResponse.json({ session: null }, { status: 500 })
  }

  return NextResponse.json({ session })
}
