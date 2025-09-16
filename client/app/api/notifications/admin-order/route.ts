import { NextRequest, NextResponse } from 'next/server'
import { notifyAdminOrderCreated } from '@/lib/notifications/service'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      order_id, 
      customer_email, 
      customer_name, 
      total_amount, 
      currency, 
      payment_method, 
      payment_status, 
      items_count 
    } = body

    if (!order_id || !customer_email || !customer_name || !total_amount) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, customer_email, customer_name, total_amount' },
        { status: 400 }
      )
    }

    console.log('Sending admin notification for order:', order_id)

    // Send admin notification using the service function
    const result = await notifyAdminOrderCreated({
      order_id,
      customer_email,
      customer_name,
      total_amount,
      currency: currency || 'TZS',
      payment_method: payment_method || 'Unknown',
      payment_status: payment_status || 'pending',
      items_count: items_count || 0
    })

    console.log('Admin notification result:', result)

    return NextResponse.json({ success: true, result }, { status: 200 })
  } catch (error) {
    console.error('Failed to send admin order notification:', error)
    return NextResponse.json(
      { error: 'Failed to send admin notification' },
      { status: 500 }
    )
  }
}
