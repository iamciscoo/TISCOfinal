import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      phone_number, 
      message_type, 
      message_content, 
      template_data, 
      priority = 'normal',
      send_immediately = false
    } = await req.json()

    if (!phone_number || !message_type) {
      return NextResponse.json({ 
        error: 'Phone number and message type are required' 
      }, { status: 400 })
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(phone_number.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
    }

    // Validate SMS template exists
    const allowedMessageTypes = [
      'order_confirmation',
      'order_status_update',
      'payment_success',
      'delivery_notification',
      'verification_code',
      'appointment_reminder',
      'promotional',
      'cart_abandonment',
      'low_stock_alert'
    ]

    if (!allowedMessageTypes.includes(message_type)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Generate message content if not provided
    const finalMessage = message_content || generateSMSMessage(message_type, template_data)

    // Check message length (SMS limit is typically 160 characters)
    if (finalMessage.length > 160) {
      return NextResponse.json({ 
        error: 'Message too long. SMS messages must be 160 characters or less.' 
      }, { status: 400 })
    }

    // Create SMS notification record
    const { data: notification, error } = await supabase
      .from('sms_notifications')
      .insert({
        user_id: user.id,
        phone_number: phone_number.replace(/\s/g, ''),
        message_type,
        message_content: finalMessage,
        template_data: template_data || {},
        priority,
        status: send_immediately ? 'pending' : 'queued',
        scheduled_for: send_immediately ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send SMS immediately if requested
    if (send_immediately) {
      try {
        await sendSMS(notification)
      } catch (smsError) {
        console.error('SMS send error:', smsError)
        // Update notification status to failed
        await supabase
          .from('sms_notifications')
          .update({ 
            status: 'failed', 
            error_message: (smsError as Error).message,
            failed_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }
    }

    return NextResponse.json({ 
      notification_id: notification.id,
      status: notification.status,
      message: send_immediately ? 'SMS sent' : 'SMS queued for sending',
      character_count: finalMessage.length
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('SMS notification error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process SMS notification' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const message_type = searchParams.get('message_type')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('sms_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (message_type) {
      query = query.eq('message_type', message_type)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] }, { status: 200 })

  } catch (error: unknown) {
    console.error('SMS notifications fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch SMS notifications' },
      { status: 500 }
    )
  }
}

function generateSMSMessage(message_type: string, template_data: any = {}): string {
  const messages = {
    order_confirmation: `TISCO: Order #${template_data.order_id} confirmed. Total: ${template_data.total}. Track: ${template_data.tracking_url}`,
    order_status_update: `TISCO: Order #${template_data.order_id} status: ${template_data.status}. ${template_data.message || ''}`,
    payment_success: `TISCO: Payment successful for order #${template_data.order_id}. Amount: ${template_data.amount}`,
    delivery_notification: `TISCO: Your order #${template_data.order_id} is out for delivery. Expected: ${template_data.estimated_time}`,
    verification_code: `TISCO: Your verification code is ${template_data.code}. Valid for 10 minutes.`,
    appointment_reminder: `TISCO: Reminder - ${template_data.service} appointment on ${template_data.date} at ${template_data.time}`,
    promotional: template_data.message || 'TISCO: Special offer! Visit our store for exclusive deals.',
    cart_abandonment: `TISCO: Items in your cart are waiting! Complete your purchase: ${template_data.cart_url}`,
    low_stock_alert: `TISCO: Only ${template_data.stock} left for ${template_data.product_name}. Order now!`
  }
  
  return messages[message_type as keyof typeof messages] || 'TISCO: Notification'
}

async function sendSMS(notification: any): Promise<void> {
  // Mock SMS sending implementation
  // In production, integrate with services like:
  // - Twilio
  // - AWS SNS
  // - Africa's Talking
  // - MessageBird
  // - Vonage
  
  console.log('Sending SMS:', {
    to: notification.phone_number,
    message: notification.message_content,
    type: notification.message_type
  })

  // Simulate SMS sending delay
  await new Promise(resolve => setTimeout(resolve, 200))

  // Mock success/failure (95% success rate for SMS)
  if (Math.random() > 0.95) {
    throw new Error('SMS service temporarily unavailable')
  }

  // Update notification status to sent
  await supabase
    .from('sms_notifications')
    .update({ 
      status: 'sent', 
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id)
}
