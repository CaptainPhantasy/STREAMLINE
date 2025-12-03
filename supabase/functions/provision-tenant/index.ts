import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

/**
 * Tenant Provisioning Script
 * Creates a new isolated organization with default settings
 */
async function provisionTenant(
  supabaseUrl: string,
  serviceRoleKey: string,
  tenantData: {
    name: string
    slug: string
    inboundEmailDomain?: string
    ownerEmail: string
    ownerName: string
  }
) {
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // 1. Create account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      name: tenantData.name,
      slug: tenantData.slug,
      inbound_email_domain: tenantData.inboundEmailDomain,
      persona_config: {
        systemPrompt: `You are an AI assistant for ${tenantData.name}.`,
        serviceArea: [],
        pricing: {},
      },
    })
    .select()
    .single()

  if (accountError) throw accountError

  // 2. Create auth user (if not exists)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: tenantData.ownerEmail,
    email_confirm: true,
  })

  if (authError && !authError.message.includes('already registered')) {
    throw authError
  }

  const userId = authUser?.user?.id || (await supabase.auth.admin.getUserByEmail(tenantData.ownerEmail)).data.user?.id

  if (!userId) {
    throw new Error('Failed to create or find user')
  }

  // 3. Create user record
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      id: userId,
      account_id: account.id,
      full_name: tenantData.ownerName,
      role: 'owner',
    })
    .select()
    .single()

  if (userError) throw userError

  // 4. Copy default LLM providers for this account
  const { data: defaultProviders } = await supabase
    .from('llm_providers')
    .select('*')
    .is('account_id', null)
    .eq('is_active', true)

  if (defaultProviders && defaultProviders.length > 0) {
    const accountProviders = defaultProviders.map(p => ({
      ...p,
      id: undefined, // Let it generate new ID
      account_id: account.id,
      api_key_encrypted: '', // Will be set by admin
    }))

    await supabase.from('llm_providers').insert(accountProviders)
  }

  // 5. Log to audit
  await supabase.from('crmai_audit').insert({
    account_id: account.id,
    user_id: userId,
    action: 'tenant_provisioned',
    entity_type: 'account',
    entity_id: account.id,
    new_values: { name: tenantData.name, slug: tenantData.slug },
  })

  return {
    account,
    user,
    message: `Tenant ${tenantData.name} provisioned successfully`,
  }
}

// Edge Function handler
Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const body = await req.json()

    const result = await provisionTenant(supabaseUrl, serviceRoleKey, body)
    
    return new Response(
      JSON.stringify(result),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

