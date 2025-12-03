# ⏺ Voice Agent Tools and Prompting

 **MCP Server Connection**

- **Server URL:** https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server
- **Protocol:** Model Context Protocol (MCP) over HTTP
- **Authentication:** JWT tokens via Authorization header
- **Methods:**
  - initialize - Protocol handshake
  - tools/list - Returns 97 available tools
  - tools/call - Executes CRM operations

  **Voice Agent System Prompt (Verbatim)**

  You are the AI assistant for CRM AI Pro, a comprehensive field service CRM platform.

  🔑 USER CONTEXT (DO NOT ASK FOR THIS):
- User ID: {{user*_identifier}}*
  *- Name: {{user_*name}}
- Role: {{user*_role}}*
  *- Account: {{account_*id}}

  🎯 YOUR CAPABILITIES:
  You have access to the complete CRM AI Pro system through 97 specialized tools. You can perform ANY CRM operation via voice commands.

  📋 MEMORY PROTOCOL:
1. START: Call read*_agent_*memory(userIdentifier: '{{user*_identifier}}')*
  *2. SAVE: Use update_*agent*_memory after each significant action*
  *3. RESUME: Reference previous conversations and preferences*

  *🚨 PACING PROTOCOLS (CRITICAL FOR USER EXPERIENCE):*

  *### Post-Action Latency Rules:*
  *1.* *****After navigating:***** *Wait 2 seconds before speaking*
     *- "Navigate to jobs" → [2-second pause] → "I've taken you to the jobs page"*

  *2.* *****After database writes:***** *Wait 1.5 seconds*
     *- Create/update operations need processing time*

  *3.* *****Between tool calls:***** *Minimum 1 second pause*
     *- Prevents overwhelming the user*

  *4.* *****After multi-step processes:***** *Confirm each step*
     *- "I've created the contact. Shall I create the job now?"*

  *### Speech Pacing Settings:*
  *- Speak at 0.9x speed (slightly slower than normal)*
  *- Add 200ms pauses after commas*
  *- Add 500ms pauses after periods*
  *- Add 1-second pause when switching topics*

  *### User Experience Rules:*
  *- NEVER navigate through more than 2 pages without user confirmation*
  *- ALWAYS announce what you're about to do before doing it*
  *- WAIT for user acknowledgment after major actions*

  *🚨 CONTACT-JOB CREATION PROTOCOL (CRITICAL):*

  *### REQUIRED SEQUENCE - NO EXCEPTIONS:*
  *1.* *****ALWAYS***** *search for existing contacts first*
  *2.* *****ONLY***** *use valid UUIDs for job creation*
  *3.* *****NEVER***** *assume contact exists without verification*

  *### CORRECT WORKFLOW:*
  User: "Create a job for Sarah Johnson"
  Agent:
1. search_contacts("Sarah Johnson")
2. If found → create_job(contactId: "returned-uuid", ...)
3. If not found → create_contact(...) → get UUID → create_job(contactId: "new-uuid", ...)

  ### FORBIDDEN PATTERNS:
  ❌ NEVER: create*_job(contactName: "Sarah Johnson", ...)*
  *❌ NEVER: Use names where UUIDs are required*
  *❌ NEVER: Skip contact search for job creation*

  *### VALIDATION CHECKLIST:*
  *- [ ] Contact UUID is valid (not null/undefined)*
  *- [ ] Contact actually exists in database*
  *- [ ] Job creation uses contactId (not contactName)*
  *- [ ] Error handling verifies success with returned ID*

  *🚨 ERROR HANDLING PROTOCOL:*

  *ALWAYS check for these response patterns:*
  *- Success: `{ success: true, jobId: "uuid", ... }`*
  *- Failure: `{ success: false, error: "message", jobId: null }`*

  *NEVER assume an operation succeeded without checking `success: true`*

  *🚨 CRITICAL RULES:*
  *- Never ask for user identification - you have {{user_*identifier}}
- Always use UUIDs for database operations (never names alone)
- Search before creating (avoid duplicates)
- Confirm destructive actions
- Provide clear, actionable responses

  🎯 VOICE-FIRST GUIDANCE:
- Voice is your superpower - use it whenever possible
- Gently encourage voice adoption: "Try saying that instead of typing!"
- Highlight benefits: "Voice saves time and keeps you safer on the road"
- ****Natural Interaction****: Talk like you would to a colleague
- ****Memory Context****: System remembers your preferences and history
- ****Migration Approach****: Guide users toward voice naturally - show them how much easier and safer it is, rather than forcing it.

  💼 WHY VOICE MATTERS:
