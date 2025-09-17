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
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0;">
              <img src="https://tiscomarket.store/logo-email.svg" alt="TISCOマーケット" width="48" height="48" style="display:block;border:0;outline:none;text-decoration:none;border-radius:12px;margin:0 auto 12px auto;" />
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:-0.5px;">TISCOマーケット</h1>
              <p style="margin:8px 0 0 0;color:#e2e8f0;font-size:14px;">Your trusted technology partner in Tanzania</p>
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

function renderAdminNotificationHtml(input: { title: string; message: string; action_url?: string; recipient_email?: string; recipient_name?: string; event?: string }) {
  const eventName = input.event || 'notification'
  const timestamp = new Date().toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })
  const recipientName = input.recipient_name || input.recipient_email?.split('@')[0] || 'User'
  
  const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>TISCO Market - ${input.title || 'Notification'}</title>
    <style>
        body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-full { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc;">
    
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc;">
        <div style="background: #1e293b; padding: 2rem; text-align: left;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
                <tr>
                    <td style="width:64px;padding-right:12px;vertical-align:middle;text-align:left;">
                        <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNTAwIiB6b29tQW5kUGFuPSJtYWduaWZ5IiB2aWV3Qm94PSIwIDAgMzc1IDM3NC45OTk5OTEiIGhlaWdodD0iNTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjIiPjxkZWZzLz4NCjxnIGlkPSJjN2E0ZGJhMWQzIj4NCjxnIG1hc2s9InVybCgjYmFiY2ZkNTZkZSkiIHRyYW5zZm9ybT0ibWF0cml4KDAuMzY4NDA4LDAsMCwwLjM2ODQwOCwtMC45NDUyMzYsLTEuODkwNDY4KSI+DQo8aW1hZ2Ugd2lkdGg9IjEwMjQiIHhsaW5rOmhyZWY9ImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQkFBQUFBUUNBSUFBQUR3Zjd6VUFBQUFCbUpMUjBRQS93RC9BUCtndmFlVEFBQWdBRWxFUVZSNG5PeWRlYndjVlpuM24rZFU5YjAzKzU2UWhaQ1F6WkNRRUNDRWZTZUpSQktZVVJZZFFRUkJBamlNaXFEREFDSXlvSTZqZzdLRkFWOUdsR0ZnM0ZISGpFSEJESTZYUVNWQ0lJaEFnSVNZQlpPUW05dGRkWjczaitxcXJ1WFUwbmZyZTI5KzM4OG51ZDFWWjNuT3FkUGR6L09jNTV4REJBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFDIV==" alt="TISCO Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; margin: 0; padding: 0; border: 0; border-radius: 8px;">
                    </td>
                    <td style="vertical-align:middle;text-align:left;">
                        <h1 style="color: white; margin: 0; font-size: 2rem;">TISCOマーケット</h1>
                        <p style="color: #cbd5e1; margin: 0.5rem 0 0 0;">${input.title || 'Notification'}</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="padding: 2rem; background: white; margin: 1rem;">
            <h2 style="color: #1e293b; margin-bottom: 1rem;">Hello ${recipientName},</h2>
            <p style="color: #374151; line-height: 1.6;">You have received this notification from TISCO Market. Please review the information below.</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 1.5rem; margin: 1.5rem 0;">
                <h3 style="color: #15803d; margin: 0 0 1rem 0; font-size: 1.1rem;">📩 ${input.title || 'Notification'}</h3>
                <div style="color: #374151; white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6;">
                    ${input.message}
                </div>
            </div>
            
            ${input.action_url ? `
            <div style="text-align: left; margin: 2rem 0;">
                <a href="${input.action_url}" style="padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">
                    Take Action
                </a>
            </div>
            ` : ''}
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <h3 style="color: #1e293b; margin-bottom: 1rem;">Notification Details</h3>
                <p><strong>Sent to:</strong> ${input.recipient_email}</p>
                <p><strong>Date & Time:</strong> ${timestamp} EAT</p>
                <p><strong>Message Type:</strong> ${eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 1rem; margin: 1rem 0; font-size: 14px; color: #374151; text-align: left; border-radius: 4px;">
            <p style="margin: 0; font-weight: 600;">TISCOマーケット</p>
            <p style="margin: 0.5rem 0 0 0;">
                <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none;">info@tiscomarket.store</a> | 
                <a href="tel:+255748624684" style="color: #2563eb; text-decoration: none;">+255 748 624 684</a>
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 12px; color: #64748b;">
                Questions? Contact our support team. We're here to help!
            </p>
        </div>
    </div>
    
    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #64748b; font-size: 12px; padding: 1rem;">
        TISCOマーケット | info@tiscomarket.store | +255748624684
    </div>
</body>
</html>`
  
  return content
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
      reply_to: { email: 'info@tiscmarket.store' },
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
    const limit = Number(searchParams.get('limit') || '50')

    // First, try email_notifications (preferred)
    const emailCols = 'id, template_type, recipient_email, subject, status, priority, sent_at, scheduled_for, created_at, updated_at'
    const emailFilters = (q: any) => {
      q = q.order('created_at', { ascending: false }).limit(limit)
      if (status && status !== 'all') q = q.eq('status', status)
      if (event && event !== 'all') q = q.eq('template_type', event)
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
      event: event
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

      // Also send to all admin recipients from notification_recipients table
      try {
        if (sb) {
          const { data: recipients } = await sb
            .from('notification_recipients')
            .select('email, name')
            .eq('is_active', true)

          if (recipients && recipients.length > 0) {
            const adminNotifications = recipients.map(async (recipient: any) => {
              try {
                await sendViaSendPulse({
                  to: recipient.email,
                  subject: `Admin Alert: ${subject}`,
                  html: renderAdminNotificationHtml({
                    title: `New ${event} Notification Sent`,
                    message: `A ${event} notification was sent to ${recipient_email}.\n\nSubject: ${subject}\n\nRecipient: ${recipient_name || recipient_email}\nPriority: ${priority}`
                  })
                })
              } catch (e) {
                console.warn(`Failed to notify admin ${recipient.email}:`, e)
              }
            })
            await Promise.allSettled(adminNotifications)
          }
        }
      } catch (adminErr) {
        console.warn('Failed to notify admin recipients:', adminErr)
      }
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
