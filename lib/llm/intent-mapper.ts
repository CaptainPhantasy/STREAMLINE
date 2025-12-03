// File: lib/llm/intent-mapper.ts
import type { WorkflowDefinition } from './types'

/**
 * INTENT_REGISTRY - UNIVERSAL CAPABILITY DOMAINS
 * Defines the boundaries of the AI's capabilities.
 * The Router uses Chain of Thought to dynamically compose steps within these domains.
 */

export const INTENT_REGISTRY: Record<string, WorkflowDefinition> = {
  
  // 1. EXECUTIVE & FINANCIAL (Owner)
  "executive_action": {
    id: "executive_action",
    description: "High-level business intelligence, financials, and urgent oversight.",
    steps: [] // Dynamic resolution
  },

  // 2. DISPATCH & OPERATIONS (Dispatcher)
  "dispatch_operations": {
    id: "dispatch_operations",
    description: "Scheduling, routing, technician management, and emergency response.",
    steps: []
  },

  // 3. SALES & GROWTH (Sales)
  "sales_engagement": {
    id: "sales_engagement",
    description: "Lead management, proposal generation, pricing, and customer interaction.",
    steps: []
  },

  // 4. FIELD EXECUTION (Technician)
  "field_work": {
    id: "field_work",
    description: "On-site job execution, documentation, and technical compliance.",
    steps: []
  },

  // 5. SYSTEM ADMINISTRATION (Admin)
  "admin_compliance": {
    id: "admin_compliance",
    description: "System health, user management, audit logs, and configuration.",
    steps: []
  },

  // Fallback
  "general_inquiry": {
    id: "general_inquiry",
    description: "General questions or chat not requiring tool execution.",
    steps: []
  }
};

export function getIntentWorkflow(intent: string): WorkflowDefinition | undefined {
  return INTENT_REGISTRY[intent];
}

export function hasIntent(intent: string): boolean {
  return intent in INTENT_REGISTRY;
}

export function getAllIntents(): string[] {
  return Object.keys(INTENT_REGISTRY);
}
