type JSONRPCRequest = {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: Record<string, unknown>
}

type Tool = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  execute: (input: Record<string, unknown>, userId?: string) => unknown | Promise<unknown>
}

const tools = new Map<string, Tool>()

export function registerMCPTool(tool: Tool): () => void {
  if (tools.has(tool.name)) throw new Error(`MCP tool already registered: ${tool.name}`)
  tools.set(tool.name, tool)
  return () => tools.delete(tool.name)
}

registerMCPTool({
  name: 'system.health',
  description: 'Return the local STREAMLINE MCP bridge status.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  execute: (_input, userId) => ({ ok: true, authenticatedUser: Boolean(userId) }),
})

export async function handleMCPRequest(request: JSONRPCRequest, userId?: string) {
  if (request.method === 'tools/list') {
    return {
      jsonrpc: '2.0' as const,
      id: request.id,
      result: {
        tools: [...tools.values()].map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      },
    }
  }

  if (request.method === 'tools/call') {
    const name = request.params?.name
    const input = request.params?.arguments
    if (typeof name !== 'string' || !input || typeof input !== 'object' || Array.isArray(input)) {
      return rpcError(request.id, -32602, 'Invalid tool call parameters')
    }
    const tool = tools.get(name)
    if (!tool) return rpcError(request.id, -32601, `Unknown tool: ${name}`)

    try {
      return { jsonrpc: '2.0' as const, id: request.id, result: await tool.execute(input as Record<string, unknown>, userId) }
    } catch (error) {
      return rpcError(request.id, -32000, error instanceof Error ? error.message : 'Tool execution failed')
    }
  }

  return rpcError(request.id, -32601, `Unknown method: ${request.method}`)
}

function rpcError(id: string | number, code: number, message: string) {
  return { jsonrpc: '2.0' as const, id, error: { code, message } }
}
