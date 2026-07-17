import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

const tenancySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  inboundEmailDomain: z.union([z.literal(''), z.string().trim().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i).max(253)]),
  ownerEmail: z.string().trim().email().max(254),
  ownerName: z.string().trim().min(1).max(120),
  password: z.string().min(12).max(128),
})

const logoTypes = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/svg+xml', 'svg'],
])

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * POST /api/admin/tenancies
 * Create a new tenancy with owner account
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedSession()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
              for (const { name, value, options } of cookiesToSet) {
                cookieStore.set(name, value, options)
              }
            } catch {}
          },
        },
      }
    )

    // Check if user is super_admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', auth.user.id)
      .single()

    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only super admins can create tenancies' }, { status: 403 })
    }

    const formData = await request.formData()
    const parsed = tenancySchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      inboundEmailDomain: formData.get('inboundEmailDomain') || '',
      ownerEmail: formData.get('ownerEmail'),
      ownerName: formData.get('ownerName'),
      password: formData.get('password'),
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid tenancy details' }, { status: 400 })
    }
    const { name, slug, inboundEmailDomain, ownerEmail, ownerName, password } = parsed.data

    const logoEntry = formData.get('logo')
    const logoFile = logoEntry instanceof File && logoEntry.size > 0 ? logoEntry : null
    if (logoFile && (!logoTypes.has(logoFile.type) || logoFile.size > 2 * 1024 * 1024)) {
      return NextResponse.json({ error: 'Logo must be a PNG, JPEG, WebP, or SVG no larger than 2 MB' }, { status: 400 })
    }

    const adminClient = getSupabaseAdmin()

    // Check if account with slug already exists
    const { data: existingAccount } = await supabase
      .from('accounts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingAccount) {
      return NextResponse.json({ error: 'Account with this slug already exists' }, { status: 409 })
    }

    // Check if owner email already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingUser = existingUsers.users.find(u => u.email === ownerEmail)

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Upload logo if provided
    let logoUrl: string | null = null
    if (logoFile) {
      // Upload to Supabase Storage (assuming bucket exists)
      const fileName = `${slug}-logo-${crypto.randomUUID()}.${logoTypes.get(logoFile.type)}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, logoFile, {
          contentType: logoFile.type,
          upsert: false,
        })

      if (uploadError || !uploadData) {
        console.error('Error uploading logo:', uploadError)
        return NextResponse.json({ error: 'Logo upload failed' }, { status: 400 })
      }
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
      logoUrl = urlData.publicUrl
    }

    // 1. Create account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        name,
        slug,
        inbound_email_domain: inboundEmailDomain || null,
        settings: {
          branding: logoUrl ? { logo: logoUrl } : {},
        },
      })
      .select()
      .single()

    if (accountError) {
      console.error('Error creating account:', accountError)
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // 2. Create auth user
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true,
    })

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError)
      // Rollback account creation
      await supabase.from('accounts').delete().eq('id', account.id)
      return NextResponse.json({ error: 'Failed to create owner account' }, { status: 500 })
    }

    // 3. Create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        account_id: account.id,
        full_name: ownerName,
        role: 'owner',
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Rollback account and auth user
      await supabase.from('accounts').delete().eq('id', account.id)
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: 'Failed to create owner profile' }, { status: 500 })
    }

    // 4. Copy default LLM providers for this account (if any exist)
    const { data: defaultProviders } = await supabase
      .from('llm_providers')
      .select('*')
      .is('account_id', null)
      .eq('is_active', true)

    if (defaultProviders && defaultProviders.length > 0) {
      const providerInserts = defaultProviders.map(p => ({
        account_id: account.id,
        name: p.name,
        provider: p.provider,
        model: p.model,
        is_default: p.is_default,
        cost_per_1k_tokens: p.cost_per_1k_tokens,
        max_tokens: p.max_tokens,
        use_case: p.use_case,
        is_active: true,
      }))

      await supabase.from('llm_providers').insert(providerInserts)
    }

    return NextResponse.json({
      success: true,
      accountId: account.id,
      message: 'Tenancy created successfully',
    })
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
