import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      device_tokens, 
      title, 
      body, 
      data = {}, 
      badge_count,
      sound = 'default',
      category,
      priority = 'normal',
      send_immediately = false
    } = await req.json()

    if (!device_tokens || device_tokens.length === 0 || !title || !body) {
      return NextResponse.json({ 
        error: 'Device tokens, title, and body are required' 
      }, { status: 400 })
    }

    // Validate device tokens format
    const validTokens = device_tokens.filter((token: string) => 
      token && typeof token === 'string' && token.length > 10
    )

    if (validTokens.length === 0) {
      return NextResponse.json({ error: 'No valid device tokens provided' }, { status: 400 })
    }

    // Create push notification record
    const { data: notification, error } = await supabase
      .from('push_notifications')
      .insert({
        user_id: user.id,
        device_tokens: validTokens,
        title,
        body,
        data,
        badge_count,
        sound,
        category,
        priority,
        status: send_immediately ? 'pending' : 'queued',
        scheduled_for: send_immediately ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send push notification immediately if requested
    if (send_immediately) {
      try {
        await sendPushNotification(notification)
      } catch (pushError) {
        console.error('Push notification send error:', pushError)
        // Update notification status to failed
        await supabase
          .from('push_notifications')
          .update({ 
            status: 'failed', 
            error_message: (pushError as Error).message,
            failed_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }
    }

    return NextResponse.json({ 
      notification_id: notification.id,
      status: notification.status,
      device_count: validTokens.length,
      message: send_immediately ? 'Push notification sent' : 'Push notification queued for sending'
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process push notification' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('push_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (category) {
      query = query.eq('category', category)
    }

    const { data: notifications, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: notifications || [] }, { status: 200 })

  } catch (error: unknown) {
    console.error('Push notifications fetch error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch push notifications' },
      { status: 500 }
    )
  }
}

// Register device token for push notifications
export async function PUT(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { device_token, device_type, app_version } = await req.json()

    if (!device_token || !device_type) {
      return NextResponse.json({ 
        error: 'Device token and device type are required' 
      }, { status: 400 })
    }

    // Check if device token already exists
    const { data: existingDevice, error: findError } = await supabase
      .from('user_devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('device_token', device_token)
      .single()

    if (findError && findError.code !== 'PGRST116') {
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (existingDevice) {
      // Update existing device
      const { data: device, error: updateError } = await supabase
        .from('user_devices')
        .update({
          device_type,
          app_version,
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDevice.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        device,
        message: 'Device token updated' 
      }, { status: 200 })
    } else {
      // Register new device
      const { data: device, error: insertError } = await supabase
        .from('user_devices')
        .insert({
          user_id: user.id,
          device_token,
          device_type,
          app_version,
          is_active: true,
          last_active: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        device,
        message: 'Device token registered' 
      }, { status: 201 })
    }

  } catch (error: unknown) {
    console.error('Device registration error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to register device' },
      { status: 500 }
    )
  }
}

interface PushNotificationRequest {
  id?: string
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
  priority?: string
  device_tokens?: string[]
  sound?: string
  badge_count?: number
  category?: string
}

async function sendPushNotification(notification: PushNotificationRequest): Promise<void> {
  // Mock push notification implementation
  // In production, integrate with services like:
  // - Firebase Cloud Messaging (FCM)
  // - Apple Push Notification Service (APNs)
  // - OneSignal
  // - Pusher Beams
  // - AWS SNS Mobile Push
  
  const payload = {
    tokens: notification.device_tokens,
    notification: {
      title: notification.title,
      body: notification.body,
      sound: notification.sound,
      badge: notification.badge_count
    },
    data: notification.data,
    android: {
      priority: notification.priority === 'high' ? 'high' : 'normal',
      notification: {
        channel_id: notification.category || 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: notification.title,
            body: notification.body
          },
          sound: notification.sound,
          badge: notification.badge_count,
          category: notification.category
        }
      }
    }
  }

  console.log('Sending push notification:', payload)

  // Simulate push sending delay
  await new Promise(resolve => setTimeout(resolve, 300))

  // Mock success/failure (92% success rate for push notifications)
  if (Math.random() > 0.92) {
    throw new Error('Push notification service temporarily unavailable')
  }

  // Update notification status to sent
  await supabase
    .from('push_notifications')
    .update({ 
      status: 'sent', 
      sent_at: new Date().toISOString()
    })
    .eq('id', notification.id)
}