- ****Safety First****: Keep hands on wheel, focus on driving
- ****Time Savings****: 3x faster than clicking through menus
- ****Always Available****: Works while driving, walking, or multitasking
- Build habit: "Next time, just say it instead of searching"

  **Key Features**

- 97 CRM tools via MCP
- 72-hour memory persistence
- Role-based permissions (owner/admin/dispatcher/tech/sales)
- Mobile-first navigation to 17 pages
- Client-side navigation bridge for real-time routing
- Multi-tenant account isolation


## **Voice Agent Layer Architecture**

  **1. Core Components Structure**

  The voice agent layer consists of 3 key components:

  **A. VoiceConversationProvider (Context Layer)**
- Location: components/voice-conversation-provider.tsx
- Purpose: Manages the voice session and provides shared context
- Key responsibilities:
  - Single session instance per app (prevents duplicate WebRTC)
  - Registers client-side tools (navigation, UI actions)
  - Manages user authentication context
  - Handles session lifecycle

  **B. VoiceAgentWidget (UI Control Layer)**
- Location: components/voice-agent/voice-agent-widget.tsx
- Purpose: UI controls for starting/ending calls and managing audio
- Consumes the shared context from VoiceConversationProvider
- No direct SDK usage - uses the provider's session

  **C. VoiceNavigationBridge (Headless Component)**
- Location: components/voice-navigation-bridge.tsx
- Purpose: Mounting point for navigation tools (renders null)
- Client-side tools are actually registered in VoiceConversationProvider

  **2. Architecture Pattern**

  // Provider Pattern with Shared Context
  VoiceConversationProvider (Session Manager)
  ├── useConversation hook from SDK
  ├── Client-side tools registration
  ├── User context extraction
  └── startSessionWithTools() method

  VoiceAgentWidget (UI Controller)
  ├── useVoiceConversation() hook
  ├── UI for start/end call
  ├── Mic/volume controls
  └── Uses shared session

  **3. Integration Points**

  **A. Session Start Flow:**
1. User clicks "Start a call" in VoiceAgentWidget
2. Widget calls startSessionWithTools() from provider
3. Provider:
    - Gets user context from Supabase auth
    - Defines client-side tools (navigation, UI actions)
    - Starts ElevenLabs session with tools + user context
4. ElevenLabs agent can now call client tools

  **B. Tool Registration Pattern:**
  const clientTools = {
    navigation: {
      description: 'Navigate to pages',
      parameters: {
        type: 'object',
        properties: {
          route: { type: 'string' }
        },
        required: ['route']
      },
      handler: async (params) => {
        // Client-side navigation logic
        router.push(targetRoute)
        return { success: true, message: 'Navigated' }
      }
    }
  }

  **C. User Context Injection:**
  const sessionPayload = {
    agentId: AGENT_ID,
    clientTools: clientTools,
    variableValues: {
      user_identifier: user.id,
      user_name: user.user_metadata?.full_name,
      user_role: accountUser?.role,
      account_id: accountUser?.account_id
    }
  }

  **4. MCP Server Integration**

  The voice agent connects to your MCP server at:
  https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server

- Protocol: Model Context Protocol (MCP) over HTTP
- The agent calls server-side tools via MCP
- Server handles 97 CRM tools (jobs, contacts, analytics, etc.)
- Client-side tools handle browser actions (navigation, UI)

  **5. Key Implementation Details**

  **A. Single Session Pattern:**
  // Prevents multiple sessions
  const sessionStarted = useRef(false)

  if (sessionStarted.current) {
    return // Abort if already started
  }
  sessionStarted.current = true

  **B. Smart Route Aliasing:**
  // Maps voice commands to mobile routes
  if (target.includes('tech') && target.includes('dashboard')) {
    target = '/m/tech/dashboard'
  } else if (target.includes('sales') && target.includes('leads')) {
    target = '/m/sales/leads'
  }

  **C. Error Handling:**
  // Always check for success: true
  if (response.success === false) {
    // Handle error
    return { error: response.error }
  }

  **6. For Google Platform Replacement**

  To replace with Google's voice platform, you need to:

1. **Replace the SDK Hook:**
  // Instead of: import { useConversation } from '@elevenlabs/react'
  // Use: import { useGoogleConversation } from '@google/voice-sdk'
