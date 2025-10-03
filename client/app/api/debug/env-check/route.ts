// Temporary production environment debugging endpoint
// This will help identify environment variable issues
// ⚠️ REMOVE AFTER DEBUGGING - Contains sensitive info

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Basic security - only allow in development or with debug key
  const debugKey = req.nextUrl.searchParams.get('key')
  const expectedKey = process.env.ADMIN_DEBUG_KEY || 'temp-debug-2025'
  
  if (process.env.NODE_ENV === 'production' && debugKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check environment variables (safely)
  const envCheck = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE,
    hasZenoPayKey: !!process.env.ZENOPAY_API_KEY,
    hasWebhookSecret: !!process.env.WEBHOOK_SECRET,
    // Show first/last few chars for debugging without exposing full keys
    zenoPayKeyPreview: process.env.ZENOPAY_API_KEY ? 
      `${process.env.ZENOPAY_API_KEY.substring(0, 10)}...${process.env.ZENOPAY_API_KEY.substring(process.env.ZENOPAY_API_KEY.length - 10)}` : 
      'NOT SET',
    zenoPayKeyLength: process.env.ZENOPAY_API_KEY?.length || 0,
    webhookSecretLength: process.env.WEBHOOK_SECRET?.length || 0,
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    allEnvVars: Object.keys(process.env).filter(key => 
      key.includes('ZENOPAY') || 
      key.includes('WEBHOOK') || 
      key.includes('SUPABASE')
    )
  }
  
  return NextResponse.json(envCheck)
}

export async function POST(req: NextRequest) {
  // Test webhook authentication logic
  const debugKey = req.nextUrl.searchParams.get('key')
  const expectedKey = process.env.ADMIN_DEBUG_KEY || 'temp-debug-2025'
  
  if (process.env.NODE_ENV === 'production' && debugKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const body = await req.json()
  const testApiKey = body.testApiKey || req.headers.get('x-api-key')
  
  const actualApiKey = process.env.ZENOPAY_API_KEY
  
  const authTest = {
    testKeyReceived: !!testApiKey,
    actualKeyExists: !!actualApiKey,
    keysMatch: actualApiKey === testApiKey,
    testKeyLength: testApiKey?.length || 0,
    actualKeyLength: actualApiKey?.length || 0,
    testKeyPreview: testApiKey ? `${testApiKey.substring(0, 10)}...${testApiKey.substring(testApiKey.length - 10)}` : 'NONE',
    actualKeyPreview: actualApiKey ? `${actualApiKey.substring(0, 10)}...${actualApiKey.substring(actualApiKey.length - 10)}` : 'NOT SET'
  }
  
  return NextResponse.json(authTest)
}
