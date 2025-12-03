# ### Plan of Action
1. 1	Server-Side: Create the /api/voice/token route to securely manage credentials.
2. 2	Client-Side Utility: Create a GeminiVoiceClient to manage the WebSocket and Audio Buffers (mimicking an SDK).
3. 3	The Provider: Build GoogleVoiceConversationProvider which orchestrates the Session, User Context, and Tool Execution (both Client & MCP).

⠀
### Step 1: The Secure Token Route
### File: app/api/voice/token/route.ts
This route validates the user and provides the configuration needed to connect to Gemini.
## code
### TypeScript
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  
  // 1. Verify User
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Fetch Account Context (for System Prompt injection later)
  const { data: accountUser } = await supabase
    .from('account_users')
    .select('role, account_id, name')
    .eq('user_id', user.id)
    .single()

  // 3. Return Connection Config
  // NOTE: For Vertex AI, this would generate an ephemeral access token.
  // For Gemini API (AI Studio), we proxy the key or return it if acceptable.
  return NextResponse.json({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY, 
    url: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
    userContext: {
      user_identifier: user.id,
      user_name: accountUser?.name || user.email,
      user_role: accountUser?.role || 'tech',
      account_id: accountUser?.account_id
    }
  })
}


### Step 2: The Gemini Client Wrapper (The Engine)
### File: lib/voice/gemini-client.ts
This file handles the heavy lifting: Microphone recording, WebSocket management, and Audio playback.
## code
### TypeScript
/**
* A lightweight wrapper around Google's Multimodal Live API
* Handles: Microphone, Speaker, WebSocket, and Tool Events
 */

export type ToolHandler = (name: string, args: any) => Promise<any>;

