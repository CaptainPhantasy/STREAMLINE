import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { crmTools, handleCrmTool } from './crm-tools'
import { emailTools, handleEmailTool } from './email-tools'

export const allTools: Tool[] = [...crmTools, ...emailTools]

// Create sets of tool names for efficient lookup
const crmToolNames = new Set(crmTools.map((tool) => tool.name))
const emailToolNames = new Set(emailTools.map((tool) => tool.name))

export async function callTool(name: string, args: Record<string, unknown>, userId?: string) {
  if (crmToolNames.has(name)) {
    return handleCrmTool(name, args, userId)
  }
  if (emailToolNames.has(name)) {
    return handleEmailTool(name, args)
  }
  throw new Error(`Unknown tool: ${name}`)
}

export function listTools(): Tool[] { return allTools }

