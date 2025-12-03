import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tech/materials/quick-add
 * Quick-add materials to a job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, name, description, quantity, unit, cost, barcode, category } = body

    // Validate required fields
    if (!jobId || !name || !quantity) {
      return NextResponse.json(
        { error: 'jobId, name, and quantity are required' },
        { status: 400 }
      )
    }

    // Check if material exists in catalog
    const { data: existingMaterial } = await supabase
      .from('materials')
      .select('*')
      .eq('name', name)
      .single()

    let materialId = existingMaterial?.id

    // If material doesn't exist, create it
    if (!existingMaterial) {
      const { data: newMaterial, error: createError } = await supabase
        .from('materials')
        .insert({
          name,
          description: description || null,
          unit: unit || 'each',
          cost: cost || null,
          barcode: barcode || null,
          category: category || null,
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create material:', createError)
        return NextResponse.json(
          { error: 'Failed to create material' },
          { status: 500 }
        )
      }

      materialId = newMaterial.id
    }

    // Add material to job
    const { data: jobMaterial, error: addError } = await supabase
      .from('job_materials')
      .insert({
        job_id: jobId,
        material_id: materialId,
        quantity,
        unit: unit || existingMaterial?.unit || 'each',
        cost: cost || existingMaterial?.cost || null,
        added_by: user.id,
        added_at: new Date().toISOString(),
      })
      .select(`
        *,
        material:materials(*)
      `)
      .single()

    if (addError) {
      console.error('Failed to add material to job:', addError)
      return NextResponse.json(
        { error: 'Failed to add material to job' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      material: jobMaterial,
      jobId,
    })
  } catch (error) {
    console.error('Materials quick-add API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tech/materials/quick-add?userId=xxx
 * Get recent materials for a user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recent materials used by this user
    const { data: recentMaterials, error: fetchError } = await supabase
      .from('job_materials')
      .select(`
        *,
        material:materials(*)
      `)
      .eq('added_by', user.id)
      .order('added_at', { ascending: false })
      .limit(20)

    if (fetchError) {
      console.error('Failed to fetch recent materials:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch recent materials' },
        { status: 500 }
      )
    }

    // Group and deduplicate by material
    const uniqueMaterials = Array.from(
      new Map(
        recentMaterials.map((jm) => [
          jm.material.id,
          {
            id: jm.material.id,
            name: jm.material.name,
            description: jm.material.description,
            quantity: jm.quantity,
            unit: jm.unit,
            cost: jm.cost,
            barcode: jm.material.barcode,
            category: jm.material.category,
          },
        ])
      ).values()
    )

    return NextResponse.json({
      materials: uniqueMaterials,
    })
  } catch (error) {
    console.error('Materials quick-add API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
