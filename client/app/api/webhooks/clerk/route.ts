import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Minimal payload types from Clerk webhook we actually use
type Verification = { status?: string }
type EmailAddress = {
  id?: string
  email_address?: string
  emailAddress?: string
  email?: string
  verification?: Verification
}
type PhoneNumber = {
  id?: string
  phone_number?: string
  phoneNumber?: string
  verification?: Verification
}
interface ClerkUserPayload {
  id: string
  email_addresses?: EmailAddress[]
  phone_numbers?: PhoneNumber[]
  primary_email_address_id?: string
  primary_phone_number_id?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  image_url?: string
  imageUrl?: string
}

type UserRecord = {
  id: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  avatar_url?: string
  is_verified: boolean
  updated_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

function computeIsVerified(d: ClerkUserPayload): boolean {
  const emails: EmailAddress[] = Array.isArray(d?.email_addresses) ? d.email_addresses! : []
  const phones: PhoneNumber[] = Array.isArray(d?.phone_numbers) ? d.phone_numbers! : []
  const emailVerified = emails.some((e) => e?.verification?.status === 'verified')
  const phoneVerified = phones.some((p) => p?.verification?.status === 'verified')
  return emailVerified || phoneVerified
}

function getPrimaryEmail(d: ClerkUserPayload): string | undefined {
  const emails: EmailAddress[] = Array.isArray(d?.email_addresses) ? d.email_addresses! : []
  const primaryId = d?.primary_email_address_id
  const primary = emails.find((e) => e?.id === primaryId) ?? emails[0]
  return primary?.email_address ?? primary?.emailAddress ?? primary?.email ?? undefined
}

function getPrimaryPhone(d: ClerkUserPayload): string | undefined {
  const phones: PhoneNumber[] = Array.isArray(d?.phone_numbers) ? d.phone_numbers! : []
  const primaryId = d?.primary_phone_number_id
  const primary = phones.find((p) => p?.id === primaryId) ?? phones[0]
  return primary?.phone_number ?? primary?.phoneNumber ?? undefined
}

export async function POST(req: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.warn('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const payload = await req.text()

  try {
    const wh = new Webhook(secret)
    const evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as { type: string; data: ClerkUserPayload }

    const { type, data } = evt

    // Debug context (no secrets logged)
    console.log('[Clerk webhook] Received event', {
      type,
      userId: data?.id,
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })

    if (!data?.id) {
      return NextResponse.json({ error: 'Missing user id in event' }, { status: 400 })
    }

    switch (type) {
      case 'user.created':
      case 'user.updated': {
        const record: UserRecord = {
          id: data.id,
          email: getPrimaryEmail(data),
          first_name: data.first_name ?? data.firstName,
          last_name: data.last_name ?? data.lastName,
          phone: getPrimaryPhone(data),
          avatar_url: data.image_url ?? data.imageUrl,
          is_verified: computeIsVerified(data),
          updated_at: new Date().toISOString(),
        }
        // Build a cleaned object without undefined optionals
        const cleaned: UserRecord = {
          id: record.id,
          is_verified: record.is_verified,
          updated_at: record.updated_at,
          ...(record.email ? { email: record.email } : {}),
          ...(record.first_name ? { first_name: record.first_name } : {}),
          ...(record.last_name ? { last_name: record.last_name } : {}),
          ...(record.phone ? { phone: record.phone } : {}),
          ...(record.avatar_url ? { avatar_url: record.avatar_url } : {}),
        }

        console.log('[Clerk webhook] Upserting user', { id: cleaned.id, email: cleaned.email })
        const { error } = await supabase.from('users').upsert(cleaned)
        if (error) {
          console.error('[Clerk webhook] Upsert error:', error)
          return NextResponse.json({ error: 'Database upsert failed' }, { status: 500 })
        }
        console.log('[Clerk webhook] Upsert success', { id: cleaned.id })
        // Post-upsert verification: read the row back for diagnostics
        const { data: verifyRow, error: verifyErr } = await supabase
          .from('users')
          .select('id,email,updated_at')
          .eq('id', cleaned.id)
          .maybeSingle()
        if (verifyErr) {
          console.error('[Clerk webhook] Post-upsert verify error:', verifyErr)
        } else {
          console.log('[Clerk webhook] Post-upsert verify row:', verifyRow)
        }
        break
      }
      case 'user.deleted': {
        console.log('[Clerk webhook] Deleting user', { id: data.id })
        const { error } = await supabase.from('users').delete().eq('id', data.id)
        if (error) {
          console.error('[Clerk webhook] Delete error:', error)
          return NextResponse.json({ error: 'Database delete failed' }, { status: 500 })
        }
        console.log('[Clerk webhook] Delete success', { id: data.id })
        break
      }
      default:
        console.log('[Clerk webhook] Unhandled event:', type)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
}
