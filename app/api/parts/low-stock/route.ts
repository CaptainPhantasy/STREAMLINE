import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    const { data: userData } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', user.id)
      .single()

    // Use RPC or raw query if possible, else fetch all and filter. 
    // Since we don't have the rpc guaranteed, and filtering in JS is already done in main route,
    // let's just do the JS filter here too but only return those.
    
    const { data: parts, error } = await supabase
      .from('parts')
      .select('*')
      .eq('account_id', userData.account_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const lowStockParts = (parts || []).filter(p => p.quantity_in_stock <= p.reorder_threshold)

    return NextResponse.json(lowStockParts)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
