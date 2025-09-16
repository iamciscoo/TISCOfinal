import { createClient } from '@supabase/supabase-js'

// Admin notification service for sending alerts to admin recipients
export class AdminNotificationService {
  private supabase: any

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE
    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    }
  }

  // Get all active admin recipients
  async getActiveRecipients(): Promise<Array<{ email: string; name?: string }>> {
    if (!this.supabase) return []
    
    try {
      const { data, error } = await this.supabase
        .from('notification_recipients')
        .select('email, name')
        .eq('is_active', true)
      
      if (error) {
        console.warn('Failed to fetch admin recipients:', error.message)
        return []
      }
      
      return data || []
    } catch (e) {
      console.warn('Error fetching admin recipients:', e)
      return []
    }
  }

  // Send notification to all active admin recipients
  async notifyAdmins(params: {
    title: string
    message: string
    action_url?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<void> {
    const recipients = await this.getActiveRecipients()
    if (recipients.length === 0) {
      console.log('No active admin recipients found')
      return
    }

    const notificationPromises = recipients.map(recipient => 
      this.sendAdminNotification({
        recipient_email: recipient.email,
        recipient_name: recipient.name || 'Admin',
        title: params.title,
        message: params.message,
        action_url: params.action_url,
        priority: params.priority || 'medium'
      })
    )

    try {
      await Promise.allSettled(notificationPromises)
      console.log(`Admin notifications sent to ${recipients.length} recipients`)
    } catch (e) {
      console.error('Error sending admin notifications:', e)
    }
  }

  // Send individual admin notification via API
  private async sendAdminNotification(params: {
    recipient_email: string
    recipient_name: string
    title: string
    message: string
    action_url?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<void> {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'admin_notification',
          recipient_email: params.recipient_email,
          recipient_name: params.recipient_name,
          priority: params.priority,
          data: {
            title: params.title,
            message: params.message,
            action_url: params.action_url
          }
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
    } catch (e) {
      console.error(`Failed to send admin notification to ${params.recipient_email}:`, e)
      throw e
    }
  }

  // Notify admins about new user notifications/events
  async notifyNewUserNotification(params: {
    event_type: string
    user_email: string
    notification_subject: string
    details?: string
  }): Promise<void> {
    await this.notifyAdmins({
      title: `New ${params.event_type} Notification Sent`,
      message: `A ${params.event_type} notification was sent to ${params.user_email}.\n\nSubject: ${params.notification_subject}${params.details ? `\n\nDetails: ${params.details}` : ''}`,
      priority: 'medium'
    })
  }

  // Notify admins about system events
  async notifySystemEvent(params: {
    event: string
    description: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<void> {
    await this.notifyAdmins({
      title: `System Event: ${params.event}`,
      message: params.description,
      priority: params.priority || 'medium'
    })
  }
}

// Export singleton instance
export const adminNotificationService = new AdminNotificationService()
