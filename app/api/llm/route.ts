import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, generateText } from 'ai'
import { getAuthenticatedSession } from '@/lib/auth-helper'
import { sanitizeObject } from '@/lib/llm/security/key-manager'
import { getMemoryCache } from '@/lib/llm/cache/memory-cache'
import { CachedProviderRepository } from '@/lib/llm/cache/provider-cache'
import { getAuditQueue } from '@/lib/llm/audit'
import { getMetricsCollector, estimateCost } from '@/lib/llm/metrics'
import { ResilientProvider, ErrorHandler } from '@/lib/llm/resilience'
import { getRateLimiter } from '@/lib/llm/rate-limiting'
import { getBudgetTracker, CostEstimator } from '@/lib/llm/cost'
import {
  INTENT_REGISTRY,
  type WorkflowDefinition,
  type IntentClassificationResult,
  type ExecutionContext,
  type WorkflowExecution
} from '@/lib/llm/intent-mapper'
import { apiExecutor } from '@/lib/llm/api-executor'

// NOTE: We do NOT import 'cookies' from 'next/headers' here to prevent crashes in scripts.
// We import it dynamically only when needed.

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ================================================================
// Security Utilities
// ================================================================

function sanitizeError(error: any): string {
  const message = error?.message || String(error)
  return message
    .replace(/sk-ant-[a-zA-Z0-9_-]+/g, 'sk-ant-***')
    .replace(/sk-proj-[a-zA-Z0-9_-]+/g, 'sk-proj-***')
    .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
    .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, 'Bearer ***')
}

function logError(context: string, error: any, metadata?: Record<string, any>) {
  const sanitizedError = sanitizeError(error)
  const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {}
  console.error(`[LLM Router] ${context}:`, {
    error: sanitizedError,
    ...sanitizedMetadata,
    timestamp: new Date().toISOString(),
  })
}

// Tool format
type ToolFormat =
  | { type: 'function'; function: { name: string; description: string; parameters: any } }
  | { description: string; parameters: any }

interface LLMRouterRequest {
  accountId?: string
  useCase?: 'draft' | 'summary' | 'complex' | 'vision' | 'general' | 'voice' | 'workflow'
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
  modelOverride?: string
  stream?: boolean
  tools?: Record<string, ToolFormat>
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
  maxSteps?: number
  workflow?: {
    enable: boolean
    context?: ExecutionContext
    autoExecute?: boolean
  }
}

interface LLMProvider {
  id: string
  name: string
  provider: string
  model: string
  api_key_encrypted?: string
  is_default: boolean
  use_case: string[]
  max_tokens: number
  is_active: boolean
  account_id?: string | null
}

// Cache singleton
const cache = getMemoryCache()

