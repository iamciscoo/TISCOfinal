import { NextRequest, NextResponse } from 'next/server'
import { getOrderById } from '@/lib/database'

type Params = { params: Promise<{ id: string }> }

/**
 * GET /api/orders/[id]/receipt
 * Returns order data in JSON format for client-side PDF generation
 * This avoids server-side PDF generation which can be problematic in serverless environments
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    console.log('Fetching order for receipt:', id)
    
    // Fetch order with all related data
    const order = await getOrderById(id)
    
    if (!order) {
      console.error('Order not found:', id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    console.log('Order found, returning data for receipt generation')
    
    // Return order data for client-side PDF generation
    return NextResponse.json({ 
      success: true,
      order 
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      }
    })
    
  } catch (error: unknown) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch order data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
