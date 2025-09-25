import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/sendpulse'

interface ManualEmailRequest {
  recipient_email: string
  recipient_name: string
  subject: string
  message: string
  template_type?: 'order_reminder' | 'custom' | 'promotional'
  order_id?: string
  bypass_timeframe?: boolean // Allow admin to override one-week restriction
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Verify admin authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: ManualEmailRequest = await request.json()
    const { 
      recipient_email, 
      recipient_name, 
      subject, 
      message, 
      template_type = 'custom',
      order_id,
      bypass_timeframe = false 
    } = body

    // Validate required fields
    if (!recipient_email || !recipient_name || !subject || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipient_email, recipient_name, subject, message' 
      }, { status: 400 })
    }

    // Check if customer exists
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, created_at')
      .eq('email', recipient_email)
      .single()

    if (customerError && customerError.code !== 'PGRST116') {
      console.error('Error checking customer:', customerError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // If not bypassing timeframe, check one-week restriction
    if (!bypass_timeframe && customer) {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: recentEmails, error: emailCheckError } = await supabase
        .from('notification_recipients')
        .select('sent_at')
        .eq('user_id', customer.id)
        .gte('sent_at', oneWeekAgo.toISOString())
        .eq('status', 'sent')

      if (emailCheckError) {
        console.error('Error checking recent emails:', emailCheckError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      if (recentEmails && recentEmails.length > 0) {
        const lastEmailDate = new Date(recentEmails[0].sent_at).toLocaleDateString()
        return NextResponse.json({ 
          error: `Customer was sent an email within the last week (${lastEmailDate}). Use bypass_timeframe=true to override.`,
          canBypass: true
        }, { status: 429 })
      }
    }

    // Prepare email content based on template type
    let emailHtml = message
    const emailSubject = subject

    if (template_type === 'order_reminder' && order_id) {
      // Fetch order details for enhanced template
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (name, image_url)
          )
        `)
        .eq('id', order_id)
        .single()

      if (order) {
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Hi ${recipient_name}!</h2>
            <p>${message}</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Order #${order.id.slice(0, 8).toUpperCase()}</h3>
              <p><strong>Total:</strong> TSh ${order.total_amount.toLocaleString()}</p>
              <p><strong>Status:</strong> ${order.status}</p>
            </div>
            
            <p>Need help? Reply to this email or contact our support team.</p>
            <p>Best regards,<br>TISCO Team</p>
          </div>
        `
      }
    } else if (template_type === 'promotional') {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Special Offer for You!</h2>
          </div>
          <div style="padding: 30px; background: white; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <p>Hi ${recipient_name}!</p>
            <p>${message}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/products" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Shop Now
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>TISCO Team
            </p>
          </div>
        </div>
      `
    } else {
      // Custom template
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">Hi ${recipient_name}!</h2>
          <div style="line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <br>
          <p>Best regards,<br>TISCO Team</p>
        </div>
      `
    }

    // Send email via SendPulse
    const emailResult = await sendEmail({
      to: recipient_email,
      subject: emailSubject,
      html: emailHtml
    })

    if (!emailResult.success) {
      console.error('SendPulse error:', emailResult.error)
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: emailResult.error 
      }, { status: 500 })
    }

    // Log the notification in database
    const notificationData = {
      type: 'manual_email',
      title: emailSubject,
      message: message.substring(0, 500), // Truncate for storage
      metadata: {
        template_type,
        sent_by: session.user.email,
        bypass_timeframe,
        order_id: order_id || null
      }
    }

    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()

    if (notificationError) {
      console.error('Failed to log notification:', notificationError)
      // Don't fail the request if logging fails
    }

    // Log recipient record
    if (notification && customer) {
      await supabase
        .from('notification_recipients')
        .insert({
          notification_id: notification.id,
          user_id: customer.id,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      notification_id: notification?.id,
      recipient: {
        email: recipient_email,
        name: recipient_name,
        existing_customer: !!customer
      }
    })

  } catch (error) {
    console.error('Manual email notification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET endpoint to fetch recent manual emails for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    // Verify admin authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch recent manual email notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        notification_recipients (
          user_id,
          status,
          sent_at,
          users (
            email,
            first_name,
            last_name
          )
        )
      `)
      .eq('type', 'manual_email')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching manual emails:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        limit,
        offset,
        hasMore: (notifications?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('GET manual email notifications error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
