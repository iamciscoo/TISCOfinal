import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/sendpulse'

// Professional Email Template Generator - MODERN VERSION
function generateManualNotificationTemplate(data: {
  recipient_name: string
  title: string
  message: string
  action_url?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  template_style: 'default' | 'professional' | 'modern' | 'minimal'
}): string {
  const { recipient_name, title, message, action_url, priority } = data
  
  // Priority configurations with enhanced styling
  const priorityConfig = {
    low: { 
      color: '#16a34a', 
      bgColor: '#f0fdf4', 
      borderColor: '#bbf7d0',
      icon: 'ℹ️',
      label: 'Information'
    },
    medium: { 
      color: '#2563eb', 
      bgColor: '#eff6ff', 
      borderColor: '#bfdbfe',
      icon: '📋',
      label: 'Notice'
    },
    high: { 
      color: '#ea580c', 
      bgColor: '#fff7ed', 
      borderColor: '#fed7aa',
      icon: '⚠️',
      label: 'Important'
    },
    urgent: { 
      color: '#dc2626', 
      bgColor: '#fef2f2', 
      borderColor: '#fecaca',
      icon: '🚨',
      label: 'URGENT'
    }
  }
  
  const config = priorityConfig[priority]
  const formattedMessage = message.split('\n').map(paragraph => 
    paragraph.trim() ? `<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.7;">${paragraph}</p>` : '<br>'
  ).join('')
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <title>${title}</title>
    <style>
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        .ExternalClass { width: 100%; }
        .btn-primary { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
            border-radius: 8px !important; padding: 16px 32px !important; color: #ffffff !important;
            text-decoration: none !important; font-weight: 600 !important; font-size: 16px !important;
        }
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-full { width: 100% !important; }
            .mobile-padding { padding: 16px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 32px; border-radius: 16px 16px 0 0; position: relative; overflow: hidden;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="100" style="vertical-align: middle; padding-right: 20px;">
                                        <!-- Modern Futuristic Logo -->
                                        <div style="width: 80px; height: 80px; display: table-cell; vertical-align: middle; text-align: center; background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%); border-radius: 50%; backdrop-filter: blur(10px);">
                                            <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-weight: 900; color: #ffffff; font-size: 16px; line-height: 18px; margin: 0; padding: 0; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">TISCO</div>
                                            <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-weight: 600; color: #e2e8f0; font-size: 11px; line-height: 13px; margin: 3px 0 0 0; padding: 0; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">マーケット</div>
                                        </div>
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 32px; font-weight: 800; color: #ffffff; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px;">TISCOマーケット</h1>
                                        <p style="margin: 12px 0 0 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.4; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Electronics • Tech Service Solutions • Rare Antiques • Hard-to-Find Collectibles • Fast Delivery</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px; background-color: #ffffff;">
                            <!-- Priority Banner -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
                                <tr>
                                    <td style="background: ${config.bgColor}; border: 1px solid ${config.borderColor}; border-radius: 8px; padding: 16px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="vertical-align: middle; width: 40px;">
                                                    <div style="width: 32px; height: 32px; background: ${config.color}; border-radius: 50%; text-align: center; line-height: 32px;">
                                                        <span style="font-size: 16px;">${config.icon}</span>
                                                    </div>
                                                </td>
                                                <td style="vertical-align: middle; padding-left: 12px;">
                                                    <p style="margin: 0; color: ${config.color}; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${config.label} • ${priority.toUpperCase()} PRIORITY</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Main Content -->
                            <h1 style="margin: 0 0 24px 0; color: #111827; font-size: 28px; line-height: 1.2; font-weight: 700;">
                                ${title}
                            </h1>
                            
                            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin: 24px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <div style="color: #374151; font-size: 16px; line-height: 1.7;">
                                    ${formattedMessage}
                                </div>
                            </div>

                            ${action_url ? `
                            <!-- Action Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                                                    <a href="${action_url}" class="btn-primary" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Take Action</a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>` : ''}

                            <!-- Professional Note -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f8fafc; border-radius: 8px; border-left: 4px solid ${config.color}; margin: 32px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; font-weight: 600;">Professional Service Guarantee</p>
                                        <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">This message was sent as part of our commitment to keeping you informed about important updates and information relevant to your experience with TISCOマーケット.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Contact Information -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                                        <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 16px; font-weight: 600; text-align: center;">Need Assistance?</h3>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="width: 33.33%; text-align: center; padding: 12px;">
                                                    <div style="background: #f0f9ff; border-radius: 8px; padding: 16px;">
                                                        <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">WhatsApp Support</p>
                                                        <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-weight: 600; font-size: 14px;">+255 748 624 684</a>
                                                    </div>
                                                </td>
                                                <td style="width: 33.33%; text-align: center; padding: 12px;">
                                                    <div style="background: #f0f9ff; border-radius: 8px; padding: 16px;">
                                                        <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Email Support</p>
                                                        <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px;">info@tiscomarket.store</a>
                                                    </div>
                                                </td>
                                                <td style="width: 33.33%; text-align: center; padding: 12px;">
                                                    <div style="background: #f0f9ff; border-radius: 8px; padding: 16px;">
                                                        <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-weight: 600;">Visit Store</p>
                                                        <a href="https://tiscomarket.store" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px;">tiscomarket.store</a>
                                                    </div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Timestamp -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
                                <tr>
                                    <td style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 6px;">
                                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">Sent on ${new Date().toLocaleDateString('en-US', { 
                                          weekday: 'long', 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">TISCOマーケット</p>
                                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">Your trusted technology partner in Tanzania</p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">info@tiscomarket.store</a>
                                                </td>
                                                <td style="padding: 0 12px; border-left: 1px solid #e2e8f0;">
                                                    <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-size: 14px; font-weight: 500;">+255 748 624 684</a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">© 2024 TISCOマーケット. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

interface ManualEmailRequest {
  recipient_email: string
  recipient_name: string
  title: string
  message: string
  action_url?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  template_style?: 'default' | 'professional' | 'modern' | 'minimal'
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
      title, 
      message, 
      action_url,
      priority = 'medium',
      template_style = 'default',
      bypass_timeframe = false 
    } = body

    // Validate required fields
    if (!recipient_email || !recipient_name || !title || !message) {
      return NextResponse.json({ 
        error: 'Missing required fields: recipient_email, recipient_name, title, message' 
      }, { status: 400 })
    }

    // Validate action_url if provided
    if (action_url && action_url.trim()) {
      try {
        new URL(action_url)
      } catch {
        return NextResponse.json({ 
          error: 'Invalid action URL format' 
        }, { status: 400 })
      }
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

    // Generate professional email HTML using the new template
    console.log('🎨 Generating email with new template:', { title, priority, template_style })
    const emailHtml = generateManualNotificationTemplate({
      recipient_name,
      title,
      message,
      action_url: action_url?.trim() || undefined,
      priority,
      template_style
    })
    
    // Log first 500 chars of HTML to verify it's the new template
    console.log('📧 Generated HTML preview:', emailHtml.substring(0, 500))
    
    const emailSubject = title

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
        template_style,
        priority,
        action_url: action_url || null,
        sent_by: session.user.email,
        bypass_timeframe,
        notification_category: 'manual_notification'
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
      },
      email_details: {
        title: emailSubject,
        priority,
        action_url: action_url || null,
        template_style
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
