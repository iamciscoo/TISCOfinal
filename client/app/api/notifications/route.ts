import { NextRequest, NextResponse } from 'next/server'
import { notifyBookingCreated, notifyAdminBookingCreated } from '@/lib/notifications/service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    let notificationId: string

    switch (type) {
      case 'order_created':
        if (!data.order_id || !data.customer_email || !data.customer_name) {
          return NextResponse.json({ error: 'Missing required order data' }, { status: 400 })
        }
        
        // Note: Customer already received order confirmation during order creation
        // Admin notifications are handled during order creation
        // This endpoint should not send duplicate notifications for order events
        console.log('Order notifications already handled during order creation - skipping duplicates')
        notificationId = 'skipped-duplicate-order-notification'

        break

      case 'booking_created':
        if (!data.booking_id || !data.contact_email || !data.service_name) {
          return NextResponse.json({ error: 'Missing required booking data' }, { status: 400 })
        }
        
        // Send customer booking notification
        try {
          notificationId = await notifyBookingCreated({
            booking_id: data.booking_id,
            contact_email: data.contact_email,
            customer_name: data.customer_name || 'Unknown User',
            service_name: data.service_name || 'Unknown Service',
            preferred_date: data.preferred_date || 'Not specified',
            preferred_time: data.preferred_time || 'Not specified',
            description: data.description || 'No description provided',
            service_type: data.service_type || 'standard'
          })
          console.log('Customer booking notification sent successfully:', notificationId)
        } catch (error) {
          console.error('Failed to send customer booking notification:', error)
          notificationId = 'failed-customer-booking-notification'
        }

        // Send admin booking notifications
        try {
          await notifyAdminBookingCreated({
            booking_id: data.booking_id,
            contact_email: data.contact_email,
            customer_name: data.customer_name || 'Unknown User',
            service_name: data.service_name || 'Unknown Service',
            preferred_date: data.preferred_date || 'Not specified',
            preferred_time: data.preferred_time || 'Not specified',
            description: data.description || 'No description provided',
            service_type: data.service_type || 'standard'
          })
          console.log('Admin booking notification sent successfully')
        } catch (error) {
          console.error('Failed to send admin booking notification:', error)
        }

        break

      default:
        return NextResponse.json({ error: 'Unsupported notification type' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      notification_id: notificationId,
      message: 'Notification sent successfully' 
    })

  } catch (error: unknown) {
    console.error('Notification API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