export async function POST(request: Request) {
  let provider: LLMProvider | null = null
  let resolvedContext: ExecutionContext | null = null
  let finalAccountId: string | null = null

  try {
    // 1. EXTRACT HEADERS
    const authHeader = request.headers.get('authorization')
    const xUserId = request.headers.get('x-user-id')
    const xAccountId = request.headers.get('x-account-id')
    const xUserRole = request.headers.get('x-user-role')

    const isServiceRole = authHeader?.startsWith('Bearer ') &&
      authHeader.substring(7) === process.env.SUPABASE_SERVICE_ROLE_KEY

    // 2. PARSE BODY
    const body: LLMRouterRequest = await request.json()
    const {
      accountId,
      useCase = 'general',
      prompt,
      systemPrompt,
      maxTokens,
      temperature,
      modelOverride,
      stream = false,
      tools,
      toolChoice = 'auto',
      maxSteps = 1,
      workflow
    } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // 3. RESOLVE CONTEXT (Prioritize Explicit Headers for Scripts/Robots)
    if (xUserId && xAccountId) {
      // PATH A: Explicit Context (Robots/Scripts/MCP)
      finalAccountId = xAccountId
      resolvedContext = {
        userId: xUserId,
        accountId: xAccountId,
        userRole: xUserRole || 'service_role',
        permissions: ['all'],
        authHeader: authHeader || undefined
      }
    } else if (isServiceRole && accountId) {
      // PATH B: Service Role with Body Param
      finalAccountId = accountId
      resolvedContext = {
        userId: 'service_role',
        accountId: accountId,
        userRole: 'service_role',
        permissions: ['all'],
        authHeader: authHeader || undefined
      }
    } else {
      // PATH C: User Session (Browser) - Only try cookies here
      // Dynamic import to prevent script crashes
      const { cookies } = await import('next/headers')
      const auth = await getAuthenticatedSession(request)

      if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: () => { } // Read-only for this check
          },
        }
      )

      const { data: user } = await supabase
        .from('users')
        .select('account_id, role')
        .eq('id', auth.user.id)
        .single()

      finalAccountId = user?.account_id || null
      resolvedContext = {
        userId: auth.user.id,
        accountId: finalAccountId || '',
        userRole: user?.role || 'user',
        permissions: [],
        authHeader: authHeader || undefined
      }
    }

    if (!finalAccountId) {
      return NextResponse.json({ error: 'Account ID could not be resolved' }, { status: 400 })
    }

    // Initialize Supabase Client for Provider Repo (Service Role is safe here)
    const supabaseService = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => { } } }
    )
    const providerRepo = new CachedProviderRepository(supabaseService, cache)

    // 4. RATE LIMITING & BUDGET (Simplified for fix)
    // In production, uncomment your rate limiting logic here

    // 5. WORKFLOW PROCESSING
    if (workflow?.enable) {
      // Merge contexts
      const mergedContext = { ...resolvedContext, ...workflow.context }

      // Pass providerRepo to avoid recursive HTTP calls
      return await processWorkflow({
        prompt,
        context: mergedContext,
        accountId: finalAccountId,
        autoExecute: workflow.autoExecute ?? false,
        useCase,
        maxTokens: maxTokens || 1000,
        temperature: temperature ?? 0.1,
        systemPrompt,
        providerRepo // Pass the repo!
      })
    }

    // 6. PROVIDER SELECTION
    if (modelOverride) {
      const all = await providerRepo.getProviders(finalAccountId)
      provider = all.find(p => p.model === modelOverride) || null
    } else {
      const byUseCase = await providerRepo.getProvidersByUseCase(useCase, finalAccountId)
      provider = byUseCase[0] || await providerRepo.getDefaultProvider(finalAccountId)
    }

    // Fallback default
    if (!provider) {
      provider = {
        id: 'default',
        name: 'openai-gpt4o-mini',
        provider: 'openai',
        model: 'gpt-4o-mini',
        is_default: true,
        use_case: ['general'],
        max_tokens: 1000,
        is_active: true,
        account_id: finalAccountId
      }
    }

    // Get API Key
    let apiKey: string | undefined
    if (provider.provider === 'openai') apiKey = process.env.OPENAI_API_KEY
    if (provider.provider === 'anthropic') apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey && provider.api_key_encrypted) apiKey = provider.api_key_encrypted

    if (!apiKey) {
      // Safe fail without crashing
      throw new Error(`Missing API Key for ${provider.provider}`)
    }

    // 7. EXECUTE LLM
    const finalMaxTokens = maxTokens || provider.max_tokens || 1000
    const finalTemperature = temperature ?? 0.7

    // Convert tools
    const convertedTools = tools ? Object.entries(tools).reduce((acc, [key, tool]) => {
      if ('type' in tool && tool.type === 'function' && 'function' in tool) {
        acc[key] = { description: tool.function.description, parameters: tool.function.parameters }
      } else {
        acc[key] = tool as any
      }
      return acc
    }, {} as any) : undefined

    // Select Model
    let model: any
    if (provider.provider === 'openai') {
      // OpenAI models: use model name directly (gpt-5.1, gpt-5, o4-mini, gpt-4o, gpt-4o-mini)
      model = openai(provider.model, { apiKey })
    } else if (provider.provider === 'anthropic') {
      // Anthropic models: map to correct SDK model names
      let modelName = provider.model
      
      // Map legacy names to current SDK names
      if (modelName === 'claude-3-5-sonnet-20241022') {
        modelName = 'claude-sonnet-4-5'
      } else if (modelName === 'claude-opus-4-5') {
        modelName = 'claude-opus-4-5' // Use as-is (SDK supports this)
      } else if (modelName === 'claude-sonnet-4-5') {
        modelName = 'claude-sonnet-4-5' // Use as-is
      } else if (modelName === 'claude-haiku-4-5') {
        modelName = 'claude-haiku-4-5' // Use as-is
      }
      // For any other claude-* models, try to use as-is
      
      model = anthropic(modelName, { apiKey })
    } else {
      throw new Error(`Unsupported provider: ${provider.provider}`)
    }

    // Generate
    if (stream) {
      const result = streamText({
        model, system: systemPrompt, prompt, maxTokens: finalMaxTokens, temperature: finalTemperature,
        tools: convertedTools, toolChoice: toolChoice as any, maxSteps: convertedTools ? maxSteps : undefined
      })
      return result.toDataStreamResponse()
    } else {
      const result = await generateText({
        model, system: systemPrompt, prompt, maxTokens: finalMaxTokens, temperature: finalTemperature,
        tools: convertedTools, toolChoice: toolChoice as any, maxSteps: convertedTools ? maxSteps : undefined
      })

      return NextResponse.json({
        success: true,
        text: result.text,
        provider: provider.name,
        model: provider.model,
        toolCalls: result.toolCalls,
        usage: result.usage
      })
    }

  } catch (error: any) {
    // Only access provider.name if provider exists
    if (provider) {
      logError('Request failed', error, { provider: provider.name })
    } else {
      logError('Request failed (No Provider)', error)
    }

    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// ================================================================
// WORKFLOW LOGIC (Fixed Recursion)
// ================================================================

interface WorkflowProcessingOptions {
  prompt: string
  context: ExecutionContext
  accountId: string
  autoExecute: boolean
  useCase: string
  maxTokens: number
  temperature: number
  systemPrompt?: string
  providerRepo: CachedProviderRepository
}

async function processWorkflow(options: WorkflowProcessingOptions): Promise<Response> {
  try {
    // 1. CLASSIFY (Internal Call)
    const classification = await classifyIntentInternal(options)

    if (!classification.workflow) {
      return NextResponse.json({
        success: false,
        error: 'No matching workflow found',
        message: "I couldn't understand what you want to do."
      }, { status: 400 })
    }

    // 2. CHECK MISSING INFO
    if (classification.missingInfo && classification.missingInfo.length > 0) {
      return NextResponse.json({
        success: false,
        requiresInput: true,
        workflow: classification.workflow.id,
        missingInfo: classification.missingInfo,
        extractedVariables: classification.variables
      })
    }

    // 3. EXECUTE OR PLAN
    if (options.autoExecute) {
      const execution: WorkflowExecution = {
        workflow: classification.workflow,
        context: options.context,
        inputVariables: classification.variables,
        stepVariables: {},
        currentStep: 0,
        stepResults: []
      }

      const executionResult = await apiExecutor.executeWorkflow(execution)

      return NextResponse.json({
        success: true,
        workflow: classification.workflow.id,
        execution: executionResult
      })
    } else {
      // Return Plan
      return NextResponse.json({
        success: true,
        workflow: classification.workflow.id,
        plan: classification.workflow.steps,
        classification
      })
    }

  } catch (error) {
    console.error('[Workflow] Error:', error)
    return NextResponse.json({ success: false, error: 'Workflow Error' }, { status: 500 })
  }
}

// ==============================================================================
// PROFESSIONAL ARCHITECT - Bounded Autonomy Implementation
// ==============================================================================

// 1. DEFINE THE TOOLKIT (The "Menu" available to the AI)
const AVAILABLE_TOOLS_SUMMARY = `
AVAILABLE TOOLS (Strictly limit plans to these functions):
- FINANCIAL: get_dashboard_stats, get_revenue_analytics, list_invoices, create_invoice, process_crypto_payment, generate_report
- JOBS: list_jobs, get_job, create_job, update_job_status, assign_tech_by_name, get_my_jobs, get_tech_jobs, get_job_analytics
- CONTACTS: list_contacts, get_contact, create_contact, update_contact, analyze_customer_sentiment, predict_customer_churn
- ESTIMATES: create_estimate, ai_estimate_job, create_formal_estimate_from_ai, calculate_dynamic_pricing
- FIELD: upload_job_photo, analyze_job_photos, clock_in, clock_out, capture_location, monitor_compliance, verify_signature
- ADMIN: list_users, get_audit_logs, list_automation_rules, create_notification, get_account_settings
- COMMS: send_email, list_conversations, send_message, add_job_note
`;

async function classifyIntentInternal(options: WorkflowProcessingOptions): Promise<IntentClassificationResult> {
  // 2. THE ARCHITECT PROMPT
  const systemPrompt = `You are the CRM AI Architect. 
  Your goal is to analyze the user's request and construct a DETERMINISTIC execution plan using ONLY the available tools.
  
  ${AVAILABLE_TOOLS_SUMMARY}

  CORE DIRECTIVES:

  1. **Professionalism:** Maintain a formal, efficient operational tone.

  2. **Determinism:** Do not hallucinate tools. If a request cannot be fulfilled by the tools listed, fall back to "general_inquiry".

  3. **Logical Chaining:** If a user asks for a multi-step task (e.g., "Estimate then Email"), chain the tools in logical order.
  
  INSTRUCTIONS:

  1. Identify the user's intent.

  2. Select the most relevant High-Level Workflow ID from: ["executive_action", "dispatch_operations", "sales_engagement", "field_work", "admin_compliance"].

  3. CHAIN OF THOUGHT: Reason step-by-step. What inputs are needed? What outputs flow into the next step?

  4. GENERATE STEPS: Create an array of tool calls.

     - PARAMETERS: Extract specific values from the prompt (e.g., "today", "Allen Talley"). If a parameter is missing but required, use a reasonable default or leave blank for the UI to prompt.

  RESPONSE FORMAT (JSON ONLY):

  {
    "workflowId": "selected_domain_id",
    "confidence": 0.95,
    "thought_process": "Brief explanation of the plan.",
    "dynamic_steps": [
      { 
        "tool": "exact_tool_name_from_list", 
        "description": "Professional description of action", 
        "parameters": { "paramName": "extracted_value" },
        "endpoint": "mcp:exact_tool_name_from_list",
        "method": "POST"
      }
    ]
  }
  `;

  const model = openai('gpt-4o', { apiKey: process.env.OPENAI_API_KEY })

  try {
    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: options.prompt,
      temperature: 0.0, // ZERO temperature ensures maximum determinism
    })

    const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    // Fallback if the LLM hallucinates an invalid ID
    const baseWorkflow = INTENT_REGISTRY[data.workflowId] || INTENT_REGISTRY['general_inquiry'];

    // Hydrate the workflow with the dynamic plan
    const dynamicWorkflow = {
        ...baseWorkflow,
        steps: data.dynamic_steps || []
    };

    return {
      workflow: dynamicWorkflow,
      confidence: data.confidence,
      variables: {}, 
      missingInfo: []
    }
  } catch (e) {
    console.error("[Planner] Failed:", e);
    return { workflow: INTENT_REGISTRY['general_inquiry'], confidence: 0, variables: {} }
  }
}