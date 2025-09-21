import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Temporary webhook capture endpoint to log all incoming webhook attempts
export async function POST(req: NextRequest) {
  try {
    const timestamp = new Date().toISOString()
    const headers = Object.fromEntries(req.headers.entries())
    const rawBody = await req.text()
    
    console.log('=== WEBHOOK CAPTURE ===', timestamp)
    console.log('Headers:', JSON.stringify(headers, null, 2))
    console.log('Raw Body:', rawBody)
    
    let parsedBody
    try {
      parsedBody = JSON.parse(rawBody)
      console.log('Parsed Body:', JSON.stringify(parsedBody, null, 2))
    } catch {
      console.log('Body is not valid JSON')
    }
    
    console.log('=== END WEBHOOK CAPTURE ===')
    
    return NextResponse.json({ 
      received: true, 
      timestamp,
      message: 'Webhook captured and logged'
    })
  } catch (error) {
    console.error('Webhook capture error:', error)
    return NextResponse.json({ error: 'Capture failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Webhook capture endpoint active',
    url: req.url,
    timestamp: new Date().toISOString()
  })
}
