import { describe, expect, it } from 'vitest'
import { handleMCPRequest } from './server'

describe('STREAMLINE MCP bridge', () => {
  it('discovers and calls the built-in health tool', async () => {
    const listed = await handleMCPRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
    expect('result' in listed && listed.result).toMatchObject({
      tools: expect.arrayContaining([expect.objectContaining({ name: 'system.health' })]),
    })

    const called = await handleMCPRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'system.health', arguments: {} },
    }, 'operator')
    expect('result' in called && called.result).toEqual({ ok: true, authenticatedUser: true })
  })

  it('rejects unknown tools', async () => {
    const response = await handleMCPRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'missing', arguments: {} },
    })
    expect('error' in response && response.error.code).toBe(-32601)
  })
})
