import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'all'

    if (!email || !token) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Unsubscribe Link</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Invalid Unsubscribe Link</h2>
            <p>The unsubscribe link is invalid or has expired. Please contact support if you continue to receive unwanted emails.</p>
            <p><a href="mailto:info@tiscomarket.store">Contact Support</a></p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      })
    }

    // Validate token (in production, this should be a proper JWT or signed token)
    const expectedToken = Buffer.from(email + process.env.UNSUBSCRIBE_SECRET || 'fallback-secret').toString('base64')
    
    if (token !== expectedToken) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Token</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; border: 1px solid #fecaca; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>Invalid Token</h2>
            <p>The unsubscribe token is invalid. Please contact support.</p>
            <p><a href="mailto:info@tiscomarket.store">Contact Support</a></p>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 400
      })
    }

    // Update user preferences in database
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        email,
        email_notifications: type === 'all' ? false : true,
        marketing_emails: type === 'marketing' ? false : true,
        order_notifications: type === 'orders' ? false : true,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_type: type
      }, {
        onConflict: 'email'
      })

    if (error) {
      console.error('[unsubscribe] Database error:', error)
    }

    // Return success page
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Successfully Unsubscribed</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: 'Segoe UI', sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center;
            background: #f8fafc;
          }
          .success { 
            color: #059669; 
            background: #ecfdf5; 
            padding: 30px; 
            border-radius: 12px; 
            border: 1px solid #a7f3d0;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          .logo { 
            width: 48px; 
            height: 48px; 
            background: #1e293b; 
            border-radius: 12px; 
            margin: 0 auto 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 24px; 
          }
          h1 { color: #065f46; margin-bottom: 16px; }
          p { color: #374151; line-height: 1.6; margin-bottom: 16px; }
          .btn { 
            display: inline-block; 
            padding: 12px 24px; 
            background: #2563eb; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin-top: 20px; 
            font-weight: 600;
          }
          .preferences {
            background: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <div class="logo">🔕</div>
          <h1>Successfully Unsubscribed</h1>
          <p><strong>${email}</strong> has been unsubscribed from ${type === 'all' ? 'all emails' : type + ' emails'}.</p>
          
          <div class="preferences">
            <h3 style="margin-top: 0; color: #374151;">Your Email Preferences</h3>
            <p><strong>Marketing Emails:</strong> ${type === 'all' || type === 'marketing' ? '❌ Disabled' : '✅ Enabled'}</p>
            <p><strong>Order Notifications:</strong> ${type === 'all' || type === 'orders' ? '❌ Disabled' : '✅ Enabled'}</p>
            <p><strong>Service Updates:</strong> ${type === 'all' ? '❌ Disabled' : '✅ Enabled'}</p>
          </div>
          
          <p>You will no longer receive these types of emails from TISCOマーケット.</p>
          <p style="font-size: 14px; color: #6b7280;">
            You may still receive important account-related emails such as order confirmations and security notifications.
          </p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">Return to Store</a>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #d1d5db; font-size: 12px; color: #9ca3af;">
            <p>© ${new Date().getFullYear()} TISCOマーケット. All rights reserved.<br>
            Dar es Salaam, Tanzania</p>
          </div>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('[unsubscribe] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// This function has been moved to lib/utils/unsubscribe.ts
