import { createClient, type RealtimeChannel } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function sseEncode(obj: unknown) {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`)
}

export async function GET(req: Request) {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  let channel: RealtimeChannel | null = null
  let keepAlive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sseEncode({ type: 'ready' }))

      channel = supabase
        .channel('admin-revenue-stream')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            controller.enqueue(sseEncode({ type: 'orders_change', event: payload.eventType }))
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            controller.enqueue(sseEncode({ type: 'subscribed' }))
          }
        })

      keepAlive = setInterval(() => {
        try { controller.enqueue(sseEncode({ type: 'ping', t: Date.now() })) } catch {}
      }, 25000)
    },
    cancel() {
      if (keepAlive) clearInterval(keepAlive)
      if (channel) supabase.removeChannel(channel)
      channel = null
      keepAlive = null
    }
  })

  req.signal.addEventListener('abort', () => {
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
