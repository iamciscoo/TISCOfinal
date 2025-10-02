import { NextRequest, NextResponse } from 'next/server'

// Professional branded template for admin notifications
function baseTemplate(content: string, previewText: string = 'TISCOマーケット Admin Notification') {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>TISCOマーケット</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preview Text -->
  <div style="display:none !important;visibility:hidden;mso-hide:all;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;font-size:1px;color:transparent;" aria-hidden="true">
    ${previewText}
    &#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;
  </div>
  
  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Main Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border-collapse:collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); padding: 40px 32px; border-radius: 12px 12px 0 0; position: relative; overflow: hidden;">
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
            <td style="padding:40px 30px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:30px;text-align:center;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 8px 0;color:#64748b;font-size:14px;font-weight:600;">TISCOマーケット</p>
              <p style="margin:0 0 16px 0;color:#64748b;font-size:12px;">Your trusted online technology store in Tanzania</p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} TISCOマーケット. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderAdminNotificationHtml(input: { title: string; message: string; action_url?: string; recipient_email?: string; recipient_name?: string; event?: string; priority?: string }) {
  const priority = (input.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent'
  const recipientName = input.recipient_name || input.recipient_email?.split('@')[0] || 'User'
  
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
  const formattedMessage = input.message.split('\n').map(paragraph => 
    paragraph.trim() ? `<p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.7;">${paragraph}</p>` : '<br>'
  ).join('')
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <title>${input.title}</title>
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
                                        <p style="margin: 12px 0 0 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 16px; color: #cbd5e1; line-height: 1.4; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Electronics • Tech Service Solutions • Rare Antiques • Hard-to-Find Collectibles • Trusted Tanzania</p>
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
                                ${input.title}
                            </h1>
                            
                            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin: 24px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                                <div style="color: #374151; font-size: 16px; line-height: 1.7;">
                                    ${formattedMessage}
                                </div>
                            </div>

                            ${input.action_url ? `
                            <!-- Action Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                                                    <a href="${input.action_url}" class="btn-primary" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px;">Take Action</a>
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

async function getSendPulseAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const url = 'https://api.sendpulse.com/oauth/access_token'
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret })
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' })
  if (!res.ok) throw new Error(`SendPulse token error: ${res.status}`)
  const json = (await res.json()) as any
  if (!json?.access_token) throw new Error('SendPulse token missing in response')
  return json.access_token as string
}

async function sendViaSendPulse(params: { to: string; subject: string; html: string }) {
  const clientId = process.env.SENDPULSE_CLIENT_ID
  const clientSecret = process.env.SENDPULSE_CLIENT_SECRET
  const senderEmail = process.env.SENDPULSE_SENDER_EMAIL || 'info@tiscomarket.store'
  const senderName = process.env.SENDPULSE_SENDER_NAME || 'TISCOマーケット'
  if (!clientId || !clientSecret) throw new Error('SendPulse credentials not configured')
  const token = await getSendPulseAccessToken(clientId, clientSecret)
  const url = 'https://api.sendpulse.com/smtp/emails'
  const htmlB64 = Buffer.from(params.html, 'utf-8').toString('base64')
  const payload = {
    email: {
      subject: params.subject,
      from: { name: senderName, email: senderEmail },
      to: [{ email: params.to }],
      html: htmlB64,
      text: params.html.replace(/<[^>]*>/g, '').slice(0, 500) + '...',
      reply_to: { email: 'info@tiscomarket.store' },
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`SendPulse send error: ${res.status} ${res.statusText} ${txt}`)
  }
}

// Create Supabase client lazily to avoid crashing if env is missing
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// Try to select from a table; on table-missing error, return null for data
async function trySelect(sb: any, table: string, columns: string, filters: (q: any) => any) {
  if (!sb) return { data: null as any, error: new Error('Supabase not configured') }
  let query = sb.from(table).select(columns)
  query = filters(query)
  const { data, error } = await query
  if (error) return { data: null as any, error }
  return { data, error: null as any }
}

export async function GET(req: NextRequest) {
  try {
    const sb = await getSupabase()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const event = searchParams.get('event')
    const category = searchParams.get('category')
    const platform_module = searchParams.get('platform_module')
    const priorityFilter = searchParams.get('priority')
    const limit = Number(searchParams.get('limit') || '50')

    // First, try email_notifications (preferred)
    const emailCols = 'id, template_type, recipient_email, subject, status, priority, sent_at, scheduled_for, created_at, updated_at'
    const emailFilters = (q: any) => {
      q = q.order('created_at', { ascending: false }).limit(limit)
      if (status && status !== 'all') q = q.eq('status', status)
      if (event && event !== 'all') q = q.eq('template_type', event)
      if (priorityFilter && priorityFilter !== 'all') q = q.eq('priority', priorityFilter)
      return q
    }
    const emailRes = await trySelect(sb, 'email_notifications', emailCols, emailFilters)

    let notifications: any[] = []
    if (emailRes.data) {
      notifications = (emailRes.data as any[]).map((n) => ({
        id: n.id,
        event: n.template_type,
        recipient_email: n.recipient_email,
        recipient_name: undefined,
        subject: n.subject,
        content: '',
        channels: ['email'],
        status: n.status,
        priority: (n.priority || 'medium'),
        error_message: undefined,
        sent_at: n.sent_at || undefined,
        scheduled_at: n.scheduled_for || undefined,
        created_at: n.created_at,
        updated_at: n.updated_at,
        metadata: undefined,
      }))
    } else {
      // Fallback to legacy notifications table
      const legacyCols = '*'
      const legacyFilters = (q: any) => {
        q = q.order('created_at', { ascending: false }).range(0, Math.max(0, limit - 1))
        if (status && status !== 'all') q = q.eq('status', status)
        if (event && event !== 'all') q = q.eq('event', event)
        return q
      }
      const legacyRes = await trySelect(sb, 'notifications', legacyCols, legacyFilters)
      if (legacyRes.data) notifications = legacyRes.data as any[]
    }

    // Enhanced: also include results from the richer notifications table when filters target its fields
    const needsEnhanced = Boolean(category) || Boolean(platform_module) || (priorityFilter && priorityFilter !== 'all')
    if (sb) {
      const enhancedFilters = (q: any) => {
        q = q.order('created_at', { ascending: false }).range(0, Math.max(0, limit - 1))
        if (status && status !== 'all') q = q.eq('status', status)
        if (event && event !== 'all') q = q.eq('event', event)
        if (category && category !== 'all') q = q.eq('category', category)
        if (platform_module && platform_module !== 'all') q = q.eq('platform_module', platform_module)
        if (priorityFilter && priorityFilter !== 'all') q = q.eq('priority', priorityFilter)
        return q
      }
      const enhancedRes = await trySelect(sb, 'notifications', '*', enhancedFilters)
      if (enhancedRes.data && Array.isArray(enhancedRes.data)) {
        const mapped = (enhancedRes.data as any[]).map((n) => ({
          id: n.id,
          event: n.event,
          recipient_email: n.recipient_email,
          recipient_name: n.recipient_name,
          subject: n.subject,
          content: n.content || '',
          channels: Array.isArray(n.channels) ? n.channels : ['email'],
          status: n.status || 'pending',
          priority: n.priority || 'medium',
          error_message: n.error_message || undefined,
          sent_at: n.sent_at || undefined,
          scheduled_at: n.scheduled_at || undefined,
          created_at: n.created_at,
          updated_at: n.updated_at,
          metadata: n.metadata,
          // extra fields for richer UI
          category: n.category,
          platform_module: n.platform_module,
          action_url: n.action_url,
        }))
        // Merge while keeping stability
        notifications = [...mapped, ...notifications]
      }
    }

    // Final sort by created_at desc if present
    notifications.sort((a, b) => {
      const aTime = a?.created_at ? new Date(a.created_at).getTime() : 0
      const bTime = b?.created_at ? new Date(b.created_at).getTime() : 0
      return bTime - aTime
    })

    return NextResponse.json({ notifications })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = await getSupabase()
    const body = await req.json()
    const event = (body?.event as string) || 'admin_notification'
    const recipient_email = body?.recipient_email as string
    const recipient_name = (body?.recipient_name as string | undefined) || undefined
    const data = (body?.data as Record<string, any>) || {}
    const priority = (body?.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium'

    // Preflight credential check for clearer error in admin UI
    if (!process.env.SENDPULSE_CLIENT_ID || !process.env.SENDPULSE_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'SendPulse credentials not configured for admin. Please set SENDPULSE_CLIENT_ID and SENDPULSE_CLIENT_SECRET in the admin app environment.'
      }, { status: 400 })
    }

    if (!recipient_email) {
      return NextResponse.json({ error: 'recipient_email is required' }, { status: 400 })
    }

    // Subject and HTML
    const subject = data?.title || `Notification from TISCO Market`
    const html = renderAdminNotificationHtml({ 
      title: data?.title || 'Notification', 
      message: data?.message || '', 
      action_url: data?.action_url,
      recipient_email: recipient_email,
      recipient_name: recipient_name,
      event: event,
      priority: priority
    })

    let insertedId: string | null = null

    // Attempt to insert into email_notifications, if table exists
    if (sb) {
      try {
        const { data: inserted, error } = await sb
          .from('email_notifications')
          .insert({
            user_id: null,
            template_type: event,
            recipient_email,
            subject,
            template_data: data,
            priority,
            status: 'pending',
            scheduled_for: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!error && inserted) {
          insertedId = inserted.id
        }
      } catch (insertError) {
        console.warn('Failed to insert notification record:', insertError)
        // Continue with sending even if database insert fails
      }
    }

    // Send the email
    try {
      await sendViaSendPulse({ to: recipient_email, subject, html })
      
      // Update status to sent if we have a record
      if (sb && insertedId) {
        await sb
          .from('email_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', insertedId)
      }

      // Note: Admin notifications for order events are handled by the dedicated 
      // notifyAdminOrderCreated function to avoid duplicates
    } catch (sendErr: any) {
      // Update status to failed if we have a record
      if (sb && insertedId) {
        await sb
          .from('email_notifications')
          .update({ 
            status: 'failed', 
            error_message: sendErr?.message || 'Send error', 
            failed_at: new Date().toISOString() 
          })
          .eq('id', insertedId)
      }
      throw sendErr
    }

    return NextResponse.json({ success: true, message: 'Notification sent successfully' })
  } catch (e: any) {
    console.error('Admin notification error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to send notification' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = await getSupabase()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const bulk = searchParams.get('bulk')

    // Handle bulk delete
    if (bulk === 'true') {
      const body = await req.json()
      const ids = body?.ids as string[]
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids array is required for bulk delete' }, { status: 400 })
      }

      if (ids.length > 100) {
        return NextResponse.json({ error: 'Cannot delete more than 100 notifications at once' }, { status: 400 })
      }

      let deletedCount = 0
      const errors: string[] = []

      if (sb) {
        // Try email_notifications table first
        try {
          const { error: emailErr, count } = await sb
            .from('email_notifications')
            .delete({ count: 'exact' })
            .in('id', ids)
          
          if (!emailErr && count !== null) {
            deletedCount += count
          }
        } catch (e: any) {
          errors.push(`Email notifications: ${e.message}`)
        }

        // Try legacy notifications table for remaining IDs
        if (deletedCount < ids.length) {
          try {
            const { error: legacyErr, count } = await sb
              .from('notifications')
              .delete({ count: 'exact' })
              .in('id', ids)
            
            if (!legacyErr && count !== null) {
              deletedCount += count
            }
          } catch (e: any) {
            errors.push(`Legacy notifications: ${e.message}`)
          }
        }
      }

      return NextResponse.json({ 
        success: true, 
        deletedCount,
        totalRequested: ids.length,
        errors: errors.length > 0 ? errors : undefined
      })
    }

    // Handle single delete
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    let deleted = false
    if (sb) {
      try {
        const { error: emailErr } = await sb.from('email_notifications').delete().eq('id', id)
        if (!emailErr) deleted = true
      } catch {}
      if (!deleted) {
        try {
          const { error: legacyErr } = await sb.from('notifications').delete().eq('id', id)
          if (!legacyErr) deleted = true
        } catch {}
      }
    }

    if (!deleted) return NextResponse.json({ error: 'Delete failed or record not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to delete notification' }, { status: 500 })
  }
}
