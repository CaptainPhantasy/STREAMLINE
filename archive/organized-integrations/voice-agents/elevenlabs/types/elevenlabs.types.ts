/**
 * ElevenLabs Voice Agent TypeScript Definitions
 *
 * Type definitions for the ElevenLabs voice agent module.
 */

import { ReactNode } from 'react'

/**
 * Voice conversation context interface
 */
export interface VoiceConversationContextValue {
  conversation: {
    status: 'disconnected' | 'connecting' | 'connected' | 'error'
    isSpeaking: boolean
    startSession: (payload?: any) => Promise<void>
    endSession: () => Promise<void>
  }
  startSessionWithTools: () => Promise<void>
}

/**
 * User context for ElevenLabs session
 */
export interface UserContext {
  user_identifier: string
  user_name: string
  user_role: string
  account_id: string
}

/**
 * Client tool parameter structure
 */
export interface ClientToolParameters {
  type: 'object'
  properties: Record<string, {
    type: string
    description: string
  }>
  required?: string[]
}

/**
 * Client tool handler function type
 */
export type ClientToolHandler<TParams = any, TResult = any> = (
  params: TParams
) => Promise<TResult>

/**
 * Client tool definition
 */
export interface ClientTool<TParams = any, TResult = any> {
  description: string
  parameters: ClientToolParameters
  handler: ClientToolHandler<TParams, TResult>
}

/**
 * Navigation tool parameters
 */
export interface NavigationToolParams {
  route: string
}

/**
 * Scroll to section tool parameters
 */
export interface ScrollToSectionParams {
  sectionId: string
}

/**
 * UI action tool parameters
 */
export interface UIActionParams {
  action: string
  payload?: Record<string, unknown>
}

/**
 * Open new tab tool parameters
 */
export interface OpenNewTabParams {
  url: string
}

/**
 * Voice agent widget props
 */
export interface VoiceAgentWidgetProps {
  className?: string
  onStatusChange?: (status: string) => void
  onError?: (error: Error) => void
}

/**
 * ElevenLabs session payload
 */
export interface ElevenLabsSessionPayload {
  agentId: string
  clientTools: Record<string, ClientTool>
  variableValues?: UserContext
}

/**
 * Voice provider wrapper props
 */
export interface VoiceProviderWrapperProps {
  children: ReactNode
}

/**
 * Voice navigation bridge props
 */
export interface VoiceNavigationBridgeProps {
  children?: ReactNode
}

/**
 * Error boundary state
 */
export interface VoiceErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

/**
 * Voice agent configuration
 */
export interface VoiceAgentConfig {
  enabled: boolean
  provider: 'elevenlabs' | 'google'
  agentId: string
  apiKey?: string
  isValid: boolean
  validationErrors: string[]
}

/**
 * Navigation result
 */
export interface NavigationResult {
  success: boolean
  message: string
  previousRoute: string
  newRoute: string
  originalRequest: string
}

/**
 * Current page result
 */
export interface CurrentPageResult {
  currentRoute: string
  message: string
}

/**
 * Scroll result
 */
export interface ScrollResult {
  success: boolean
  message: string
}

/**
 * UI action result
 */
export interface UIActionResult {
  success: boolean
  message: string
  action: string
  payload?: Record<string, unknown>
}

/**
 * Open new tab result
 */
export interface OpenNewTabResult {
  success: boolean
  message: string
}

/**
 * ElevenLabs conversation event callbacks
 */
export interface ElevenLabsConversationCallbacks {
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: any) => void
  onStatusChange?: (status: string) => void
}