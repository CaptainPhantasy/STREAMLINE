import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId, material_name, quantity, unit, unit_cost, supplier, notes } = body

    if (!jobId || !material_name) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, material_name' },
        { status: 400 }
      )
    }

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    // Get account_id from job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('account_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Calculate total_cost
    const totalCost = unit_cost && quantity ? Math.round(unit_cost * quantity) : null

    // Create material record
    const { data: material, error } = await supabase
      .from('job_materials')
      .insert({
        account_id: job.account_id,
        job_id: jobId,
        material_name,
        quantity: quantity || 1,
        unit: unit || 'each',
        unit_cost: unit_cost || null,
        total_cost: totalCost,
        supplier: supplier || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material:', error)
      return NextResponse.json({ error: 'Failed to add material' }, { status: 500 })
    }

    return NextResponse.json({ material })
  } catch (error: unknown) {
    console.error('Error in POST /api/job-materials:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 })
    }

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
        global: {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      }
    )

    const { data: materials, error } = await supabase
      .from('job_materials')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching materials:', error)
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }

    return NextResponse.json({ materials: materials || [] })
  } catch (error: unknown) {
    console.error('Error in GET /api/job-materials:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

