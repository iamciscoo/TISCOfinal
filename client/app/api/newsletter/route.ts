import { NextRequest } from 'next/server'
import { createClient, type PostgrestError } from '@supabase/supabase-js'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

export const runtime = 'nodejs'

// Use service role on server to avoid RLS insert failures
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = typeof body?.email === 'string' ? body.email : ''
    const email = raw.trim().toLowerCase()
    const source = typeof body?.source === 'string' ? body.source.trim() : null

    if (!email) {
      return createErrorResponse('Email is required', 400, 'MISSING_EMAIL')
    }

    // Minimal email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return createErrorResponse('Invalid email format', 400, 'INVALID_EMAIL')
    }

    // Check if email already exists (case-insensitive)
    const existing = await supabase
      .from('newsletter_subscriptions')
      .select('id')
      .ilike('email', email)
      .single()

    if (existing.error && existing.error.code !== 'PGRST116') {
      console.error('Newsletter check error:', existing.error)
      return createErrorResponse('Failed to subscribe', 500, 'DATABASE_ERROR', existing.error)
    }

    if (existing.data) {
      // Email already exists, treat as success (idempotent)
      return createSuccessResponse({ subscribed: true }, 200, 'Already subscribed')
    }

    // Insert new subscription
    const inserted = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        ...(source ? { source } : {}),
      })

    if (inserted.error) {
      const code = (inserted.error as PostgrestError).code || ''
      if (code === '23505') {
        // Another concurrent write or case-variant exists; treat as success
        return createSuccessResponse({ subscribed: true }, 200, 'Already subscribed')
      }
      console.error('Newsletter insert error:', inserted.error)
      return createErrorResponse('Failed to subscribe', 500, 'INSERT_ERROR', inserted.error)
    }

    return createSuccessResponse({ subscribed: true }, 201, 'Subscribed successfully')
  } catch (e) {
    console.error('Newsletter POST error:', e)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', e)
  }
}

// Add GET endpoint for consistency with admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!email) {
      return createErrorResponse('Email parameter is required', 400, 'MISSING_EMAIL')
    }

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email, is_subscribed, created_at')
      .ilike('email', email)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return createSuccessResponse({ subscribed: false }, 200)
      }
      return createErrorResponse('Failed to check subscription', 500, 'DATABASE_ERROR', error)
    }

    return createSuccessResponse({ 
      subscribed: data.is_subscribed,
      email: data.email,
      created_at: data.created_at
    })
  } catch (e) {
    console.error('Newsletter GET error:', e)
    return createErrorResponse('Internal server error', 500, 'UNEXPECTED_ERROR', e)
  }
}
