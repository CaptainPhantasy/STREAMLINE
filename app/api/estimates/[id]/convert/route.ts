import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
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
            } catch { }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Get Estimate
    const { data: estimate, error: getError } = await supabase
      .from('estimates')
      .select('*, estimate_items(*)')
      .eq('id', params.id)
      .single()

    if (getError || !estimate) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    // 2. Create Job
    // Assuming 'jobs' table exists and has similar structure
    // We might need to use the `create_job` MCP tool logic here or just insert
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        account_id: estimate.account_id,
        contact_id: estimate.contact_id,
        title: estimate.title || `Job from Estimate ${estimate.estimate_number}`,
        description: estimate.description,
        status: 'scheduled', // Default status
        created_by: user.id
      })
      .select()
      .single()

    if (jobError) return NextResponse.json({ error: 'Failed to create job: ' + jobError.message }, { status: 400 })

    // 3. Link Job to Estimate
    await supabase
      .from('estimates')
      .update({ converted_to_job_id: job.id })
      .eq('id', estimate.id)

    return NextResponse.json({ job_id: job.id, message: 'Converted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
