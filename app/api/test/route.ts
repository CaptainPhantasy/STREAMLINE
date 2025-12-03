import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API route is working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    return NextResponse.json({ 
      success: true, 
      message: 'POST route is working',
      received: body,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

