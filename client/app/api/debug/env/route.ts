import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Only allow in development or with admin key
  const adminKey = req.nextUrl.searchParams.get('admin_key')
  const isAuthorized = process.env.NODE_ENV === 'development' || adminKey === process.env.ADMIN_DEBUG_KEY

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const envCheck = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    
    // Database
    supabase: {
      public_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      public_url_value: process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 30)}...` : 'missing',
      anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      service_role: !!process.env.SUPABASE_SERVICE_ROLE,
      service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_url_fallback: !!process.env.SUPABASE_URL,
    },
    
    // Payment Gateway
    zenopay: {
      base_url: !!process.env.ZENOPAY_BASE_URL,
      base_url_value: process.env.ZENOPAY_BASE_URL || 'missing',
      account_id: !!process.env.ZENOPAY_ACCOUNT_ID,
      api_key: !!process.env.ZENOPAY_API_KEY,
      api_key_preview: process.env.ZENOPAY_API_KEY ? `${process.env.ZENOPAY_API_KEY.slice(0, 10)}...` : 'missing',
      secret_key: !!process.env.ZENOPAY_SECRET_KEY,
      remote_status: process.env.ZENOPAY_REMOTE_STATUS,
    },
    
    // Webhook Security
    webhook: {
      secret: !!process.env.WEBHOOK_SECRET,
      secret_preview: process.env.WEBHOOK_SECRET ? `${process.env.WEBHOOK_SECRET.slice(0, 10)}...` : 'missing',
    },
    
    // Email Service
    sendpulse: {
      client_id: !!process.env.SENDPULSE_CLIENT_ID,
      client_id_preview: process.env.SENDPULSE_CLIENT_ID ? `${process.env.SENDPULSE_CLIENT_ID.slice(0, 10)}...` : 'missing',
      client_secret: !!process.env.SENDPULSE_CLIENT_SECRET,
      sender_email: process.env.SENDPULSE_SENDER_EMAIL || 'missing',
      sender_name: process.env.SENDPULSE_SENDER_NAME || 'missing',
      smtp_server: process.env.SENDPULSE_SMTP_SERVER || 'missing',
      smtp_port: process.env.SENDPULSE_SMTP_PORT || 'missing',
      smtp_login: !!process.env.SENDPULSE_SMTP_LOGIN,
      smtp_password: !!process.env.SENDPULSE_SMTP_PASSWORD,
    },
    
    // App URLs
    urls: {
      next_public_base_url: process.env.NEXT_PUBLIC_BASE_URL || 'missing',
      next_public_app_url: process.env.NEXT_PUBLIC_APP_URL || 'missing',
    },
    
    // Other
    admin_email: process.env.ADMIN_EMAIL || 'missing',
    unsubscribe_secret: !!process.env.UNSUBSCRIBE_SECRET,
    admin_debug_key: !!process.env.ADMIN_DEBUG_KEY,
  }

  return NextResponse.json(envCheck, { status: 200 })
}
