import { createClient, type RealtimeChannel } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sseEncode(obj: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`)
}

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE!

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let channel: RealtimeChannel | null = null
  let keepAlive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        console.log('[admin-cart-sse] start')
      } catch {}
      controller.enqueue(sseEncode({ type: 'ready' }))

      channel = supabase
        .channel('admin-cart-stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cart_items' },
          (payload) => {
            try {
              console.log('[admin-cart-sse] change', { event: payload.eventType })
            } catch {}
            controller.enqueue(sseEncode({ type: 'cart_change', event: payload.eventType }))
          }
        )
        .subscribe((status) => {
          try {
            console.log('[admin-cart-sse] channel status', { status })
          } catch {}
          if (status === 'SUBSCRIBED') {
            controller.enqueue(sseEncode({ type: 'subscribed' }))
          }
        })

      keepAlive = setInterval(() => {
        try { controller.enqueue(sseEncode({ type: 'ping', t: Date.now() })) } catch {}
      }, 25000)
    },
    cancel() {
      try {
        console.log('[admin-cart-sse] cancel')
      } catch {}
      if (keepAlive) clearInterval(keepAlive)
      if (channel) supabase.removeChannel(channel)
      channel = null
      keepAlive = null
    }
  })

  req.signal.addEventListener('abort', () => {
    try {
      console.log('[admin-cart-sse] abort')
    } catch {}
    if (channel) supabase.removeChannel(channel)
    if (keepAlive) clearInterval(keepAlive)
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
