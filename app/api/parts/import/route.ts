import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseCSV } from '@/lib/csv'

type PartInsert = {
  account_id: string
  sku?: string
  name?: string
  description?: string
  category?: string
  unit?: string
  unit_price?: number
  quantity_in_stock?: number
  reorder_threshold?: number
  supplier_name?: string
  supplier_sku?: string
  supplier_contact?: string
  notes?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/parts/import
 * Import parts from CSV/PDF/text file with AI parsing
 */
export async function POST(request: NextRequest) {
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
            } catch { }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('account_id, role')
      .eq('id', user.id)
      .single()

    if (!userData?.account_id && userData?.role !== 'super_admin') {
      return NextResponse.json({ error: 'User has no account' }, { status: 400 })
    }

    const formData = await request.formData()
    const fileEntry = formData.get('file')
    const file = fileEntry instanceof File ? fileEntry : null
    const accountId = formData.get('account_id') as string | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Provide a CSV file no larger than 5 MB' }, { status: 400 })
    }

    const targetAccountId = userData.role === 'super_admin' && accountId 
      ? accountId 
      : userData.account_id

    if (!targetAccountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Read file content
    const fileContent = await file.text()
    const rows = parseCSV(fileContent)
    if (rows.length < 2 || rows.length > 5_001) {
      return NextResponse.json({ error: 'CSV must contain a header and between 1 and 5,000 data rows' }, { status: 400 })
    }
    const [headers, ...dataRows] = rows
    const parsedParts: PartInsert[] = []

    for (const values of dataRows) {
        const part: PartInsert = {
          account_id: targetAccountId,
        }
        
        headers.forEach((header, idx) => {
          const value = values[idx] || ''
          const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_')
          
          switch (normalizedHeader) {
            case 'sku':
              part.sku = value || undefined
              break
            case 'name':
              part.name = value
              break
            case 'description':
              part.description = value || undefined
              break
            case 'category':
              part.category = value || 'other'
              break
            case 'unit':
              part.unit = value || 'each'
              break
            case 'unit_price':
            case 'price':
              part.unit_price = Math.round(parseFloat(value || '0') * 100) // Convert to cents
              break
            case 'quantity_in_stock':
            case 'quantity':
            case 'stock':
              part.quantity_in_stock = parseInt(value || '0', 10)
              break
            case 'reorder_threshold':
            case 'threshold':
              part.reorder_threshold = parseInt(value || '0', 10)
              break
            case 'supplier_name':
            case 'supplier':
              part.supplier_name = value || undefined
              break
            case 'supplier_sku':
              part.supplier_sku = value || undefined
              break
            case 'supplier_contact':
              part.supplier_contact = value || undefined
              break
            case 'notes':
              part.notes = value || undefined
              break
          }
        })
        
        if (part.name) {
          parsedParts.push(part)
        }
    }

    if (parsedParts.length === 0) {
      return NextResponse.json({ error: 'No parts found in file' }, { status: 400 })
    }

    // Insert parts in batch
    const { data: insertedParts, error: insertError } = await supabase
      .from('parts')
      .insert(parsedParts)
      .select()

    if (insertError) {
      console.error('Error inserting parts:', insertError)
      return NextResponse.json(
        { error: 'Failed to import parts' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: insertedParts.length,
      parts: insertedParts
    })
  } catch (error: unknown) {
    console.error('Error importing parts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
