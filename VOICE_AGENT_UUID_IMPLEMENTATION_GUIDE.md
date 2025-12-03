# Voice Agent UUID Implementation Guide

**Purpose:** Complete implementation guide for fixing the voice agent memory system by properly injecting user context from Supabase authentication.

**Version:** 1.0
**Last Updated:** November 28, 2025

---

## Problem Analysis

From the transcript analysis, the voice agent cannot:
1. Identify who it's talking to
2. Access user's UUID
3. Use memory tools (read_agent_memory, update_agent_memory)
4. Provide personalized experience

## Root Cause

The `VoiceConversationProvider` in `/components/voice-conversation-provider.tsx` does NOT:
- Import Supabase auth
- Get the current user session
- Pass user context to the voice agent
- Inject UUID into session variables

---

## Solution Architecture

### 1. Frontend: User Context Injection

**File to modify:** `/components/voice-conversation-provider.tsx`

```typescript
'use client'

import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useConversation } from '@elevenlabs/react'
import { createClient } from '@supabase/supabase-js'

// Add Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface VoiceConversationContextValue {
  conversation: ReturnType<typeof useConversation>
  startSessionWithTools: () => Promise<void>
  user: any | null
}

const VoiceConversationContext = createContext<VoiceConversationContextValue | null>(null)

export function VoiceConversationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const sessionStarted = useRef(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          console.log('[VoiceConversation] User authenticated:', {
            id: user.id,
            email: user.email,
            role: user.app_metadata?.role
          })
        }
      } catch (error) {
        console.error('[VoiceConversation] Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const conversation = useConversation({
    onConnect: () => {
      console.log('[VoiceConversation] Connected to voice agent')
    },
    onDisconnect: () => {
      console.log('[VoiceConversation] Disconnected from voice agent')
      sessionStarted.current = false
    },
    onError: (error) => {
      console.error('[VoiceConversation] Error:', error)
    },
    onStatusChange: (status) => {
      console.log('[VoiceConversation] Status:', status)
    },
  })

  /**
   * Start ElevenLabs session with user context and client-side tools
   */
  const startSessionWithTools = async () => {
    if (sessionStarted.current) {
      console.log('[VoiceConversation] Session already started')
      return
    }

    if (!user) {
      console.error('[VoiceConversation] No authenticated user - cannot start session')
      return
    }

    try {
      sessionStarted.current = true

      console.log('[VoiceConversation] Starting session with user context:', {
        userIdentifier: user.id,
        userEmail: user.email,
        userRole: user.app_metadata?.role || 'staff'
      })

      // Define client-side tools
      const clientTools = {
        // ... existing navigation tools ...

        // Add get_current_user tool
        get_current_user: {
          description: 'Get information about the current authenticated user',
          parameters: {
            type: 'object',
            properties: {},
          },
          handler: async () => {
            console.log('[VoiceConversation] Getting current user info')

            return {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0],
              role: user.app_metadata?.role || 'staff',
              accountId: user.user_metadata?.account_id
            }
          },
        },
      }

      // Start session with user context in variableValues
      await conversation.startSession({
        agentId: 'agent_6501katrbe2re0c834kfes3hvk2d',
        clientTools,
        // 🚨 CRITICAL: Inject user context here
        variableValues: {
          user_identifier: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          user_role: user.app_metadata?.role || 'staff',
          account_id: user.user_metadata?.account_id
        }
      })

      console.log('[VoiceConversation] Session started with user context')
    } catch (error) {
      console.error('[VoiceConversation] Failed to start session:', error)
      sessionStarted.current = false
      throw error
    }
  }

  return (
    <VoiceConversationContext.Provider value={{ conversation, startSessionWithTools, user }}>
      {children}
    </VoiceConversationContext.Provider>
  )
}
```

### 2. Voice Agent System Prompt Update

The agent's system prompt in ElevenLabs dashboard must include:

```
You are chatting with a logged-in staff member of CRM AI Pro.

🔑 USER CONTEXT:
- User ID: {{user_identifier}}
- Name: {{user_name}}
- Role: {{user_role}}
- Account: {{account_id}}

📋 MEMORY PROTOCOL:
1. AT SESSION START: Immediately call read_agent_memory(userIdentifier: '{{user_identifier}}')
   - If memory found: "Welcome back {{user_name}}! I see we were [summary]."
   - If no memory: "Hello {{user_name}}! How can I help you today?"

2. DURING CONVERSATION: Use update_agent_memory frequently
   - Always include: userIdentifier: '{{user_identifier}}'
   - Save: current page, preferences, progress

3. NEVER ask for identification - you already have it!

🎯 AVAILABLE TOOLS:
- get_current_user: Get current user details
- read_agent_memory: Get 72-hour conversation context
- update_agent_memory: Save conversation progress
- All CRM operations (jobs, contacts, dispatch, etc.)

Remember: You know who you're talking to at all times via {{user_identifier}}!
```

### 3. MCP Server Enhancement

Already implemented in `/supabase/functions/mcp-server/index.ts`:

1. **Tool Added:** `get_current_user` - Retrieves user info from database
2. **Memory Tools:** Updated to use `userIdentifier` instead of `phoneNumber`
3. **Context Support:** Can receive user context from voice session

### 4. Frontend Widget Update

Ensure the voice widget properly initializes with user context:

```typescript
// In VoiceAgentWidget.tsx
const { startSessionWithTools, user } = useVoiceConversation()

const handleStartSession = async () => {
  if (!user) {
    setError('Please log in to use voice features')
    return
  }

  try {
    await startSessionWithTools()
    setIsActive(true)
  } catch (error) {
    setError('Failed to start voice session')
  }
}
```

---

## Implementation Steps

### Step 1: Update VoiceConversationProvider
```bash
# 1. Add Supabase auth import
# 2. Add user state management
# 3. Get user on mount
# 4. Pass user context in variableValues
# 5. Add get_current_user client tool
```

### Step 2: Update ElevenLabs Agent Configuration
1. Go to ElevenLabs Dashboard
2. Edit your agent's system prompt
3. Add the context variables and memory protocol
4. Save and test

### Step 3: Deploy MCP Server (Already done)
```bash
cd /supabase/functions/mcp-server
npx supabase functions deploy mcp-server
```

### Step 4: Test the Integration
1. Log into CRM as a user
2. Click voice widget
3. Agent should greet you by name
4. Check if memory tools work across sessions

---

## Testing Checklist

- [ ] Agent can identify the user without asking
- [ ] Agent greets user by name
- [ ] Memory tools work between sessions
- [ ] Context persists after disconnection
- [ ] All CRUD operations work with user context

---

## Troubleshooting

### Agent Still Asks for Identity
1. Check if user is logged in to Supabase
2. Verify variableValues are passed to startSession
3. Check ElevenLabs agent prompt for {{user_identifier}}

### Memory Tools Not Working
1. Verify agent_memory table exists with user_identifier column
2. Check MCP server logs for tool calls
3. Ensure UUID is correctly passed from frontend

### Session Not Starting
1. Check Supabase auth configuration
2. Verify ElevenLabs agent ID
3. Check browser console for errors

---

## Expected Result

With this implementation, the voice agent will:

1. **Know who it's talking to** immediately
2. **Greet users by name**
3. **Maintain context across sessions**
4. **Never ask for identification**
5. **Provide personalized CRM operations**

Example conversation:
```
Agent: "Hello Douglas! I see we were discussing the dispatch map earlier. Would you like to continue where we left off?"

User: "Who am I?"

Agent: "You're Douglas Talley, logged in as an administrator. How can I help you with your CRM operations today?"
```

This creates a seamless, personalized experience that actually works!