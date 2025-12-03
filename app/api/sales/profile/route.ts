import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => cookies.forEach(c => cookieStore.set(c.name, c.value, c.options)),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, full_name, email, phone, role, avatar_url, account_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch stats for this sales rep
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // Get meetings count
  const { data: meetings } = await supabase
    .from('meetings')
    .select('id, sentiment')
    .eq('user_id', user.id)
    .gte('scheduled_at', monthStart.toISOString())

  const meetingsHeld = meetings?.length || 0
  const positiveMeetings = meetings?.filter(m => m.sentiment === 'positive' || m.sentiment === 'mixed').length || 0

  // Get estimates created
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, status, total_amount')
    .eq('created_by', user.id)
    .gte('created_at', monthStart.toISOString())

  const estimatesCreated = estimates?.length || 0
  const estimatesApproved = estimates?.filter(e => e.status === 'approved').length || 0

  // Calculate close rate
  const closeRate = estimatesCreated > 0
    ? Math.round((estimatesApproved / estimatesCreated) * 100)
    : 0

  // Calculate total sales value
  const totalSales = estimates
    ?.filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + (e.total_amount || 0), 0) || 0

  return NextResponse.json({
    user: {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      role: profile.role,
      avatarUrl: profile.avatar_url,
    },
    stats: {
      meetingsHeld,
      positiveMeetings,
      estimatesCreated,
      estimatesApproved,
      closeRate,
      totalSales,
    }
  })
}
