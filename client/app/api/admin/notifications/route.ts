import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { notificationService } from '@/lib/notifications/service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', userId)
    .single()
  
  return data?.role === 'admin'
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status') || undefined
    const event = url.searchParams.get('event') || undefined

    const notifications = await notificationService.getNotifications(
      limit,
      offset,
      status,
      event as any
    )

    return NextResponse.json({ notifications }, { status: 200 })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { event, recipient_email, recipient_name, data, channels, priority, scheduled_at } = body

    if (!event || !recipient_email || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: event, recipient_email, data' },
        { status: 400 }
      )
    }

    const notificationId = await notificationService.sendNotification({
      event,
      recipient_email,
      recipient_name,
      data,
      channels,
      priority,
      scheduled_at
    })

    return NextResponse.json({ id: notificationId }, { status: 201 })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
