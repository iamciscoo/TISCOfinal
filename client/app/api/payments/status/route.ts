import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ZenoPayClient } from '@/lib/zenopay'
import { getUser } from '@/lib/supabase-server'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

// Lightweight in-memory rate limiter (per instance).
// Limits to RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS per user+IP.
const RATE_LIMIT_WINDOW_MS = 60_000
// Allow responsive client-side polling during a 60–90s window (3s interval => ~30 calls)
const RATE_LIMIT_MAX = 60
type Bucket = { count: number; resetAt: number }
const rateBuckets = new Map<string, Bucket>()

function checkRateLimit(key: string) {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS
    rateBuckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt }
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }
  bucket.count += 1
  rateBuckets.set(key, bucket)
  return { allowed: true, remaining: RATE_LIMIT_MAX - bucket.count, resetAt: bucket.resetAt }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  const rip = req.headers.get('x-real-ip')
  if (rip) return rip
  return 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit per user+IP
    const ip = getClientIp(req)
    const key = `${user.id}:${ip}`
    const rl = checkRateLimit(key)
    if (!rl.allowed) {
      const retry = Math.ceil((rl.resetAt - Date.now()) / 1000)
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests. Please try again shortly.' }), {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, retry)),
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
          'Content-Type': 'application/json',
        },
      })
    }

    const { reference, transaction_id } = await req.json()
    const ref: string | undefined = reference || transaction_id
    if (!ref) return NextResponse.json({ error: 'reference required' }, { status: 400 })

    // Check both payment_transactions (existing orders) and payment_sessions (new flow)
    let txnData: { id: string; user_id: string; transaction_reference: string; gateway_transaction_id?: string; status: string; created_at: string; order_id?: string } | null = null
    let isSession = false

    // First try payment_transactions (existing flow)
    const { data: txnResult } = await supabase
      .from('payment_transactions')
      .select('id, user_id, order_id, transaction_reference, gateway_transaction_id, status, created_at')
      .or(`transaction_reference.eq.${ref},gateway_transaction_id.eq.${ref}`)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (txnResult) {
      txnData = txnResult
    } else {
      // Try payment_sessions (new flow)
      const { data: sessionResult } = await supabase
        .from('payment_sessions')
        .select('id, user_id, transaction_reference, gateway_transaction_id, status, created_at')
        .or(`transaction_reference.eq.${ref},gateway_transaction_id.eq.${ref}`)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (sessionResult) {
        txnData = sessionResult
        isSession = true
      }
    }

    if (!txnData) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // For ZenoPay we primarily trust our DB which is updated by webhooks.
    // Map internal transaction status to a coarse-grained external status string for the client.
    const map: Record<string, string> = {
      completed: 'COMPLETED',
      failed: 'FAILED',
      processing: 'PROCESSING',
      pending: 'PENDING',
      cancelled: 'CANCELLED',
      awaiting_verification: 'PENDING',
    }
    const txn = txnData
    let statusRaw = map[txn.status as keyof typeof map] || 'PENDING'

    // Simple timeout handling - let webhooks handle completion naturally
    const createdAt = new Date(txn.created_at)
    const now = new Date()
    const minutesElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60)
    
    // In production, mark as failed after a reasonable timeout.
    const PAYMENT_PROCESSING_TIMEOUT_SECONDS = 30;
    const timeoutMinutes = PAYMENT_PROCESSING_TIMEOUT_SECONDS / 60;

    if (statusRaw === 'PROCESSING' && process.env.NODE_ENV === 'production' && minutesElapsed > timeoutMinutes) {
      statusRaw = 'FAILED'
      console.log('Payment timed out in production:', txn.transaction_reference)
    }

    // Optional: when still pending/processing, query ZenoPay directly for latest status
    const enableRemote = (process.env.ZENOPAY_REMOTE_STATUS || 'true').toLowerCase() !== 'false'
    if (enableRemote && (statusRaw === 'PENDING' || statusRaw === 'PROCESSING')) {
      try {
        const client = new ZenoPayClient()
        type ZenoOrderStatusItem = { payment_status?: string; status?: string; result?: string }
        type ZenoOrderStatusResponse = { data?: ZenoOrderStatusItem[]; payment_status?: string; status?: string; result?: string }
        const remote = (await client.getOrderStatus(txn.transaction_reference)) as ZenoOrderStatusResponse

        const dataArr = Array.isArray(remote?.data) ? remote.data : []
        const candidate = dataArr[0] || remote
        const raw = String(
          candidate?.payment_status || candidate?.status || candidate?.result || ''
        ).toUpperCase()

        const successSet = new Set(['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'APPROVED', 'PAID', 'SETTLED', 'SUCCESSFUL'])
        const pendingSet = new Set(['PENDING', 'PROCESSING', 'AWAITING', 'QUEUED'])
        const cancelSet = new Set(['CANCELLED', 'CANCELED'])
        const failSet = new Set(['FAILED', 'DECLINED', 'ERROR', 'REJECTED', 'TIMEOUT'])

        if (raw) {
          if (successSet.has(raw)) statusRaw = 'COMPLETED'
          else if (pendingSet.has(raw)) statusRaw = 'PENDING'
          else if (cancelSet.has(raw)) statusRaw = 'CANCELLED'
          else if (failSet.has(raw)) statusRaw = 'FAILED'
        }

        // If remote indicates success for a session-based transaction, proactively trigger our internal webhook
        // to finalize the order and clear the cart without waiting for external webhook delivery.
        if (statusRaw === 'COMPLETED' && isSession) {
          try {
            const base = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin
            const url = `${base}/api/payments/mock-webhook`
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transaction_reference: txn.transaction_reference, status: 'COMPLETED' }),
            })
          } catch {
            // best-effort
          }
        }
      } catch {
        // Ignore remote errors; fall back to DB status
      }
    }

    return NextResponse.json({ status: statusRaw, raw: txn, is_session: isSession })
  } catch (err: unknown) {
    const message = (err as Error)?.message || 'Failed to fetch status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


