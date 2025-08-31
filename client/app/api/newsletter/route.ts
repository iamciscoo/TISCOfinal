import { NextRequest, NextResponse } from 'next/server'
import { createClient, type PostgrestError } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Use anon key; RLS allows INSERT for public as per migration policy
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = typeof body?.email === 'string' ? body.email : ''
    const email = raw.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Minimal email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email })

    if (error) {
      // Treat unique violation as success (idempotent subscribe)
      const code = (error as PostgrestError).code || ''
      if (code === '23505') {
        return NextResponse.json({ message: 'Already subscribed' }, { status: 200 })
      }
      console.error('Newsletter subscribe error:', error)
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 })
  } catch (e) {
    console.error('Newsletter POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
