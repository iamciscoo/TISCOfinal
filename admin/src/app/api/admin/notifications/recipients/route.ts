import { NextRequest, NextResponse } from 'next/server'

// Lazy Supabase client creator (copied pattern from notifications route)
async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function DELETE(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await sb.from('notification_recipients').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to remove recipient' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ recipients: [] })

    const { data, error } = await sb
      .from('notification_recipients')
      .select('id, email, name, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      // If table missing or any other error, return empty list gracefully
      return NextResponse.json({ recipients: [] })
    }

    return NextResponse.json({ recipients: data || [] })
  } catch (e: any) {
    return NextResponse.json({ recipients: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = await getSupabase()
    if (!sb) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const name = (body?.name as string | undefined)?.trim() || null

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    // Upsert by email to avoid duplicates
    const { data, error } = await sb
      .from('notification_recipients')
      .upsert({ email, name, is_active: true }, { onConflict: 'email' })
      .select('id, email, name, is_active, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ recipient: data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to add recipient' }, { status: 500 })
  }
}
