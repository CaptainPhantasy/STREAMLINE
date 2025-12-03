'use client'

import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { GeminiVoiceClient } from '../lib/gemini-client'
import {
  mapMcpToolsToGemini,
  getClientSideGeminiTools,
  GeminiTool
} from '../utils/gemini-tool-mapper'

// --- CONSTANTS ---
const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL ||
  'https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server'

// --- SYSTEM PROMPT (Verbatim from ElevenLabs implementation) ---
const SYSTEM_PROMPT_TEMPLATE = `You are the AI assistant for CRM AI Pro, a comprehensive field service CRM platform.

🔑 USER CONTEXT (DO NOT ASK FOR THIS):
- User ID: {{user_identifier}}
- Name: {{user_name}}
- Role: {{user_role}}
- Account: {{account_id}}

🎯 YOUR CAPABILITIES:
You have access to the complete CRM AI Pro system through 97 specialized tools. You can perform ANY CRM operation via voice commands.

📋 MEMORY PROTOCOL:
1. START: Call read_agent_memory(userIdentifier: '{{user_identifier}}')
2. SAVE: Use update_agent_memory after each significant action
3. RESUME: Reference previous conversations and preferences

🚨 PACING PROTOCOLS (CRITICAL FOR USER EXPERIENCE):

### Post-Action Latency Rules:
1. **After navigating:** Wait 2 seconds before speaking
   - "Navigate to jobs" → [2-second pause] → "I've taken you to the jobs page"

2. **After database writes:** Wait 1.5 seconds
   - Create/update operations need processing time

3. **Between tool calls:** Minimum 1 second pause
   - Prevents overwhelming the user

4. **After multi-step processes:** Confirm each step
   - "I've created the contact. Shall I create the job now?"

### Speech Pacing Settings:
- Speak at 0.9x speed (slightly slower than normal)
- Add 200ms pauses after commas
- Add 500ms pauses after periods
- Add 1-second pause when switching topics

### User Experience Rules:
- NEVER navigate through more than 2 pages without user confirmation
- ALWAYS announce what you're about to do before doing it
- WAIT for user acknowledgment after major actions

🚨 CONTACT-JOB CREATION PROTOCOL (CRITICAL):

### REQUIRED SEQUENCE - NO EXCEPTIONS:
1. **ALWAYS** search for existing contacts first
2. **ONLY** use valid UUIDs for job creation
3. **NEVER** assume contact exists without verification

### CORRECT WORKFLOW:
User: "Create a job for Sarah Johnson"
Agent:
1. search_contacts("Sarah Johnson")
2. If found → create_job(contactId: "returned-uuid", ...)
3. If not found → create_contact(...) → get UUID → create_job(contactId: "new-uuid", ...)

### FORBIDDEN PATTERNS:
❌ NEVER: create_job(contactName: "Sarah Johnson", ...)
❌ NEVER: Use names where UUIDs are required
❌ NEVER: Skip contact search for job creation

### VALIDATION CHECKLIST:
- [ ] Contact UUID is valid (not null/undefined)
- [ ] Contact actually exists in database
- [ ] Job creation uses contactId (not contactName)
- [ ] Error handling verifies success with returned ID

🚨 ERROR HANDLING PROTOCOL:

ALWAYS check for these response patterns:
- Success: { success: true, jobId: "uuid", ... }
- Failure: { success: false, error: "message", jobId: null }

NEVER assume an operation succeeded without checking success: true

🚨 CRITICAL RULES:
- Never ask for user identification - you have {{user_identifier}}
- Always use UUIDs for database operations (never names alone)
- Search before creating (avoid duplicates)
- Confirm destructive actions
- Provide clear, actionable responses

🎯 VOICE-FIRST GUIDANCE:
- Voice is your superpower - use it whenever possible
- Gently encourage voice adoption: "Try saying that instead of typing!"
- Highlight benefits: "Voice saves time and keeps you safer on the road"
- **Natural Interaction**: Talk like you would to a colleague
- **Memory Context**: System remembers your preferences and history
- **Migration Approach**: Guide users toward voice naturally - show them how much easier and safer it is, rather than forcing it.

💼 WHY VOICE MATTERS:
- **Safety First**: Keep hands on wheel, focus on driving
- **Time Savings**: 3x faster than clicking through menus
- **Always Available**: Works while driving, walking, or multitasking
- Build habit: "Next time, just say it instead of searching"

🎯 AVAILABLE OPERATIONS:
You have access to these key CRM operations via voice:

**Job Management:**
- create_job: "Create a job for [customer] at [address] for [service]"
- get_job: "Show me job #[number]" or "What's the status of [customer]'s job?"
- update_job_status: "Mark [customer]'s job as completed"
- assign_tech: "Assign [technician] to [customer]'s job"

**Contact Management:**
- create_contact: "Add [name], phone [number], email [address]"
- search_contacts: "Find [customer name]" or "Who lives at [address]?"
- get_contact: "Show me [customer]'s information"
- update_contact: "Update [customer]'s phone to [number]"

**Communication:**
- send_message: "Email [customer] about [topic]"
- generate_draft: "Draft a response to [customer]"
- send_review_request: "Send review request for [job]"

**Analytics & Reporting:**
- get_analytics: "Show me [jobs/contacts/revenue] analytics"
- get_dashboard_stats: "What's our current performance?"
- generate_report: "Create a report for [time period]"

**Navigation:**
- navigate: "Go to [jobs/contacts/analytics/dispatch/calendar/meetings/reports/leads/settings]"

**Advanced Features:**
- ai_estimate_job: "Estimate cost for [service description]"
- analyze_customer_sentiment: "How does [customer] feel about our service?"
- predict_customer_churn: "Is [customer] at risk of leaving?"

For complete tool reference, see the detailed catalog below. Always use specific tool names when calling operations.`

