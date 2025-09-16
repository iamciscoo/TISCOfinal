import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST() {
  try {
    console.log('🔄 Processing pending notifications...')
    
    // Get pending notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50)

    if (error) {
      console.error('❌ Failed to fetch pending notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!notifications || notifications.length === 0) {
      console.log('✅ No pending notifications to process')
      return NextResponse.json({ message: 'No pending notifications', processed: 0 }, { status: 200 })
    }

    console.log(`📧 Found ${notifications.length} pending notifications`)

    // Import notification service functions
    const { notifyPaymentSuccess } = await import('@/lib/notifications/service')
    
    let processed = 0
    let failed = 0

    for (const notification of notifications) {
      try {
        console.log(`📤 Processing notification ${notification.id} (${notification.event})`)
        
        if (notification.event === 'payment_success') {
          const metadata = notification.metadata as any
          await notifyPaymentSuccess({
            order_id: metadata?.order_id || 'unknown',
            customer_email: notification.recipient_email,
            customer_name: notification.recipient_name || 'Customer',
            amount: metadata?.amount || '0',
            currency: metadata?.currency || 'TZS',
            payment_method: metadata?.payment_method || 'Payment',
            transaction_id: metadata?.transaction_id || 'N/A'
          })
        }
        
        // Update notification status to sent
        await supabase
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)
          
        processed++
        console.log(`✅ Successfully processed notification ${notification.id}`)
      } catch (error) {
        failed++
        console.error(`❌ Failed to process notification ${notification.id}:`, error)
        
        // Update notification status to failed
        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: (error as Error).message,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }
    }

    console.log(`📊 Processing complete: ${processed} sent, ${failed} failed`)

    return NextResponse.json({
      message: 'Notification processing complete',
      processed,
      failed,
      total: notifications.length
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Notification processing error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to process notifications' },
      { status: 500 }
    )
  }
}
