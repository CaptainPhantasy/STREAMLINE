import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seedKnowledgeDocs() {
  console.log('🔍 Agent 3: Seeding Knowledge Docs\n')

  // Get account
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id')
    .eq('slug', '317plumber')
    .limit(1)

  if (!accounts || accounts.length === 0) {
    console.log('❌ No account found')
    return
  }

  const accountId = accounts[0].id

  const knowledgeDocs = [
    {
      title: 'Faucet Repair Guide',
      content: `Common faucet issues and repairs:
1. Leaky faucet: Usually caused by worn O-rings or seals. Replace the cartridge or O-ring.
2. Low water pressure: Check for mineral buildup in aerator. Clean or replace aerator.
3. Dripping faucet: Replace the valve seat or cartridge.
4. Noisy faucet: May indicate loose parts or water hammer. Tighten connections or install water hammer arrestor.

Standard pricing: $89 diagnostic fee (waived if work is done). Most faucet repairs: $150-300.`,
    },
    {
      title: 'Water Heater Maintenance',
      content: `Water heater maintenance and replacement:
1. Annual maintenance: Flush tank, check anode rod, test pressure relief valve.
2. Signs of failure: Rusty water, leaks, insufficient hot water, age over 10 years.
3. Replacement: 50-gallon standard tank: $1,200-1,500 installed.
4. Tankless option: $2,500-4,000 installed, more efficient.

Service area: Indianapolis, Carmel, Fishers, Zionsville.`,
    },
    {
      title: 'Emergency Plumbing Procedures',
      content: `Emergency plumbing procedures:
1. Burst pipe: Shut off main water valve immediately. Call emergency line.
2. Water leak: Turn off water at source, contain leak with towels/buckets.
3. Clogged drain: Try plunger first. Avoid chemical drain cleaners.
4. No hot water: Check circuit breaker for electric heaters, pilot light for gas.

Emergency service: Available 24/7. Response time: 1-2 hours.`,
    },
    {
      title: 'Garbage Disposal Installation',
      content: `Garbage disposal installation and repair:
1. Installation: Requires electrical connection and proper mounting.
2. Common issues: Jams (use hex wrench to manually rotate), leaks (check seals), motor failure.
3. Replacement: Standard unit: $180-250. Installation: 1-2 hours.
4. Maintenance: Run cold water, avoid fibrous foods, use ice cubes to clean.

Warranty: 1 year on parts and labor.`,
    },
  ]

  let created = 0
  let existing = 0

  for (const doc of knowledgeDocs) {
    // Check if exists
    const { data: existingDoc } = await supabase
      .from('knowledge_docs')
      .select('id')
      .eq('title', doc.title)
      .eq('account_id', accountId)
      .single()

    if (existingDoc) {
      existing++
      console.log(`   ⏭️  Exists: ${doc.title}`)
    } else {
      const { error } = await supabase
        .from('knowledge_docs')
        .insert({
          account_id: accountId,
          title: doc.title,
          content: doc.content,
        })

      if (error) {
        console.log(`   ❌ Error: ${doc.title} - ${error.message}`)
      } else {
        created++
        console.log(`   ✅ Created: ${doc.title}`)
      }
    }
  }

  console.log(`\n✅ Summary:`)
  console.log(`   Created: ${created}`)
  console.log(`   Existing: ${existing}`)
  console.log(`   Total: ${created + existing}`)

  if (created > 0) {
    console.log('\n⚠️  Note: Embeddings will be generated when RAG search is used')
    console.log('   The rag-search function will generate embeddings on first use')
  }
}

seedKnowledgeDocs().catch(console.error)

