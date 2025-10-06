import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function trySelect(sb: any, table: string, columns: string) {
  if (!sb) return { data: null as any, error: new Error('Supabase not configured') }
  const { data, error } = await sb.from(table).select(columns)
  if (error) return { data: null as any, error }
  return { data, error: null as any }
}

export async function GET(_req: NextRequest) {
  try {
    const sb = getSupabase()

    // Default empty stats if no DB
    const empty = { total: 0, sent: 0, failed: 0, pending: 0, by_event: {} as Record<string, number> }

    // Prefer email_notifications
    const emailRes = await trySelect(sb, 'email_notifications', 'status, template_type')
    if (emailRes.data) {
      const rows = emailRes.data as Array<{ status: string; template_type: string }>
      const stats = { ...empty }
      stats.total = rows.length
      for (const r of rows) {
        if (r.status === 'sent') stats.sent++
        else if (r.status === 'failed') stats.failed++
        else if (r.status === 'pending' || r.status === 'queued' || r.status === 'scheduled') stats.pending++
        const key = r.template_type || 'unknown'
        stats.by_event[key] = (stats.by_event[key] || 0) + 1
      }
      return NextResponse.json({ stats }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }

    // Fallback to legacy notifications
    const legacyRes = await trySelect(sb, 'notifications', 'status, event')
    if (legacyRes.data) {
      const rows = legacyRes.data as Array<{ status: string; event: string }>
      const stats = { ...empty }
      stats.total = rows.length
      for (const r of rows) {
        if (r.status === 'sent') stats.sent++
        else if (r.status === 'failed') stats.failed++
        else if (r.status === 'pending' || r.status === 'scheduled') stats.pending++
        const key = r.event || 'unknown'
        stats.by_event[key] = (stats.by_event[key] || 0) + 1
      }
      return NextResponse.json({ stats }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
    }

    return NextResponse.json({ stats: empty }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch stats' }, { status: 500 })
  }
}
