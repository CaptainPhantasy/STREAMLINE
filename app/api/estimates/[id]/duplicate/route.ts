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

    // 1. Get Original Estimate with items
    const { data: original, error: getError } = await supabase
      .from('estimates')
      .select('*, estimate_items(*)')
      .eq('id', params.id)
      .single()

    if (getError || !original) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })

    // 2. Generate new number
    const { count } = await supabase
      .from('estimates')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', original.account_id)
    
    const dateStr = new Date().toISOString().slice(0,7).replace('-',''); 
    const newNumber = `EST-${dateStr}-${String((count || 0) + 1).padStart(4, '0')}`

    // 3. Create Duplicate Estimate
    const { data: newEstimate, error: createError } = await supabase
      .from('estimates')
      .insert({
        account_id: original.account_id,
        contact_id: original.contact_id,
        estimate_number: newNumber,
        title: `${original.title} (Copy)`,
        description: original.description,
        subtotal: original.subtotal,
        tax_rate: original.tax_rate,
        tax_amount: original.tax_amount,
        total_amount: original.total_amount,
        status: 'draft', // Reset status
        created_by: user.id,
        notes: original.notes,
        customer_notes: original.customer_notes
      })
      .select()
      .single()

    if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })

    // 4. Duplicate Items
    if (original.estimate_items && original.estimate_items.length > 0) {
      const newItems = original.estimate_items.map((item: any) => ({
        account_id: original.account_id,
        estimate_id: newEstimate.id,
        item_type: item.item_type,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total_price: item.total_price,
        sort_order: item.sort_order
      }))

      await supabase.from('estimate_items').insert(newItems)
    }

    return NextResponse.json(newEstimate)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
