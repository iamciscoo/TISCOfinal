import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  sanitizeInput, 
  sanitizeEmail, 
  validateRequestSize, 
  checkRateLimit 
} from '@/lib/security/sanitizer'
// Dynamic import of notification service to avoid build issues

export const runtime = 'nodejs'

// Use service role on server to avoid RLS insert failures and standardize server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

type ContactMessageInput = {
  name: string
  email: string
  subject: string
  message: string
}

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
    
    // Rate limiting: 5 messages per hour per IP
    if (!checkRateLimit(`contact_${clientIp}`, 5, 3600000)) {
      return NextResponse.json(
        { error: 'Too many contact messages. Please try again later.' }, 
        { status: 429 }
      )
    }

    const raw = (await req.json().catch(() => ({}))) as Partial<ContactMessageInput>
    
    // Validate request size (max 50KB)
    validateRequestSize(raw, 50)

    // Sanitize and validate inputs
    const name = typeof raw?.name === 'string' ? sanitizeInput(raw.name, 200) : ''
    const email = typeof raw?.email === 'string' ? sanitizeEmail(raw.email) : ''
    const subject = typeof raw?.subject === 'string' ? sanitizeInput(raw.subject, 200) : ''
    const message = typeof raw?.message === 'string' ? sanitizeInput(raw.message, 5000) : ''

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }

    if (subject.length < 2) {
      return NextResponse.json({ error: 'Subject must be at least 2 characters' }, { status: 400 })
    }

    if (message.length < 10) {
      return NextResponse.json({ error: 'Message should be at least 10 characters' }, { status: 400 })
    }

    // Additional spam protection
    if (message.includes('http://') || message.includes('https://') || 
        message.includes('www.') || message.includes('.com') ||
        message.toLowerCase().includes('bitcoin') || 
        message.toLowerCase().includes('cryptocurrency')) {
      return NextResponse.json({ error: 'Message contains prohibited content' }, { status: 400 })
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
        admin_email: process.env.ADMIN_EMAIL || 'info@tiscomarket.store',
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
