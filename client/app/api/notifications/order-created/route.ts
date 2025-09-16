import { NextRequest, NextResponse } from 'next/server'
import { notifyOrderCreated } from '@/lib/notifications/service'

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()
    
    console.log('=== ORDER CONFIRMATION NOTIFICATION REQUEST ===')
    console.log('Order data:', JSON.stringify(orderData, null, 2))
    
    // Validate required fields
    if (!orderData.order_id || !orderData.customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and customer_email' },
        { status: 400 }
      )
    }
    
    // Send the notification
    const notificationId = await notifyOrderCreated(orderData)
    
    console.log('✅ Order confirmation email sent successfully, notification ID:', notificationId)
    
    return NextResponse.json({ 
      success: true, 
      notification_id: notificationId,
      message: 'Order confirmation email sent successfully'
    })
    
  } catch (error) {
    console.error('❌ Order confirmation notification error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to send order confirmation email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
