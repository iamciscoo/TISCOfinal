import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
// Dynamic import of notification service to avoid build issues

export const runtime = 'nodejs'

// Use service role on server to avoid RLS insert failures and standardize server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ContactMessageInput = {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => ({}))) as Partial<ContactMessageInput>
    const name = typeof raw?.name === 'string' ? raw.name.trim() : ''
    const emailRaw = typeof raw?.email === 'string' ? raw.email : ''
    const email = emailRaw.trim().toLowerCase()
    const subject = typeof raw?.subject === 'string' ? raw.subject.trim() : ''
    const message = typeof raw?.message === 'string' ? raw.message.trim() : ''

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (name.length < 2 || name.length > 200) {
      return NextResponse.json({ error: 'Name must be between 2 and 200 characters' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (subject.length < 2 || subject.length > 200) {
      return NextResponse.json({ error: 'Subject must be between 2 and 200 characters' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message should be at least 10 characters' }, { status: 400 })
    }

    const { data: insertedMessage, error } = await supabase
      .from('contact_messages')
      .insert({ name, email, subject, message })
      .select()
      .single()

    if (error) {
      console.error('Contact message insert error:', error)
      // Surface a generic error to client
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Send admin notification about new contact message
    try {
      // Import notification service dynamically to avoid build issues
      const { notifyContactMessageReceived } = await import('@/lib/notifications/service')
      
      await notifyContactMessageReceived({
        admin_email: process.env.ADMIN_EMAIL || 'info@tiscmarket.store',
        customer_name: name,
        customer_email: email,
        subject: subject,
        message: message,
        message_id: insertedMessage.id
      })
      console.log('Admin notification sent for new contact message')
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
      // Don't fail the contact message creation if email fails
    }

    return NextResponse.json({ message: 'Message received. We will get back to you shortly.' }, { status: 201 })
  } catch (e) {
    console.error('Contact messages POST error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