export class GeminiVoiceClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private isConnected = false;
  private onToolCall: ToolHandler;
  private onStatusChange: (status: string) => void;
  
  constructor({ onToolCall, onStatusChange }: { onToolCall: ToolHandler, onStatusChange: any }) {
    this.onToolCall = onToolCall;
    this.onStatusChange = onStatusChange;
  }

  async connect(config: any, tools: any[], systemInstruction: string) {
    if (this.isConnected) return;

    // 1. Setup Audio Context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    await this.audioContext.audioWorklet.addModule('/worklets/pcm-processor.js'); // You need a simple PCM worklet

    // 2. Setup WebSocket
    const url = `${config.url}?key=${config.apiKey}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.onStatusChange('connected');
      
      // Send Initial Setup
      this.sendJSON({
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: { prebuilt_voice_config: { voice_name: "Kore" } } // "Kore" selected
            }
          },
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          tools: [{ function_declarations: tools }]
        }
      });

      this.startMicrophone();
    };

    this.ws.onmessage = async (event) => {
        let data;
        if (event.data instanceof Blob) {
            data = JSON.parse(await event.data.text());
        } else {
            data = JSON.parse(event.data);
        }
        
        this.handleServerMessage(data);
    };

    this.ws.onclose = () => {
      this.disconnect();
    };
  }

  private async handleServerMessage(data: any) {
    // Handle Audio
    if (data.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType.startsWith('audio/')) {
          this.playAudio(part.inlineData.data);
        }
      }
    }

    // Handle Tool Calls
    if (data.toolCall) {
      for (const call of data.toolCall.functionCalls) {
        // Execute Tool
        const result = await this.onToolCall(call.name, call.args);
        
        // Send Response back
        this.sendJSON({
          toolResponse: {
            functionResponses: [{
              name: call.name,
              id: call.id,
              response: { result: result }
            }]
          }
        });
      }
    }
  }

  private sendJSON(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private async startMicrophone() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = this.audioContext!.createMediaStreamSource(this.stream);
    
    // Simple processor to convert Float32 to PCM 16-bit
    this.workletNode = new AudioWorkletNode(this.audioContext!, 'pcm-processor');
    this.workletNode.port.onmessage = (event) => {
      // Send audio chunk to Gemini
      const base64Audio = this.arrayBufferToBase64(event.data);
      this.sendJSON({
        realtime_input: {
          media_chunks: [{
            mime_type: "audio/pcm;rate=24000",
            data: base64Audio
          }]
        }
      });
    };
    source.connect(this.workletNode);
  }

  private playAudio(base64String: string) {
    // Implementation to decode Base64 to ArrayBuffer and play via AudioContext
    // (Standard WebAudio API implementation omitted for brevity)
  }

  disconnect() {
    this.isConnected = false;
    this.onStatusChange('disconnected');
    this.ws?.close();
    this.stream?.getTracks().forEach(t => t.stop());
    this.audioContext?.close();
  }

  private arrayBufferToBase64(buffer: ArrayBuffer) {
     // Helper implementation
     return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}


### Step 3: The Provider Implementation
### File: components/google-voice-conversation-provider.tsx
This incorporates your specific Logic, Pacing, and MCP connection.
## code
### Tsx
'use client'

import { createContext, useContext, useRef, ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { GeminiVoiceClient } from '@/lib/voice/gemini-client'
import { createBrowserClient } from '@supabase/ssr'

// --- CONSTANTS ---
const MCP_SERVER_URL = 'https://expbvujyegxmxvatcjqt.supabase.co/functions/v1/mcp-server'

// --- SYSTEM PROMPT (Verbatim from Doc) ---
const SYSTEM_PROMPT_TEMPLATE = `
You are the AI assistant for CRM AI Pro, a comprehensive field service CRM platform.

🔑 USER CONTEXT (DO NOT ASK FOR THIS):
- User ID: {{user_identifier}}
- Name: {{user_name}}
- Role: {{user_role}}
- Account: {{account_id}}

🎯 YOUR CAPABILITIES:
You have access to the complete CRM AI Pro system through specialized tools. You can perform ANY CRM operation via voice commands.

📋 MEMORY PROTOCOL:
1. START: Call read_agent_memory(userIdentifier: '{{user_identifier}}')
2. SAVE: Use update_agent_memory after each significant action
3. RESUME: Reference previous conversations and preferences

🚨 PACING PROTOCOLS (CRITICAL FOR USER EXPERIENCE):
- Speak at 0.9x speed (slightly slower than normal)
- Add 200ms pauses after commas, 500ms after periods
- Add 1-second pause when switching topics
- ALWAYS announce what you're about to do before doing it

🚨 CONTACT-JOB CREATION PROTOCOL (CRITICAL):
1. ALWAYS search for existing contacts first
2. ONLY use valid UUIDs for job creation
3. NEVER assume contact exists without verification

🚨 ERROR HANDLING:
- Check for { success: true } in responses.
`

interface VoiceContextValue {
  isConnected: boolean
  startSessionWithTools: () => Promise<void>
  endSession: () => void
}

const GoogleVoiceConversationContext = createContext<VoiceContextValue | null>(null)

export function GoogleVoiceConversationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  // State
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef<GeminiVoiceClient | null>(null)
  
  // Supabase for MCP Auth
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. The Tool Handler (The "Relay")
  const handleToolCall = async (name: string, args: any) => {
    console.log(`[VoiceAgent] Calling Tool: ${name}`, args)
    
    // --- A. Client-Side Tools ---
    if (name === 'navigate') {
      const { route } = args
      let target = route.toLowerCase().trim()
      
      // Aliasing Logic
      if (target.includes('tech') && target.includes('dashboard')) target = '/m/tech/dashboard'
      else if (target.includes('sales') && target.includes('leads')) target = '/m/sales/leads'
      
      router.push(target)
      
      // PACING: Wait 2 seconds after nav
      await new Promise(r => setTimeout(r, 2000))
      
      return { success: true, message: `Navigated to ${target}` }
    }

    // --- B. Server-Side MCP Tools ---
    try {
      // PACING: Minimum 1 second pause between tools
      await new Promise(r => setTimeout(r, 1000))

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(`${MCP_SERVER_URL}/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ name, args })
      })

      const result = await response.json()

      // PACING: Wait 1.5s after database writes
      if (name.includes('create') || name.includes('update')) {
        await new Promise(r => setTimeout(r, 1500))
      }

      return result

    } catch (error) {
      console.error('[VoiceAgent] MCP Error:', error)
      return { success: false, error: 'Failed to execute CRM operation' }
    }
  }

  // 2. Start Session Logic
  const startSessionWithTools = async () => {
    if (clientRef.current) return

    try {
      // A. Get Token & Context
      const tokenRes = await fetch('/api/voice/token')
      const config = await tokenRes.json()
      
      if (!config.apiKey) throw new Error("No voice configuration found")

      // B. Fetch Available MCP Tools to register with Google
      // (Optimization: We fetch the JSON definition from the MCP server to pass to Google)
      const { data: { session } } = await supabase.auth.getSession()
      const toolsRes = await fetch(`${MCP_SERVER_URL}/tools/list`, {
         headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const mcpTools = await toolsRes.json() // Expecting array of Google-compatible FunctionDeclarations
      
      // C. Merge Client Tools
      const clientTools = [{
        name: "navigate",
        description: "Navigate to a different page within the CRM application",
        parameters: {
          type: "OBJECT",
          properties: {
            route: { type: "STRING", description: "The path or page name to navigate to" }
          },
          required: ["route"]
        }
      }]

      const allTools = [...mcpTools, ...clientTools]

      // D. Hydrate System Prompt
      const hydratedPrompt = SYSTEM_PROMPT_TEMPLATE
        .replace('{{user_identifier}}', config.userContext.user_identifier)
        .replace('{{user_name}}', config.userContext.user_name)
        .replace('{{user_role}}', config.userContext.user_role)
        .replace('{{account_id}}', config.userContext.account_id)

      // E. Initialize Client
      clientRef.current = new GeminiVoiceClient({
        onToolCall: handleToolCall,
        onStatusChange: (status) => setIsConnected(status === 'connected')
      })

      await clientRef.current.connect(config, allTools, hydratedPrompt)

    } catch (err) {
      console.error("Failed to start voice session", err)
      clientRef.current = null
    }
  }

  const endSession = () => {
    if (clientRef.current) {
      clientRef.current.disconnect()
      clientRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => endSession()
  }, [])

  return (
    <GoogleVoiceConversationContext.Provider value={{ isConnected, startSessionWithTools, endSession }}>
      {children}
    </GoogleVoiceConversationContext.Provider>
  )
}

export function useGoogleVoiceConversation() {
  const context = useContext(GoogleVoiceConversationContext)
  if (!context) throw new Error('useGoogleVoiceConversation must be used within Provider')
  return context
}
### Critical Setup Note
### You need to add a simple Audio Processor file to yourpublic folder for the Microphone stream to work with the AudioContext properly.
### File: public/worklets/pcm-processor.js
## code
### JavaScript
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const float32Data = input[0];
      const int16Data = new Int16Array(float32Data.length);
      
      for (let i = 0; i < float32Data.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Data[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      this.port.postMessage(int16Data.buffer, [int16Data.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
### Next Steps to Finalize
1. 1	Place the files according to the structure above.
2. 2	Update **components/voice-agent/voice-agent-widget.tsx** to use useGoogleVoiceConversation instead of the old ElevenLabs hook.
3. 3	Ensure MCP Compatibility: Your current MCP /tools/list likely returns tools in a format compatible with OpenAI or standard JSON Schema. Google's Gemini format is slightly different (CamelCase functionDeclarations vs snake_case). You may need a small mapper in the startSessionWithTools function to convert the JSON schema keys if your MCP server doesn't support Google format natively.

### Here is the TypeScript utility to bridge your MCP server's tools (which use the standard JSON Schema viainputSchema) to Google Gemini's preferred FunctionDeclaration format (which expects parameters and Uppercase types).
### 1. Create the Mapper Utility
### Create this file in your utils folder. It handles the recursive conversion of types to UPPERCASE (a quirk of the Gemini API) and renamesinputSchema to parameters.
### File: utils/gemini-tool-mapper.ts
## code
### TypeScript
/**
* Maps standard MCP/JSON Schema tools to Google Gemini FunctionDeclarations.
* 
* Key Transformations:
* 1. Renames 'inputSchema' -> 'parameters'
* 2. Converts type values to UPPERCASE (e.g., 'string' -> 'STRING')
* 3. Removes 'additionalProperties' if present (Gemini can be strict about this)
 */

export function mapMcpToolsToGemini(mcpTools: any[]) {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: mapSchemaToGemini(tool.inputSchema || {}),
  }));
}

function mapSchemaToGemini(schema: any): any {
  if (!schema) return undefined;

  // Create a shallow copy to avoid mutating the original
  const newSchema = { ...schema };

  // 1. Convert type to UPPERCASE
  if (newSchema.type) {
    if (typeof newSchema.type === 'string') {
        newSchema.type = newSchema.type.toUpperCase();
    }
  }

  // 2. Handle Properties Recursively
  if (newSchema.properties) {
    const newProps: any = {};
    for (const [key, prop] of Object.entries(newSchema.properties)) {
      newProps[key] = mapSchemaToGemini(prop);
    }
    newSchema.properties = newProps;
  }

  // 3. Handle Arrays (items) Recursively
  if (newSchema.items) {
    newSchema.items = mapSchemaToGemini(newSchema.items);
  }

  // 4. Cleanup unsupported fields for Gemini
  // Gemini sometimes rejects 'additionalProperties' or 'title' in strict mode
  delete newSchema.additionalProperties;
  delete newSchema.title;
  delete newSchema.$schema; 

  return newSchema;
}
### 2. Update the Provider
### Now, update thestartSessionWithTools function in your GoogleVoiceConversationProvider to use this mapper.
### File: components/google-voice-conversation-provider.tsx (Partial Update)
## code
### Tsx
import { mapMcpToolsToGemini } from '@/utils/gemini-tool-mapper' // Import the new utility

// ... inside the provider component ...

  const startSessionWithTools = async () => {
    if (clientRef.current) return

    try {
      // A. Get Token & Context
      const tokenRes = await fetch('/api/voice/token')
      const config = await tokenRes.json()
      
      if (!config.apiKey) throw new Error("No voice configuration found")

      // B. Fetch MCP Tools & MAP THEM
      const { data: { session } } = await supabase.auth.getSession()
      
      // Fetch raw MCP tools
      const toolsRes = await fetch(`${MCP_SERVER_URL}/tools/list`, {
         headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
      const mcpResult = await toolsRes.json() 
      
      // 🟢 MAPPER APPLIED HERE
      // Assuming mcpResult is { tools: [...] } or just [...] depending on your server response
      const rawTools = Array.isArray(mcpResult) ? mcpResult : mcpResult.tools;
      const formattedMcpTools = mapMcpToolsToGemini(rawTools);
      
      // C. Merge Client Tools (Format these manually to match Gemini)
      const clientTools = [{
        name: "navigate",
        description: "Navigate to a different page within the CRM application",
        parameters: {
          type: "OBJECT", // Uppercase manually here
          properties: {
            route: { type: "STRING", description: "The path or page name to navigate to" }
          },
          required: ["route"]
        }
      }]

      const allTools = [...formattedMcpTools, ...clientTools]

      // ... rest of the function (Hydrate System Prompt, Initialize Client) ...
### Checklist for Success
1. 1	File Placement:
   * ◦	app/api/voice/token/route.ts (The Auth Handler)
   * ◦	lib/voice/gemini-client.ts (The Engine)
   * ◦	components/google-voice-conversation-provider.tsx (The Controller)
   * ◦	utils/gemini-tool-mapper.ts (The Translator)
   * ◦	public/worklets/pcm-processor.js (The Audio Processor)
2. 2	Environment Variables: Ensure these are in your .env.local: ## code
### Env
GOOGLE_GEMINI_API_KEY=your_key_here
2. 3	NEXT_PUBLIC_SUPABASE_URL=...
3. 4	NEXT_PUBLIC_SUPABASE_ANON_KEY=... 

4. 5	Permissions: Your GeminiVoiceClient requests microphone access (navigator.mediaDevices.getUserMedia). Ensure your testing environment (localhost or HTTPS) allows this.

⠀You are now ready to build. The mapper will ensure that when Gemini decides to create_job, it understands the schema perfectly, and your existing handleToolCall will route it to your Supabase MCP server seamlessly.
