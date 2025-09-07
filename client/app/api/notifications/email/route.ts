import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { getDefaultSubject } from '@/lib/email-templates'

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
    const user = await currentUser()
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
  // Email Service Implementation Guide
  // ==================================
  // Replace this mock implementation with one of the following services:
  
  // Option 1: SendGrid (Recommended for reliability)
  // ------------------------------------------------
  // 1. Install: npm install @sendgrid/mail
  // 2. Set environment variable: SENDGRID_API_KEY
  // 
  // import sgMail from '@sendgrid/mail'
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
  // 
  // const msg = {
  //   to: notification.recipient_email,
  //   from: process.env.FROM_EMAIL!,
  //   subject: notification.subject,
  //   html: await renderEmailTemplate(notification.template_type, notification.template_data),
  // }
  // await sgMail.send(msg)

  // Option 2: Resend (Modern, developer-friendly)
  // ----------------------------------------------
  // 1. Install: npm install resend
  // 2. Set environment variable: RESEND_API_KEY
  //
  // import { Resend } from 'resend'
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // 
  // await resend.emails.send({
  //   from: process.env.FROM_EMAIL!,
  //   to: notification.recipient_email,
  //   subject: notification.subject,
  //   html: await renderEmailTemplate(notification.template_type, notification.template_data),
  // })

  // Option 3: AWS SES (Cost-effective at scale)
  // --------------------------------------------
  // 1. Install: npm install @aws-sdk/client-ses
  // 2. Set AWS credentials
  //
  // import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
  // const client = new SESClient({ region: "us-east-1" })
  // 
  // const command = new SendEmailCommand({
  //   Source: process.env.FROM_EMAIL!,
  //   Destination: { ToAddresses: [notification.recipient_email] },
  //   Message: {
  //     Subject: { Data: notification.subject },
  //     Body: { Html: { Data: await renderEmailTemplate(...) } }
  //   }
  // })
  // await client.send(command)

  // Current: Mock implementation for testing
  console.log('MOCK EMAIL - Replace with real service:', {
    to: notification.recipient_email,
    subject: notification.subject,
    template: notification.template_type,
    data: notification.template_data
  })

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 100))

  // Mock success/failure (90% success rate)
  if (Math.random() > 0.9) {
    throw new Error('Email service temporarily unavailable')
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
