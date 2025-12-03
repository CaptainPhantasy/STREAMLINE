import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * GET /api/estimates/[id]/versions
 * Get all versions of an estimate
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimateId = params.id

    // Get estimate to find parent
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('id, parent_estimate_id, account_id')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Verify account access
    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== estimate.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get parent estimate ID
    const parentId = estimate.parent_estimate_id || estimate.id

    // Get all versions
    const { data: versions, error: versionsError } = await supabase
      .from('estimates')
      .select('*')
      .or(`id.eq.${parentId},parent_estimate_id.eq.${parentId}`)
      .order('version', { ascending: true })

    if (versionsError) {
      console.error('Error fetching versions:', versionsError)
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ versions: versions || [] })
  } catch (error: unknown) {
    console.error('Error fetching estimate versions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/estimates/[id]/versions
 * Create a new version of an estimate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
            } catch {}
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const estimateId = params.id

    // Verify estimate belongs to user's account
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('account_id')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== estimate.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service role to create version
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: newVersionId, error: versionError } = await supabaseAdmin.rpc(
      'create_estimate_version',
      {
        p_estimate_id: estimateId,
        p_account_id: userData.account_id,
      }
    )

    if (versionError) {
      console.error('Error creating version:', versionError)
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      )
    }

    // Get the new version
    const { data: newVersion } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', newVersionId)
      .single()

    return NextResponse.json({ version: newVersion }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating estimate version:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

