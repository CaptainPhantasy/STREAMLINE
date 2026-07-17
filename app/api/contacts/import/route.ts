import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { parseCSV } from '@/lib/csv'

type ContactInsert = {
  account_id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string
  company?: string
  tags?: string[]
  status?: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/contacts/import
 * Import contacts from CSV/PDF/text file with AI parsing
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
    const [headerRow, ...dataRows] = rows
    const headers = headerRow.map(header => header.toLowerCase().replace(/\s+/g, '_'))
    const parsedContacts: ContactInsert[] = []

    for (const values of dataRows) {
        const contact: ContactInsert = {
          account_id: targetAccountId,
        }
        
        headers.forEach((header, idx) => {
          const value = values[idx] || ''
          const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_')
          
          switch (normalizedHeader) {
            case 'first_name':
            case 'firstname':
            case 'fname':
              contact.first_name = value
              break
            case 'last_name':
            case 'lastname':
            case 'lname':
              contact.last_name = value
              break
            case 'email':
              contact.email = value
              break
            case 'phone':
            case 'phone_number':
            case 'telephone':
              contact.phone = value || undefined
              break
            case 'address':
              contact.address = value || undefined
              break
            case 'company':
            case 'company_name':
              contact.company = value || undefined
              break
            case 'tags':
              contact.tags = value ? value.split(';').map((t: string) => t.trim()).filter(Boolean) : []
              break
            case 'status':
              contact.status = value || undefined
              break
          }
        })
        
        if (contact.first_name || contact.email) {
          parsedContacts.push(contact)
        }
    }

    if (parsedContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found in file' }, { status: 400 })
    }

    // Insert contacts in batch
    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(parsedContacts)
      .select()

    if (insertError) {
      console.error('Error inserting contacts:', insertError)
      return NextResponse.json(
        { error: 'Failed to import contacts' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: insertedContacts.length,
      contacts: insertedContacts
    })
  } catch (error: unknown) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
