import { NextRequest, NextResponse } from 'next/server'
import { notificationService, NotificationEvent } from '@/lib/notifications/service'

/**
 * Generic notification endpoint that supports multiple notification events
 * Accepts event + data payload and sends appropriate notification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, recipient_email, recipient_name, data, type } = body

    // Support both new event-based format and legacy type format
    const notificationEvent = event || type

    if (!notificationEvent) {
      return NextResponse.json({ error: 'Missing event or type' }, { status: 400 })
    }

    // For legacy compatibility, map old 'type' to new 'event' format
    const eventMap: Record<string, string> = {
      'order_created': 'order_created',
      'booking_created': 'booking_created',
      'payment_success': 'payment_success',
      'payment_failed': 'payment_failed'
    }

    const mappedEvent = eventMap[notificationEvent] || notificationEvent

    // Validate required fields
    if (!recipient_email) {
      return NextResponse.json({ error: 'Missing recipient_email' }, { status: 400 })
    }

    console.log(`📧 Sending ${mappedEvent} notification to ${recipient_email}`)

    // Send notification using the unified notification service
    const notificationId = await notificationService.sendNotification({
      event: mappedEvent as NotificationEvent,
      recipient_email,
      recipient_name: recipient_name || 'Customer',
      data: data || {}
    })

    console.log(`✅ ${mappedEvent} notification sent successfully:`, notificationId)

    return NextResponse.json({ 
      success: true, 
      notification_id: notificationId,
      message: 'Notification sent successfully' 
    })

  } catch (error: unknown) {
    console.error('❌ Notification API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
