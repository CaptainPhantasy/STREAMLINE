/**
 * AI Inbox Router
 * Routes conversations to appropriate users based on content analysis
 */

import { createClient } from '@supabase/supabase-js'

interface RoutingContext {
  conversationId: string
  accountId: string
  messageContent: string
  messageSubject?: string
  contactId?: string
}

interface RoutingResult {
  recommendedUserId: string | null
  confidence: number
  reasoning: string
  alternativeUsers?: Array<{
    userId: string
    confidence: number
    reasoning: string
  }>
}

/**
 * Route conversation using AI analysis
 * This is a placeholder - integrate with your LLM provider
 */
export async function routeConversation(
  context: RoutingContext
): Promise<RoutingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get available users in the account
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, full_name, role')
    .eq('account_id', context.accountId)
    .in('role', ['owner', 'admin', 'dispatcher', 'tech', 'sales'])

  if (usersError || !users || users.length === 0) {
    return {
      recommendedUserId: null,
      confidence: 0,
      reasoning: 'No users available for routing',
    }
  }

  // Get conversation history for context
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', context.conversationId)
    .order('created_at', { ascending: false })
    .limit(10)

  // Analyze message content for keywords and intent
  const content = (context.messageContent || '').toLowerCase()
  const subject = (context.messageSubject || '').toLowerCase()

  // Simple keyword-based routing (replace with AI model)
  const routingRules = [
    {
      keywords: ['urgent', 'emergency', 'broken', 'not working', 'down'],
      roles: ['owner', 'admin', 'dispatcher'],
      priority: 1,
    },
    {
      keywords: ['quote', 'estimate', 'price', 'cost', 'pricing'],
      roles: ['sales', 'admin'],
      priority: 2,
    },
    {
      keywords: ['schedule', 'appointment', 'booking', 'when'],
      roles: ['dispatcher', 'admin'],
      priority: 2,
    },
    {
      keywords: ['payment', 'invoice', 'bill', 'charge'],
      roles: ['admin', 'owner'],
      priority: 2,
    },
    {
      keywords: ['technical', 'repair', 'fix', 'install'],
      roles: ['tech', 'dispatcher'],
      priority: 2,
    },
  ]

  // Score each user based on keywords and role
  const userScores = users.map((user) => {
    let score = 0
    const reasons: string[] = []

    for (const rule of routingRules) {
      const hasKeyword = rule.keywords.some(
        (keyword) => content.includes(keyword) || subject.includes(keyword)
      )

      if (hasKeyword && rule.roles.includes(user.role || '')) {
        score += rule.priority * 10
        reasons.push(`Matched keywords for ${user.role} role`)
      }
    }

    // Boost score for dispatchers (default routing)
    if (user.role === 'dispatcher') {
      score += 5
      reasons.push('Default dispatcher routing')
    }

    return {
      userId: user.id,
      score,
      reasons,
      user,
    }
  })

  // Sort by score and get top recommendation
  userScores.sort((a, b) => b.score - a.score)
  const topMatch = userScores[0]

  // Calculate confidence (0-100)
  const maxPossibleScore = Math.max(...userScores.map((u) => u.score), 1)
  const confidence = Math.min(100, Math.round((topMatch.score / maxPossibleScore) * 100))

  // Get alternative users
  const alternatives = userScores
    .slice(1, 4)
    .map((u) => ({
      userId: u.userId,
      confidence: Math.min(100, Math.round((u.score / maxPossibleScore) * 100)),
      reasoning: u.reasons.join('; '),
    }))

  return {
    recommendedUserId: topMatch.userId,
    confidence,
    reasoning: topMatch.reasons.join('; ') || 'Default routing based on role',
    alternativeUsers: alternatives.length > 0 ? alternatives : undefined,
  }
}

/**
 * Apply AI routing to a conversation
 */
export async function applyAIRouting(
  conversationId: string,
  accountId: string
): Promise<RoutingResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get conversation and latest message
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('id', conversationId)
    .single()

  if (!conversation) {
    throw new Error('Conversation not found')
  }

  const latestMessage = conversation.messages?.[0]

  if (!latestMessage) {
    throw new Error('No messages found in conversation')
  }

  // Route conversation
  const routing = await routeConversation({
    conversationId,
    accountId,
    messageContent: latestMessage.body_text || latestMessage.body_html || '',
    messageSubject: latestMessage.subject || undefined,
    contactId: conversation.contact_id || undefined,
  })

  // Update conversation with routing
  if (routing.recommendedUserId) {
    await supabase
      .from('conversations')
      .update({
        ai_routed_to: routing.recommendedUserId,
        routing_confidence: routing.confidence,
        assigned_to: routing.recommendedUserId, // Auto-assign if confidence is high
      })
      .eq('id', conversationId)
  }

  return routing
}

