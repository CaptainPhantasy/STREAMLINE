import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * POST /api/estimates/[id]/track-view
 * Track when customer views an estimate
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

    // Verify estimate exists
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('id, view_count')
      .eq('id', estimateId)
      .single()

    if (estimateError || !estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
    }

    // Update view tracking
    const { error: updateError } = await supabase
      .from('estimates')
      .update({
        viewed_at: new Date().toISOString(),
        view_count: (estimate.view_count || 0) + 1,
      })
      .eq('id', estimateId)

    if (updateError) {
      console.error('Error tracking view:', updateError)
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error tracking estimate view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

