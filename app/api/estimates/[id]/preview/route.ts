import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/estimates/[id]/preview
 * Get customer-facing estimate preview (public access with token)
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

    const estimateId = params.id
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token') // Optional preview token

    // Get estimate with contact info
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*, contact:contacts(*)')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Verify token if provided (for public preview)
    // TODO: Implement token verification if needed

    // Get signature if exists
    const { data: signature } = await supabase
      .from('signatures')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('signed_at', { ascending: false })
      .limit(1)
      .single()
      .catch(() => ({ data: null }))

    return NextResponse.json({
      estimate: {
        id: estimate.id,
        status: estimate.status,
        total_amount: estimate.total_amount,
        line_items: estimate.line_items,
        notes: estimate.notes,
        created_at: estimate.created_at,
        contact: estimate.contact,
      },
      signature: signature || null,
    })
  } catch (error: unknown) {
    console.error('Error fetching estimate preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

