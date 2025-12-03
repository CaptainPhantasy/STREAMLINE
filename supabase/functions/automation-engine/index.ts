import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Automation Rules Engine
// Monitors conversations and triggers actions based on rules

interface AutomationRule {
  id: string
  account_id: string
  name: string
  trigger: 'unreplied_time' | 'status_change' | 'keyword' | 'sentiment'
  trigger_config: Record<string, any>
  action: 'create_draft' | 'assign_tech' | 'send_notification' | 'create_job'
  action_config: Record<string, any>
  is_active: boolean
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get all active automation rules
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true)

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active automation rules found' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const results: any[] = []

    for (const rule of rules) {
      let triggered = false

      // Check trigger conditions
      if (rule.trigger === 'unreplied_time') {
        const minutes = rule.trigger_config.minutes || 15
        const { data: conversations } = await supabase
          .from('conversations')
          .select('*')
          .eq('account_id', rule.account_id)
          .eq('status', 'open')
          .eq('last_message_direction', 'inbound')
          .lt('last_message_at', new Date(Date.now() - minutes * 60 * 1000).toISOString())
          .limit(10)

        if (conversations && conversations.length > 0) {
          triggered = true
          
          // Execute action
          if (rule.action === 'create_draft') {
            for (const conv of conversations) {
              const draftRes = await fetch(`${supabaseUrl}/functions/v1/generate-reply`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${serviceRoleKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  accountId: rule.account_id,
                  conversationId: conv.id,
                  useCase: 'draft',
                }),
              })
              
              if (draftRes.ok) {
                const draftData = await draftRes.json()
                // Mark conversation as needs_review
                await supabase
                  .from('conversations')
                  .update({ status: 'needs_review' })
                  .eq('id', conv.id)
                
                results.push({
                  rule: rule.name,
                  action: 'draft_created',
                  conversationId: conv.id,
                })
              }
            }
          }
        }
      } else if (rule.trigger === 'status_change') {
        // Monitor job status changes
        const targetStatus = rule.trigger_config.target_status
        if (targetStatus === 'completed') {
          // This would be triggered by a database trigger or webhook
          // For now, we'll handle it in the update-job-status function
        }
      }

      if (triggered) {
        // Log automation execution
        await supabase.from('crmai_audit').insert({
          account_id: rule.account_id,
          action: 'automation_triggered',
          entity_type: 'automation_rule',
          entity_id: rule.id,
          new_values: { rule_name: rule.name, trigger: rule.trigger },
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        rules_checked: rules.length,
        actions_taken: results.length,
        results 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Automation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

