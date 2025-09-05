import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient, type RealtimeChannel } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sseEncode(obj: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`)
}

export async function GET(req: Request) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!
  )

  let channel: RealtimeChannel | null = null
  let keepAlive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      try {
        console.log('[cart-sse] start: user', user.id)
      } catch {}
      controller.enqueue(sseEncode({ type: 'ready' }))

      channel = supabase
        .channel(`cart-stream-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
          (payload) => {
            try {
              console.log('[cart-sse] change', { userId: user.id, event: payload.eventType })
            } catch {}
            controller.enqueue(sseEncode({ type: 'cart_change', event: payload.eventType }))
          }
        )
        .subscribe((status) => {
          try {
            console.log('[cart-sse] channel status', { userId: user.id, status })
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
        console.log('[cart-sse] cancel: user', user.id)
      } catch {}
      if (keepAlive) clearInterval(keepAlive)
      if (channel) supabase.removeChannel(channel)
      channel = null
      keepAlive = null
    }
  })

  // Cleanup on client abort
  req.signal.addEventListener('abort', () => {
    try {
      console.log('[cart-sse] abort: user', user.id)
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
