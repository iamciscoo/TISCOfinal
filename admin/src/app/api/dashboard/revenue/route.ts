import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// startOfMonth not used; removed to satisfy linter

function monthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'long' })
}

export async function GET() {
  try {
    const monthsBack = 6
    const now = new Date()
    const months: { key: string; label: string; date: Date }[] = []

    for (let i = monthsBack - 1; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`,
        label: monthLabel(dt),
        date: dt,
      })
    }

    const start = months[0].date.toISOString()

    const { data, error } = await supabase
      .from('orders')
      .select('created_at,total_amount,payment_status')
      .gte('created_at', start)

    if (error) throw error

    const buckets = new Map<string, { total: number; successful: number }>()
    for (const m of months) {
      buckets.set(m.key, { total: 0, successful: 0 })
    }

    for (const row of (data || []) as Array<{ created_at: string; total_amount: number | string; payment_status?: string }>) {
      const createdAt = new Date(row.created_at)
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!buckets.has(key)) continue
      const b = buckets.get(key)!
      const amt = Number(row.total_amount ?? 0)
      b.total += amt
      if (row.payment_status === 'paid') {
        b.successful += amt
      }
    }

    // Also include service bookings in the same buckets
    try {
      const { data: svcData, error: svcErr } = await supabase
        .from('service_bookings')
        .select('created_at,total_amount,payment_status')
        .gte('created_at', start)

      if (!svcErr) {
        for (const row of (svcData || []) as Array<{ created_at: string; total_amount: number | string; payment_status?: string }>) {
          const createdAt = new Date(row.created_at)
          const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
          if (!buckets.has(key)) continue
          const b = buckets.get(key)!
          const amt = Number(row.total_amount ?? 0)
          b.total += amt
          if (String(row.payment_status || '').toLowerCase() === 'paid') {
            b.successful += amt
          }
        }
      } else {
        const msg = String(svcErr.message || '').toLowerCase()
        // Ignore missing table/column errors; treat service revenue as zero
        if (!(
          msg.includes('relation') && msg.includes('does not exist') ||
          msg.includes('schema cache') ||
          msg.includes('column') && msg.includes('payment_status') && msg.includes('does not exist')
        )) {
          console.warn('Service bookings revenue skipped due to error:', svcErr.message)
        }
      }
    } catch (e) {
      // Best-effort; chart can still render with orders only
      console.warn('Service bookings revenue aggregation failed:', (e as Error)?.message)
    }

    const out = months.map((m) => ({
      month: m.label,
      total: Math.round(buckets.get(m.key)!.total),
      successful: Math.round(buckets.get(m.key)!.successful),
    }))

    return NextResponse.json({ data: out })
  } catch (err) {
    console.error('Revenue API error', err)
    return NextResponse.json({ error: 'Failed to load revenue data' }, { status: 500 })
  }
}
