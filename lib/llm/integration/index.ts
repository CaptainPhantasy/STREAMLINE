/**
 * LLM Integration Module
 *
 * Exports all integration utilities for calling the LLM Router from API routes.
 *
 * @module lib/llm/integration
 */

export {
  LLMRouterClient,
  LLMRouterError,
  LLMRouterTimeoutError,
  LLMRouterAuthError,
  createRouterClient,
  routerCall,
  routerCallStream,
} from './router-client'

export type {
  UseCase,
  ToolFormat,
  RouterCallOptions,
  RouterResponse,
} from './router-client'
