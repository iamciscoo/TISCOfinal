import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // Simple debug check - no auth required for environment verification
    const apiKey = process.env.ZENOPAY_API_KEY
    const baseUrl = process.env.ZENOPAY_BASE_URL || 'https://zenoapi.com/api/payments'
    
    return NextResponse.json({
      status: 'Environment Check',
      zenopay_api_key_set: !!apiKey,
      zenopay_api_key_length: apiKey?.length || 0,
      zenopay_api_key_first_10: apiKey?.substring(0, 10) || 'NOT_SET',
      zenopay_base_url: baseUrl,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Environment check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
