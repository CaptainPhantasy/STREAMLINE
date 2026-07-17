import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedSession() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return null

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) return null
  return { user, session }
}
