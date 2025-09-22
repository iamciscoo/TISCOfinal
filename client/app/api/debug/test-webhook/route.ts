import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  console.log('=== TEST WEBHOOK STARTED ===')
  
  try {
    // Test basic environment variables
    const envTest = {
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_service_role: !!process.env.SUPABASE_SERVICE_ROLE,
      webhook_secret: !!process.env.WEBHOOK_SECRET,
      zenopay_api_key: !!process.env.ZENOPAY_API_KEY,
      sendpulse_client_id: !!process.env.SENDPULSE_CLIENT_ID,
      sendpulse_client_secret: !!process.env.SENDPULSE_CLIENT_SECRET,
    }
    console.log('Environment check:', envTest)
    
    // Test Supabase connection
    let supabaseTest: { connected: boolean; error: string | null } = { connected: false, error: null }
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (url && serviceKey) {
        const supabase = createClient(url, serviceKey)
        const { error } = await supabase.from('orders').select('id').limit(1)
        supabaseTest = { connected: !error, error: error?.message || null }
        console.log('Supabase test:', supabaseTest)
      } else {
        supabaseTest = { connected: false, error: 'Missing URL or service key' }
      }
    } catch (error) {
      supabaseTest = { connected: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    // Test SendPulse token
    let sendpulseTest: { tokenObtained: boolean; error: string | null } = { tokenObtained: false, error: null }
    try {
      const clientId = process.env.SENDPULSE_CLIENT_ID
      const clientSecret = process.env.SENDPULSE_CLIENT_SECRET
      
      if (clientId && clientSecret) {
        const tokenUrl = 'https://api.sendpulse.com/oauth/access_token'
        const body = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        })
        
        const res = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          cache: 'no-store',
        })
        
        if (res.ok) {
          const json = await res.json()
          sendpulseTest = { tokenObtained: !!json.access_token, error: null }
        } else {
          const errorText = await res.text()
          sendpulseTest = { tokenObtained: false, error: `${res.status}: ${errorText}` }
        }
      } else {
        sendpulseTest = { tokenObtained: false, error: 'Missing client ID or secret' }
      }
      console.log('SendPulse test:', sendpulseTest)
    } catch (error) {
      sendpulseTest = { tokenObtained: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
    
    // Test webhook authentication simulation
    const webhookAuthTest = { hmacWorks: false, apiKeyWorks: false }
    try {
      const crypto = await import('crypto')
      const testBody = '{"test": true}'
      const webhookSecret = process.env.WEBHOOK_SECRET
      const apiKey = process.env.ZENOPAY_API_KEY
      
      if (webhookSecret) {
        const hmac = crypto.createHmac('sha256', webhookSecret)
        hmac.update(testBody, 'utf8')
        const expectedHex = hmac.digest('hex')
        webhookAuthTest.hmacWorks = expectedHex.length > 0
      }
      
      webhookAuthTest.apiKeyWorks = !!apiKey
      console.log('Webhook auth test:', webhookAuthTest)
    } catch (error) {
      console.error('Webhook auth test error:', error)
    }
    
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {
        environment: envTest,
        supabase: supabaseTest,
        sendpulse: sendpulseTest,
        webhookAuth: webhookAuthTest,
      }
    }
    
    console.log('Test webhook result:', result)
    return NextResponse.json(result, { status: 200 })
    
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
