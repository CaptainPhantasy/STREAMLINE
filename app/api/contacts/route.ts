import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const contactSchema = z.object({
  email: z.string().trim().email().max(254),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
})

async function authenticatedAccount() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('account_id')
    .eq('id', user.id)
    .single()
  if (!profile?.account_id) return null
  return { supabase, accountId: profile.account_id as string }
}

export async function GET() {
  const auth = await authenticatedAccount().catch(() => null)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Service is not configured' }, { status: 503 })
  }
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await auth.supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, address')
    .eq('account_id', auth.accountId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Unable to load contacts' }, { status: 500 })
  return NextResponse.json({ contacts: data })
}

export async function POST(request: NextRequest) {
  const auth = await authenticatedAccount().catch(() => null)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Service is not configured' }, { status: 503 })
  }
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = contactSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid contact data' }, { status: 400 })
  }

  const contact = parsed.data
  const { data, error } = await auth.supabase
    .from('contacts')
    .insert({
      account_id: auth.accountId,
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName || null,
      phone: contact.phone || null,
      address: contact.address || null,
    })
    .select('id, first_name, last_name, email, phone, address')
    .single()

  if (error) return NextResponse.json({ error: 'Unable to create contact' }, { status: 400 })
  return NextResponse.json({ contact: data }, { status: 201 })
}
