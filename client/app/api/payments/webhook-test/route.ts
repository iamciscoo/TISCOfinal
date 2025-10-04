import { NextRequest, NextResponse } from 'next/server'

// Simple webhook accessibility test endpoint
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'webhook_accessible',
    message: 'ZenoPay webhook endpoint is reachable',
    timestamp: new Date().toISOString(),
    origin: req.nextUrl.origin,
    webhook_url: `${req.nextUrl.origin}/api/payments/webhooks`,
    headers: Object.fromEntries(req.headers.entries())
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    
    return NextResponse.json({
      status: 'webhook_test_success',
      message: 'Webhook POST request received successfully',
      timestamp: new Date().toISOString(),
      received_data: body,
      headers: Object.fromEntries(req.headers.entries()),
      webhook_url: `${req.nextUrl.origin}/api/payments/webhooks`
    })
  } catch (error) {
    return NextResponse.json({
      status: 'webhook_test_error',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
