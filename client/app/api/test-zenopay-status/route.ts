import { NextRequest, NextResponse } from 'next/server'
import { ZenoPayClient } from '@/lib/zenopay'

export async function POST(req: NextRequest) {
  try {
    const { transaction_reference } = await req.json()
    
    if (!transaction_reference) {
      return NextResponse.json({ error: 'transaction_reference required' }, { status: 400 })
    }

    console.log('Testing ZenoPay status API for:', transaction_reference)
    
    const client = new ZenoPayClient()
    const response = await client.getOrderStatus(transaction_reference)
    
    console.log('ZenoPay API Response:', JSON.stringify(response, null, 2))
    
    return NextResponse.json({
      success: true,
      transaction_reference,
      zenopay_response: response,
      response_type: typeof response,
      is_array: Array.isArray(response),
      has_data_property: response && typeof response === 'object' && 'data' in response,
      has_payment_status: response && typeof response === 'object' && 'payment_status' in response,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('ZenoPay status test error:', error)
    return NextResponse.json({ 
      error: 'Failed to test ZenoPay status',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
