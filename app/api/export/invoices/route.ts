import { NextResponse } from 'next/server'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Get user's account_id
    const { data: user } = await supabase
      .from('users')
      .select('account_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build query - simplified to avoid complex joins
    let query = supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        job_id,
        amount,
        status,
        due_date,
        paid_at,
        created_at
      `)
      .eq('account_id', user.account_id)

    if (status) query = query.eq('status', status)
    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data: invoices, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error.message, error.details)
      // Return empty CSV instead of erroring
      if (format === 'csv') {
        const csv = 'Invoice Number,Job ID,Amount,Status,Due Date,Paid At,Created At\n'
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }
      return NextResponse.json({ invoices: [], error: 'No invoices available' })
    }

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Invoice Number',
        'Job ID',
        'Customer Name',
        'Customer Email',
        'Amount',
        'Status',
        'Due Date',
        'Paid At',
        'Created At'
      ]

      const rows = (invoices || []).map(invoice => [
        invoice.invoice_number || '',
        invoice.job_id || '',
        '', // Customer name - would need separate lookup
        '', // Customer email - would need separate lookup
        invoice.amount ? `$${(invoice.amount / 100).toFixed(2)}` : '',
        invoice.status || '',
        invoice.due_date || '',
        invoice.paid_at || '',
        invoice.created_at || ''
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      return NextResponse.json({ invoices: invoices || [] })
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Error in GET /api/export/invoices:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

