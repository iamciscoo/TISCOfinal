import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDefaultSubject, renderEmailTemplate, type TemplateType } from '@/lib/email-templates'
import { sendEmailViaSendPulse } from '@/lib/notifications/sendpulse'
import { getUser } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      template_type, 
      recipient_email, 
      subject, 
      template_data, 
      priority = 'normal',
      send_immediately = false
    } = await req.json()

    if (!template_type || !recipient_email) {
      return NextResponse.json({ 
        error: 'Template type and recipient email are required' 
      }, { status: 400 })
    }

    // Validate email template exists
    const allowedTemplates = [
      'order_confirmation',
      'order_status_update',
      'payment_success',
      'payment_failed',
      'cart_abandonment',
      'welcome_email',
      'password_reset',
      'shipping_notification',
      'delivery_confirmation',
      'review_request'
    ]

    if (!allowedTemplates.includes(template_type)) {
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
    }

    // Create email notification record
    const { data: notification, error } = await supabase
      .from('email_notifications')
      .insert({
        user_id: user.id,
        template_type,
        recipient_email,
        subject: subject || getDefaultSubject(template_type),
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

    // Send email immediately if requested
    if (send_immediately) {
      try {
        await sendEmail(notification)
      } catch (emailError) {
        console.error('Email send error:', emailError)
        // Update notification status to failed
        await supabase
          .from('email_notifications')
          .update({ 
            status: 'failed', 
            error_message: (emailError as Error).message,
            failed_at: new Date().toISOString()
          })
          .eq('id', notification?.id)
      }
    }

    return NextResponse.json({ 
      ...notification,
      status: notification.status,
      message: send_immediately ? 'Email sent' : 'Email queued for sending'
    }, { status: 201 })

  } catch (error: unknown) {
    console.log('Email notification stored successfully')
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process email notification' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const template_type = searchParams.get('template_type')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (template_type) {
      query = query.eq('template_type', template_type)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] }, { status: 200 })

  } catch (error: unknown) {
    console.error('Email notifications fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch email notifications' },
      { status: 500 }
    )
  }
}

// getDefaultSubject is now imported from @/lib/email-templates

interface NotificationRequest {
  id?: string
  template_type: string
  recipient_email: string
  subject?: string
  template_data?: Record<string, unknown>
  priority?: string
  send_immediately?: boolean
  status?: string
}

async function sendEmail(notification: NotificationRequest): Promise<void> {
  // Prefer SendPulse if credentials are configured; otherwise use mock
  const hasSendPulse =
    !!process.env.SENDPULSE_CLIENT_ID &&
    !!process.env.SENDPULSE_CLIENT_SECRET &&
    !!process.env.SENDPULSE_SENDER_EMAIL

  if (hasSendPulse) {
    const html = await renderEmailTemplate(notification.template_type as TemplateType, (notification.template_data || {}) as Record<string, unknown>)
    await sendEmailViaSendPulse(
      {
        clientId: process.env.SENDPULSE_CLIENT_ID!,
        clientSecret: process.env.SENDPULSE_CLIENT_SECRET!,
        senderEmail: process.env.SENDPULSE_SENDER_EMAIL!,
        senderName: process.env.SENDPULSE_SENDER_NAME || 'TISCO',
      },
      {
        to: notification.recipient_email,
        subject: notification.subject || getDefaultSubject(notification.template_type as TemplateType),
        html,
      }
    )
  } else {
    // Mock for local/dev when SendPulse is not configured
    console.log('MOCK EMAIL - Replace with real service:', {
      to: notification.recipient_email,
      subject: notification.subject,
      template: notification.template_type,
      data: notification.template_data
    })
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Update notification status to sent
  await supabase
    .from('email_notifications')
    .update({ 
      status: 'sent', 
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id)
}
