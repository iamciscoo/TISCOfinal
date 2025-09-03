import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
export const runtime = 'nodejs';


type MessageUpdate = {
  status?: 'new' | 'read' | 'responded' | 'closed'
  response?: string | null
  responded_by?: string | null
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const body = (await req.json().catch(() => ({}))) as MessageUpdate

    const updates: Record<string, unknown> = {}

    if (body.status) {
      if (!['new', 'read', 'responded', 'closed'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
    }

    if (body.response !== undefined) {
      const text = typeof body.response === 'string' ? body.response.trim() : null
      updates.response = text && text.length > 0 ? text : null
    }

    if (body.responded_by !== undefined) {
      updates.responded_by = body.responded_by || null
    }

    // If response provided and status not set, set status to 'responded'
    if (updates.response && !updates.status) {
      updates.status = 'responded'
    }

    // If set to responded, stamp responded_at
    if (updates.status === 'responded') {
      updates.responded_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // If a response was provided, queue an email notification to the customer (best-effort)
    try {
      if (updates.response && data && 'email' in data) {
        const messageData = data as { email: string; subject?: string; name?: string; message?: string; response?: string; id: string }
        const recipient = messageData.email
        const subj = `Re: ${messageData.subject ?? 'Your inquiry'}`
        const templatePayload = {
          customer_name: messageData.name ?? null,
          original_message: messageData.message ?? null,
          admin_response: messageData.response ?? updates.response,
          message_id: messageData.id ?? id,
        }
        // Insert into email_notifications if available
        await supabase
          .from('email_notifications')
          .insert({
            // user_id intentionally omitted (may be anonymous contact)
            template_type: 'contact_reply',
            recipient_email: recipient,
            subject: subj,
            template_data: templatePayload,
            priority: 'normal',
            status: 'queued',
            scheduled_for: null,
          })
      }
    } catch (e) {
      // Do not fail the primary operation due to notification issues
      console.error('Queue contact reply email failed:', (e as Error).message)
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
