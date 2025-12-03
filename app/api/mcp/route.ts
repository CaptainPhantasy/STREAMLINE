import { NextRequest, NextResponse } from 'next/server'
import { handleMCPRequest } from '@/lib/mcp/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  let requestId: string | number | undefined
  try {
    const body = await request.json()
    requestId = body.id

    if (!body.jsonrpc || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        { jsonrpc: '2.0', id: requestId, error: { code: -32600, message: 'Invalid Request' } },
        { status: 400 }
      )
    }

    // Support both Bearer token and x-api-key header
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : undefined
    const apiKey = request.headers.get('x-api-key') || undefined
    const userId = bearerToken || apiKey
    const response = await handleMCPRequest(body, userId)
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: requestId,
      error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' }
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ success: true, service: 'mcp-server', status: 'running' })
}

