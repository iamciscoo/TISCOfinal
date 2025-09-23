import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
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
    const category = url.searchParams.get('category') || undefined
    const platform_module = url.searchParams.get('platform_module') || undefined
    const priority = url.searchParams.get('priority') || undefined

    let query = supabase
      .from('notifications')
      .select(`
        *,
        notification_recipients(
          id,
          user_id,
          status,
          sent_at,
          failed_at,
          error_message
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (category) query = query.eq('category', category)
    if (platform_module) query = query.eq('platform_module', platform_module)
    if (priority) query = query.eq('priority', priority)

    const { data: notifications, error } = await query

    if (error) {
      console.error('Failed to fetch notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      notifications: notifications || [] 
    })
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
    const { 
      event, 
      recipient_email, 
      recipient_name, 
      subject,
      content,
      title,
      category,
      platform_module,
      entity_id,
      entity_type,
      action_required,
      action_url,
      channels, 
      priority, 
      scheduled_at,
      expires_at,
      metadata 
    } = body

    if (!event || !recipient_email || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: event, recipient_email, subject, content' },
        { status: 400 }
      )
    }

    // Create notification with enhanced fields
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        event,
        recipient_email,
        recipient_name,
        subject,
        content,
        title,
        category: category || 'general',
        platform_module,
        entity_id,
        entity_type,
        action_required: action_required || false,
        action_url,
        channels: channels || ['email'],
        priority: priority || 'medium',
        scheduled_at,
        expires_at,
        metadata: metadata || {},
        status: scheduled_at ? 'scheduled' : 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      notification 
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to send notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
