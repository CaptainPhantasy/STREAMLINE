import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/estimates/[id]/signature
 * Get signature for an estimate
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
      .select('account_id')
      .eq('id', user.id)
      .single()

    if (!userData || userData.account_id !== estimate.account_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get signature
    const { data: signature, error: signatureError } = await supabase
      .from('signatures')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single()

    if (signatureError && signatureError.code !== 'PGRST116') {
      console.error('Error fetching signature:', signatureError)
      return NextResponse.json(
        { error: 'Failed to fetch signature' },
        { status: 500 }
      )
    }

    return NextResponse.json({ signature: signature || null })
  } catch (error: unknown) {
    console.error('Error fetching signature:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/estimates/[id]/signature
 * Create signature for an estimate
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

    const estimateId = params.id
    const body = await request.json()
    const { signer_name, signer_email, signature_data } = body

    if (!signer_name || !signature_data) {
      return NextResponse.json(
        { error: 'signer_name and signature_data are required' },
        { status: 400 }
      )
    }

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('account_id')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create signature
    const { data: signature, error: signatureError } = await supabase
      .from('signatures')
      .insert({
        estimate_id: estimateId,
        account_id: estimate.account_id,
        signer_name,
        signer_email: signer_email || null,
        signature_data,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (signatureError) {
      console.error('Error creating signature:', signatureError)
      return NextResponse.json(
        { error: 'Failed to create signature' },
        { status: 500 }
      )
    }

    // Update estimate status to accepted
    await supabase
      .from('estimates')
      .update({ status: 'accepted' })
      .eq('id', estimateId)

    return NextResponse.json({ signature }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating signature:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