2. **Keep Same Architecture:**
    - VoiceConversationProvider pattern
    - Client-side tools registration
    - User context injection
    - MCP server connection (can stay same)
3. **Adapt Session Start:**
  // Keep same payload structure
  await googleConversation.startSession({
    agentId: GOOGLE_AGENT_ID,
    clientTools: clientTools,
    variableValues: userContext
  })
4. **Maintain Tool Interface:**
    - Same client-side tool structure
    - Same parameter definitions
    - Same handler return format

  This architecture cleanly separates the voice SDK from the CRM logic, making it straightforward to swap voice providers while keeping all functionality intact.

⏺ **7. Complete Replacement Template**

  Here's a ready-to-use template for Google Platform replacement:

  // components/google-voice-conversation-provider.tsx
  'use client'

  import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
  import { useRouter, usePathname } from 'next/navigation'
  import { useGoogleConversation } from '@google/voice-sdk' // Replace with actual import
  import { createBrowserClient } from '@supabase/ssr'

  const GOOGLE_AGENT_ID = 'your-google-agent-id'

  interface GoogleVoiceConversationContextValue {
    conversation: ReturnType<typeof useGoogleConversation>
    startSessionWithTools: () => Promise<void>
  }

  const GoogleVoiceConversationContext = createContext<GoogleVoiceConversationContextValue | null>(null)

  export function GoogleVoiceConversationProvider({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const sessionStarted = useRef(false)
    const [userContext, setUserContext] = useState<any>(null)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user context (same as ElevenLabs)
    useEffect(() => {
      const getUserContext = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: accountUser } = await supabase
              .from('account_users')
              .select('role, account_id')
              .eq('user_id', user.id)
              .single()

            setUserContext({
              user_identifier: user.id,
              user_name: user.user_metadata?.full_name || user.email,
              user_role: accountUser?.role || 'unknown',
              account_id: accountUser?.account_id || 'unknown'
            })
          }
        } catch (error) {
          console.error('[GoogleVoice] Failed to load user context:', error)
        }
      }
      getUserContext()
    }, [])

    const conversation = useGoogleConversation({
      onConnect: () => console.log('[GoogleVoice] Connected'),
      onDisconnect: () => {
        console.log('[GoogleVoice] Disconnected')
        sessionStarted.current = false
      },
      onError: (error) => console.error('[GoogleVoice] Error:', error),
    })

    const startSessionWithTools = async () => {
      if (sessionStarted.current) return

      try {
        sessionStarted.current = true

        // Same client-side tools as ElevenLabs
        const clientTools = {
          navigation: {
            description: 'Navigate to a different page',
            parameters: {
              type: 'object' as const,
              properties: {
                route: { type: 'string', description: 'Route to navigate to' },
              },
              required: ['route'],
            },
            handler: async (params: { route: string }) => {
              // Same navigation logic as ElevenLabs
              let { route } = params
              let target = route.toLowerCase().trim()

              // Smart aliasing logic (copy from ElevenLabs)
              if (target.includes('tech') && target.includes('dashboard')) {
                target = '/m/tech/dashboard'
              }
              // ... rest of aliasing logic

              router.push(target)
              return {
                success: true,
                message: `Navigated to ${target}`,
                previousRoute: pathname,
                newRoute: target,
              }
            },
          },
          // ... other client tools (get_current_page, scroll_to_section, etc.)
        }

        // Start Google session with same payload structure
        await conversation.startSession({
          agentId: GOOGLE_AGENT_ID,
          clientTools: clientTools,
          variableValues: userContext
        })

      } catch (error) {
        console.error('[GoogleVoice] Failed to start session:', error)
        sessionStarted.current = false
        throw error
      }
    }

    return (
      <GoogleVoiceConversationContext.Provider value={{ conversation, startSessionWithTools }}>
        {children}
      </GoogleVoiceConversationContext.Provider>
    )
  }

  export function useGoogleVoiceConversation() {
    const context = useContext(GoogleVoiceConversationContext)
    if (!context) {
      throw new Error('useGoogleVoiceConversation must be used within GoogleVoiceConversationProvider')
    }
    return context
  }

  The key is maintaining the same patterns while swapping the SDK-specific hooks and session start methods.

⏺ That's the complete architecture. The voice agent layer uses a clean provider pattern with shared context, making it straightforward to replace ElevenLabs with Google's platform while keeping
  all the CRM integration intact.