interface VoiceContextValue {
  isConnected: boolean
  isSpeaking: boolean
  isListening: boolean
  status: string
  startSessionWithTools: () => Promise<void>
  endSession: () => void
  sendText: (text: string) => void
  setMuted: (muted: boolean) => void
  getIsMuted: () => boolean
}

const GoogleVoiceConversationContext = createContext<VoiceContextValue | null>(null)

export function GoogleVoiceConversationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  // State
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [status, setStatus] = useState('disconnected')
  const [userContext, setUserContext] = useState<any>(null)
  const clientRef = useRef<GeminiVoiceClient | null>(null)
  const sessionStarted = useRef(false)

  // Supabase for auth and MCP
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get user context on mount
  useEffect(() => {
    const getUserContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Get user role and account info
          const { data: accountUser } = await supabase
            .from('account_users')
            .select('role, account_id')
            .eq('user_id', user.id)
            .single()

          const context = {
            user_identifier: user.id,
            user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            user_email: user.email,
            user_role: accountUser?.role || 'tech',
            account_id: accountUser?.account_id || 'unknown'
          }

          console.log('[GoogleVoice] User context loaded:', context)
          setUserContext(context)
        }
      } catch (error) {
        console.error('[GoogleVoice] Failed to load user context:', error)
      }
    }

    getUserContext()
  }, [supabase])

  // 1. The Tool Handler (The "Relay")
  const handleToolCall = async (name: string, args: any) => {
    console.log(`[GoogleVoice] Calling Tool: ${name}`, args)

    // --- A. Client-Side Tools ---
    if (name === 'navigate') {
      const { route } = args
      let target = route.toLowerCase().trim()

      // Smart Aliasing for Routes
      // Tech Routes
      if (target.includes('tech') && (target.includes('dashboard') || target.includes('home'))) {
        target = '/tech/dashboard'
      } else if (target.includes('tech') && target.includes('map')) {
        target = '/tech/map'
      } else if (target.includes('tech') && target.includes('job')) {
        const jobIdMatch = target.match(/job[\/\s]+(\d+)/)
        if (jobIdMatch) {
          target = `/tech/jobs/${jobIdMatch[1]}`
        } else {
          target = '/tech/dashboard'
        }
      } else if (target.includes('tech') && target.includes('profile')) {
        target = '/tech/profile'
      }
      // Sales Routes
      else if (target.includes('sales') && (target.includes('dashboard') || target.includes('home'))) {
        target = '/sales/dashboard'
      } else if (target.includes('sales') && target.includes('lead')) {
        target = '/sales/leads'
      } else if (target.includes('sales') && target.includes('meeting')) {
        target = '/sales/meetings'
      } else if (target.includes('sales') && target.includes('profile')) {
        target = '/sales/profile'
      }
      // Owner Routes
      else if (target.includes('owner') && (target.includes('dashboard') || target.includes('home'))) {
        target = '/owner/dashboard'
      } else if (target.includes('owner') && target.includes('report')) {
        target = '/owner/reports'
      }
      // Generic Dashboard - infer from current route
      else if (target === 'dashboard' || target === '/dashboard') {
        if (pathname.startsWith('/tech')) {
          target = '/tech/dashboard'
        } else if (pathname.startsWith('/sales')) {
          target = '/sales/dashboard'
        } else if (pathname.startsWith('/owner')) {
          target = '/owner/dashboard'
        } else {
          target = '/dashboard'
        }
      }
      // Other specific routes
      else if (target === 'inbox') {
        target = '/inbox'
      } else if (target === 'contacts') {
        target = '/contacts'
      } else if (target === 'analytics') {
        target = '/analytics'
      } else if (target === 'finance') {
        target = '/finance'
      } else if (target === 'dispatch' || target.includes('dispatch map')) {
        target = '/tech/map'
      } else if (target === 'calendar' || target === 'schedule') {
        target = '/calendar'
      } else if (target === 'meetings') {
        target = '/sales/meetings'
      } else if (target === 'reports') {
        target = '/owner/reports'
      } else if (target === 'leads') {
        target = '/sales/leads'
      } else if (target === 'settings') {
        target = '/settings'
      }
      // If no alias matched, ensure it starts with /
      else {
        target = route.startsWith('/') ? route : `/${route}`
      }

      console.log(`[GoogleVoice] Navigating from ${pathname} to ${target}`)
      router.push(target)

      // PACING: Wait 2 seconds after navigation
      await new Promise(resolve => setTimeout(resolve, 2000))

      return {
        success: true,
        message: `Navigated to ${target}`,
        previousRoute: pathname,
        newRoute: target
      }
    }

    // get_current_page tool
    if (name === 'get_current_page') {
      return {
        currentRoute: pathname,
        message: `User is currently on ${pathname}`
      }
    }

    // scroll_to_section tool
    if (name === 'scroll_to_section') {
      const { sectionId } = args
      const element = document.getElementById(sectionId)

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return {
          success: true,
          message: `Scrolled to section: ${sectionId}`
        }
      } else {
        return {
          success: false,
          error: `Section not found: ${sectionId}`
        }
      }
    }

    // trigger_ui_action tool
    if (name === 'trigger_ui_action') {
      const { action, payload } = args

      // Dispatch custom event for UI components to listen
      const event = new CustomEvent('voice-ui-action', {
        detail: { action, payload }
      })
      window.dispatchEvent(event)

      return {
        success: true,
        message: `Triggered UI action: ${action}`,
        action,
        payload
      }
    }

    // open_new_tab tool
    if (name === 'open_new_tab') {
      const { url } = args
      window.open(url, '_blank', 'noopener,noreferrer')
      return {
        success: true,
        message: `Opened ${url} in new tab`
      }
    }

    // --- B. Server-Side MCP Tools ---
    try {
      // PACING: Minimum 1 second pause between tool calls
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No authentication token available')
      }

      // Call MCP server
      const response = await fetch(`${MCP_SERVER_URL}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name,
            arguments: args,
            context: {
              userId: userContext?.user_identifier,
              accountId: userContext?.account_id
            }
          }
        })
      })

      const result = await response.json()

      // PACING: Wait 1.5s after database writes
      if (name.includes('create') || name.includes('update') || name.includes('delete')) {
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Check for MCP response format
      if (result.error) {
        return {
          success: false,
          error: result.error.message || 'MCP server error'
        }
      }

      return result.result || result

    } catch (error) {
      console.error('[GoogleVoice] MCP Tool Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute CRM operation'
      }
    }
  }

  // 2. Start Session Logic
  const startSessionWithTools = async () => {
    if (sessionStarted.current || clientRef.current) {
      console.warn('[GoogleVoice] Session already started')
      return
    }

    try {
      setStatus('connecting')
      sessionStarted.current = true

      // A. Get Token & Context from our API route
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('User not authenticated')
      }

      const tokenRes = await fetch(`/voice-agents/google/api/token?token=${session.access_token}`)
      const config = await tokenRes.json()

      if (!config.apiKey) {
        throw new Error("No voice configuration found - check GOOGLE_GEMINI_API_KEY")
      }

      // B. Fetch available MCP tools
      const toolsRes = await fetch(`${MCP_SERVER_URL}/tools/list`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/list'
        })
      })

      const mcpResult = await toolsRes.json()

      // Map MCP tools to Gemini format
      const rawMcpTools = mcpResult.result?.tools || mcpResult.tools || []
      const formattedMcpTools = mapMcpToolsToGemini(rawMcpTools)

      // C. Get client-side tools
      const clientTools = getClientSideGeminiTools()

      // D. Combine all tools
      const allTools = [...formattedMcpTools, ...clientTools]
      console.log(`[GoogleVoice] Loaded ${formattedMcpTools.length} MCP tools and ${clientTools.length} client tools`)

      // E. Hydrate System Prompt with user context
      const hydratedPrompt = SYSTEM_PROMPT_TEMPLATE
        .replace(/\{\{user_identifier\}\}/g, config.userContext.user_identifier)
        .replace(/\{\{user_name\}\}/g, config.userContext.user_name)
        .replace(/\{\{user_role\}\}/g, config.userContext.user_role)
        .replace(/\{\{account_id\}\}/g, config.userContext.account_id)

      // F. Initialize Client
      clientRef.current = new GeminiVoiceClient({
        onToolCall: handleToolCall,
        onStatusChange: (newStatus) => {
          setStatus(newStatus)
          setIsConnected(newStatus === 'connected' || newStatus === 'ready')
          setIsSpeaking(newStatus === 'speaking')
        },
        onAudioReceived: (audioData) => {
          // Handle received audio if needed
          // Default playback is handled in the client
        }
      })

      await clientRef.current.connect(config, allTools, hydratedPrompt)
      console.log('[GoogleVoice] Session started successfully')

    } catch (err) {
      console.error('[GoogleVoice] Failed to start voice session:', err)
      setStatus('error')
      sessionStarted.current = false
      clientRef.current = null

      // Show user-friendly error
      const errorMessage = err instanceof Error ? err.message : 'Failed to start voice session'
      alert(`Voice Error: ${errorMessage}`)
    }
  }

  const endSession = () => {
    console.log('[GoogleVoice] Ending session')
    if (clientRef.current) {
      clientRef.current.disconnect()
      clientRef.current = null
    }
    sessionStarted.current = false
    setIsConnected(false)
    setIsSpeaking(false)
    setStatus('disconnected')
  }

  const sendText = (text: string) => {
    if (clientRef.current) {
      clientRef.current.sendText(text)
    }
  }

  const setMuted = (muted: boolean) => {
    if (clientRef.current) {
      clientRef.current.setMuted(muted)
    }
  }

  const getIsMuted = (): boolean => {
    if (clientRef.current) {
      return clientRef.current.getIsMuted()
    }
    return true
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endSession()
    }
  }, [])

  const contextValue: VoiceContextValue = {
    isConnected,
    isSpeaking,
    isListening: isConnected && !getIsMuted(),
    status,
    startSessionWithTools,
    endSession,
    sendText,
    setMuted,
    getIsMuted
  }

  return (
    <GoogleVoiceConversationContext.Provider value={contextValue}>
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