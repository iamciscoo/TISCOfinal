import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

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

    for (const row of data || []) {
      const createdAt = new Date(row.created_at as string)
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!buckets.has(key)) continue
      const b = buckets.get(key)!
      const amt = Number((row as any).total_amount ?? 0)
      b.total += amt
      if ((row as any).payment_status === 'paid') {
        b.successful += amt
      }
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
