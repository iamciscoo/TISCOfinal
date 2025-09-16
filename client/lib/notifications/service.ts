import { sendEmailViaSendPulse, getSendPulseConfig, type SendPulseEmail } from './sendpulse'
import { renderEmailTemplate, getDefaultSubject, type TemplateType } from '../email-templates'
import { createClient } from '@supabase/supabase-js'

// Supabase client for notifications
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type NotificationEvent = 
  | 'order_created'
  | 'order_status_changed'
  | 'order_confirmation'
  | 'order_status_update'
  | 'payment_success'
  | 'payment_failed'
  | 'booking_created'
  | 'booking_status_changed'
  | 'user_registered'
  | 'contact_message_received'
  | 'contact_message_replied'
  | 'contact_reply'
  | 'cart_abandoned'
  | 'password_reset_requested'
  | 'admin_order_created'

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'

export interface NotificationData {
  event: NotificationEvent
  recipient_email: string
  recipient_name?: string
  data: Record<string, any>
  channels?: NotificationChannel[]
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  scheduled_at?: string
}

export interface NotificationRecord {
  id: string
  event: NotificationEvent
  recipient_email: string
  recipient_name?: string
  subject: string
  content: string
  channels: NotificationChannel[]
  status: 'pending' | 'sent' | 'failed' | 'scheduled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  error_message?: string
  sent_at?: string
  scheduled_at?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

class NotificationService {
  private config = getSendPulseConfig()

  // Map notification events to email templates
  private getTemplateForEvent(event: NotificationEvent): TemplateType | null {
    const eventTemplateMap: Record<NotificationEvent, TemplateType | null> = {
      order_created: 'order_confirmation',
      order_confirmation: 'order_confirmation',
      order_status_changed: 'order_status_update',
      order_status_update: 'order_status_update',
      payment_success: 'payment_success',
      payment_failed: 'payment_failed',
      booking_created: 'order_confirmation', // We'll create booking-specific templates
      booking_status_changed: 'order_status_update',
      user_registered: 'welcome_email',
      contact_message_received: 'admin_notification', // Use admin-styled template
      contact_message_replied: 'contact_reply',
      contact_reply: 'contact_reply',
      cart_abandoned: 'cart_abandonment',
      password_reset_requested: 'password_reset',
      admin_order_created: 'admin_notification',
    }
    return eventTemplateMap[event]
  }

  // Send notification
  async sendNotification(notificationData: NotificationData): Promise<string> {
    try {
      // Create notification record
      const notificationRecord = await this.createNotificationRecord(notificationData)
      
      // Process each channel
      const channels = notificationData.channels || ['email']
      
      for (const channel of channels) {
        if (channel === 'email') {
          await this.sendEmailNotification(notificationRecord, notificationData)
        }
        // Add other channels (SMS, push, in-app) here in the future
      }

      // Mark as sent
      await this.updateNotificationStatus(notificationRecord.id, 'sent')
      
      return notificationRecord.id
    } catch (error) {
      console.error('Notification send error:', error)
      throw error
    }
  }

  // Create notification record with graceful DB fallback
  private async createNotificationRecord(data: NotificationData): Promise<NotificationRecord> {
    const template = this.getTemplateForEvent(data.event)
    const subject = template ? getDefaultSubject(template) : `TISCO Market - ${data.event}`
    
    let content = ''
    if (template) {
      try {
        content = await renderEmailTemplate(template, data.data)
      } catch (error) {
        console.error('Template render error:', error)
        content = `Notification for event: ${data.event}`
      }
    }

    // Attempt DB insert first (email_notifications), fallback to temp record
    try {
      const insertPayload: any = {
        template_type: template || 'admin_notification',
        recipient_email: data.recipient_email,
        subject,
        template_data: data.data || {},
        priority: data.priority || 'medium',
        status: 'pending',
        scheduled_for: data.scheduled_at || new Date().toISOString(),
      }
      const { data: inserted, error } = await supabase
        .from('email_notifications')
        .insert(insertPayload)
        .select()
        .single()

      if (!error && inserted) {
        const record: NotificationRecord = {
          id: inserted.id,
          event: data.event,
          recipient_email: data.recipient_email,
          recipient_name: data.recipient_name,
          subject,
          content,
          channels: (data.channels || ['email']) as NotificationChannel[],
          status: (inserted.status || 'pending') as NotificationRecord['status'],
          priority: (inserted.priority || data.priority || 'medium') as NotificationRecord['priority'],
          sent_at: inserted.sent_at || undefined,
          scheduled_at: inserted.scheduled_for || undefined,
          created_at: inserted.created_at || new Date().toISOString(),
          updated_at: inserted.updated_at || new Date().toISOString(),
          metadata: data.data,
        }
        console.log('Created notification DB record:', record.id)
        return record
      }
      if (error) throw error
    } catch (e) {
      // Try legacy notifications table before falling back to temp
      console.warn('Email notifications table not available, trying legacy notifications:', (e as Error)?.message)
      try {
        const legacyInsert = {
          event: data.event,
          recipient_email: data.recipient_email,
          recipient_name: data.recipient_name,
          subject,
          content,
          channels: (data.channels || ['email']) as NotificationChannel[],
          status: 'pending' as const,
          priority: (data.priority || 'medium') as NotificationRecord['priority'],
          scheduled_at: data.scheduled_at || null,
          metadata: data.data || {},
        }
        const { data: insertedLegacy, error: legacyError } = await supabase
          .from('notifications')
          .insert(legacyInsert as any)
          .select()
          .single()
        if (!legacyError && insertedLegacy) {
          const record: NotificationRecord = {
            id: insertedLegacy.id,
            event: insertedLegacy.event,
            recipient_email: insertedLegacy.recipient_email,
            recipient_name: insertedLegacy.recipient_name || undefined,
            subject: insertedLegacy.subject,
            content: insertedLegacy.content,
            channels: insertedLegacy.channels as NotificationChannel[],
            status: insertedLegacy.status,
            priority: insertedLegacy.priority,
            sent_at: insertedLegacy.sent_at || undefined,
            scheduled_at: insertedLegacy.scheduled_at || undefined,
            created_at: insertedLegacy.created_at,
            updated_at: insertedLegacy.updated_at,
            metadata: insertedLegacy.metadata || undefined,
          }
          console.log('Created legacy notification DB record:', record.id)
          return record
        }
        if (legacyError) throw legacyError
      } catch (e2) {
        console.warn('Legacy notifications table unavailable, using temp record:', (e2 as Error)?.message)
      }
    }

    // Fallback temp record
    const tempRecord: NotificationRecord = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event: data.event,
      recipient_email: data.recipient_email,
      recipient_name: data.recipient_name,
      subject,
      content,
      channels: data.channels || ['email'],
      status: 'pending',
      priority: data.priority || 'medium',
      scheduled_at: data.scheduled_at,
      metadata: data.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log('Created notification temp record:', tempRecord.id)
    return tempRecord
  }

  // Send email notification with enhanced HTML rendering
  private async sendEmailNotification(record: NotificationRecord, _data: NotificationData): Promise<void> {
    try {
      // Ensure we have properly rendered HTML content
      if (!record.content || record.content.trim() === '') {
        throw new Error('Email content is empty or invalid')
      }

      // Validate HTML content contains proper structure
      if (!record.content.includes('<!DOCTYPE html') || !record.content.includes('</html>')) {
        console.warn('Email content may not be properly formatted HTML, attempting to send anyway')
      }

      const email: SendPulseEmail = {
        to: record.recipient_email,
        subject: record.subject,
        html: record.content,
        replyTo: 'info@tiscmarket.store',
      }

      console.log(`Sending HTML email to ${record.recipient_email} with subject: ${record.subject}`)
      await sendEmailViaSendPulse(this.config, email)
      console.log(`Successfully sent email notification ${record.id}`)

      // Notify admin recipients about this notification
      try {
        await this.notifyAdminsOfNewNotification(record)
      } catch (adminNotifyError) {
        console.warn('Failed to notify admins of new notification:', adminNotifyError)
        // Don't fail the main notification if admin notification fails
      }
    } catch (error) {
      console.error(`Failed to send email notification ${record.id}:`, error)
      await this.updateNotificationStatus(record.id, 'failed', (error as Error).message)
      throw error
    }
  }

  // Notify admin recipients about new user notifications
  private async notifyAdminsOfNewNotification(record: NotificationRecord): Promise<void> {
    try {
      // Only notify admins for important customer events, not admin events themselves
      const adminNotificationEvents: NotificationEvent[] = [
        'order_created',
        'payment_failed', 
        'contact_message_received',
        'booking_created'
      ]
      
      if (!adminNotificationEvents.includes(record.event)) {
        console.log('Admin notification not needed for:', record.event)
        return
      }

      // Get admin recipients from database
      const { data: recipients, error } = await supabase
        .from('notification_recipients')
        .select('email, name')
        .eq('is_active', true)
      
      if (error || !recipients || recipients.length === 0) {
        console.warn('No admin recipients found, using fallback emails')
        // Use fallback admin emails
        const adminEmails = [
          'francisjacob08@gmail.com',
          'info@tiscomarket.store',
          ...(process.env.ADMIN_EMAIL?.split(',') || [])
        ].filter((email, index, arr) => arr.indexOf(email) === index && email.trim())
        
        for (const email of adminEmails) {
          await this.sendAdminNotificationEmail(email.trim(), 'Admin', record)
        }
      } else {
        // Send to database recipients
        for (const recipient of recipients) {
          await this.sendAdminNotificationEmail(recipient.email, recipient.name || 'Admin', record)
        }
      }
    } catch (error) {
      console.warn('Admin notification error:', error)
    }
  }

  // Send individual admin notification email
  private async sendAdminNotificationEmail(email: string, name: string, record: NotificationRecord): Promise<void> {
    try {
      const eventName = this.getEventDisplayName(record.event)
      const message = this.buildAdminNotificationMessage(record)
      const actionUrl = this.getActionUrl(record)
      
      const adminEmail: SendPulseEmail = {
        to: email,
        subject: `[TISCO Admin] ${eventName} - Action Required`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>TISCO Admin Notification - ${eventName}</title>
    <style>
        body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-full { width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc;">
    
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc;">
        <div style="background: #1e293b; padding: 2rem; text-align: left;">
            <table role="presentation" width="100%" style="border-collapse:collapse;">
                <tr>
                    <td style="width:64px;padding-right:12px;vertical-align:middle;text-align:left;">
                        <div style="width: 48px; height: 48px; background: #f97316; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: bold;">
                            🔔
                        </div>
                    </td>
                    <td style="vertical-align:middle;text-align:left;">
                        <h1 style="color: white; margin: 0; font-size: 2rem;">TISCOマーケット Admin</h1>
                        <p style="color: #cbd5e1; margin: 0.5rem 0 0 0;">${eventName} Notification</p>
                    </td>
                </tr>
            </table>
        </div>
        
        <div style="padding: 2rem; background: white; margin: 1rem;">
            <h2 style="color: #1e293b; margin-bottom: 1rem;">Hello ${name},</h2>
            <p style="color: #374151; line-height: 1.6;">This is an automated notification from your TISCO Market administration system. Please review the details below and take any necessary action.</p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1.5rem; margin: 1.5rem 0;">
                <h3 style="color: #92400e; margin: 0 0 1rem 0; font-size: 1.1rem;">⚠️ ${eventName} Alert</h3>
                <div style="color: #374151; white-space: pre-wrap; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6;">
                    ${message}
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
                <h3 style="color: #1e293b; margin-bottom: 1rem;">Notification Details</h3>
                <p><strong>Event Type:</strong> ${record.event}</p>
                <p><strong>Notification ID:</strong> ${record.id}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })} EAT</p>
                ${record.recipient_email ? `<p><strong>Customer Email:</strong> ${record.recipient_email}</p>` : ''}
                ${record.recipient_name ? `<p><strong>Customer Name:</strong> ${record.recipient_name}</p>` : ''}
            </div>
            
            ${actionUrl ? `
            <div style="text-align: left; margin: 2rem 0;">
                <a href="${actionUrl}" style="padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">
                    View Details in Admin Panel
                </a>
            </div>
            ` : ''}
            
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 2rem 0; border-left: 4px solid #3b82f6;">
                <p style="color: #374151; margin: 0; font-size: 14px;">
                    <strong>Action Required:</strong> Please log into the admin panel to review this notification and take appropriate action if necessary. This ensures optimal customer service and system management.
                </p>
            </div>
        </div>
        
        <div style="background: #f1f5f9; padding: 1rem; margin: 1rem 0; font-size: 14px; color: #374151; text-align: left; border-radius: 4px;">
            <p style="margin: 0; font-weight: 600;">TISCOマーケット Administration System</p>
            <p style="margin: 0.5rem 0 0 0;">
                <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none;">info@tiscomarket.store</a> | 
                <a href="tel:+255748624684" style="color: #2563eb; text-decoration: none;">+255 748 624 684</a> | 
                <a href="http://localhost:3001/admin" style="color: #2563eb; text-decoration: none;">Admin Panel</a>
            </p>
            <p style="margin: 0.5rem 0 0 0; font-size: 12px; color: #64748b;">
                This is an automated administrative notification. Please do not reply to this email.
            </p>
        </div>
    </div>
    
    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #64748b; font-size: 12px; padding: 1rem;">
        TISCOマーケット Administrative System | Confidential & Internal Use Only
    </div>
</body>
</html>`,
        replyTo: 'info@tiscomarket.store',
      }

      await sendEmailViaSendPulse(this.config, adminEmail)
      console.log(`Admin notification sent to ${email} for event: ${record.event}`)
    } catch (error) {
      console.error(`Failed to send admin notification to ${email}:`, error)
    }
  }

  // Get priority level for admin notifications based on event type
  private getAdminNotificationPriority(event: NotificationEvent): 'low' | 'medium' | 'high' | 'urgent' {
    const highPriorityEvents: NotificationEvent[] = ['payment_failed', 'order_status_update', 'contact_reply']
    const urgentEvents: NotificationEvent[] = ['payment_failed']
    const lowPriorityEvents: NotificationEvent[] = ['user_registered', 'cart_abandoned']
    
    if (urgentEvents.includes(event)) return 'urgent'
    if (highPriorityEvents.includes(event)) return 'high'
    if (lowPriorityEvents.includes(event)) return 'low'
    return 'medium'
  }

  // Get human-readable event name
  private getEventDisplayName(event: NotificationEvent): string {
    const eventNames: Record<NotificationEvent, string> = {
      order_created: 'Order Created',
      order_confirmation: 'Order Confirmation',
      order_status_changed: 'Order Status Changed',
      order_status_update: 'Order Status Update',
      payment_success: 'Payment Success',
      payment_failed: 'Payment Failed',
      booking_created: 'Booking Created',
      booking_status_changed: 'Booking Status Changed',
      user_registered: 'User Registered',
      contact_message_received: 'Contact Message Received',
      contact_message_replied: 'Contact Message Replied',
      contact_reply: 'Contact Reply',
      cart_abandoned: 'Cart Abandoned',
      password_reset_requested: 'Password Reset Requested',
      admin_order_created: 'Admin Order Created'
    }
    return eventNames[event] || event.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Build detailed admin notification message
  private buildAdminNotificationMessage(record: NotificationRecord): string {
    const eventName = this.getEventDisplayName(record.event)
    let message = `A ${eventName.toLowerCase()} notification was sent to a customer.`
    
    if (record.recipient_email) {
      message += `\n\nCustomer Email: ${record.recipient_email}`
    }
    
    if (record.recipient_name) {
      message += `\nCustomer Name: ${record.recipient_name}`
    }
    
    message += `\n\nNotification Subject: ${record.subject}`
    
    if (record.content) {
      message += `\nContent Preview: ${record.content.substring(0, 100)}${record.content.length > 100 ? '...' : ''}`
    }
    
    message += `\n\nSystem Details:`
    message += `\n• Notification ID: ${record.id}`
    message += `\n• Event Type: ${record.event}`
    message += `\n• Status: ${record.status}`
    message += `\n• Timestamp: ${new Date().toLocaleString('en-TZ', { timeZone: 'Africa/Dar_es_Salaam' })} EAT`
    
    // Add event-specific context and action items
    if (record.event === 'payment_failed') {
      message += '\n\n🚨 URGENT ACTION REQUIRED:'
      message += '\n• Contact customer immediately'
      message += '\n• Verify payment method and retry'
      message += '\n• Consider alternative payment options'
    } else if (record.event === 'order_created') {
      message += '\n\n📋 ACTION ITEMS:'
      message += '\n• Review order details and inventory'
      message += '\n• Confirm delivery schedule'
      message += '\n• Prepare items for shipment'
    } else if (record.event === 'contact_message_received') {
      message += '\n\n💬 CUSTOMER SUPPORT REQUIRED:'
      message += '\n• Review customer inquiry'
      message += '\n• Respond within 24 hours'
      message += '\n• Update ticket status'
    } else if (record.event === 'booking_created') {
      message += '\n\n📅 SERVICE BOOKING:'
      message += '\n• Confirm appointment availability'
      message += '\n• Contact customer to schedule'
      message += '\n• Prepare service requirements'
    }
    
    return message
  }

  // Get action URL for admin notifications (if applicable)
  private getActionUrl(record: NotificationRecord): string | undefined {
    // You can customize these URLs based on your admin panel structure
    if (record.event === 'order_created' || record.event === 'order_confirmation' || record.event === 'order_status_changed' || record.event === 'order_status_update') {
      return 'http://localhost:3001/orders' // Admin orders page
    } else if (record.event === 'contact_message_replied' || record.event === 'contact_reply') {
      return 'http://localhost:3001/messages' // Admin messages page
    } else if (record.event === 'payment_failed') {
      return 'http://localhost:3001/orders?status=payment_failed' // Failed payments
    }
    return undefined
  }

  // Update notification status (attempt DB update; fallback to log)
  private async updateNotificationStatus(
    id: string, 
    status: 'sent' | 'failed', 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      }
      if (status === 'sent') updates.sent_at = new Date().toISOString()
      if (errorMessage) updates.error_message = errorMessage
      const { error } = await supabase
        .from('email_notifications')
        .update(updates)
        .eq('id', id)
      if (error) throw error
    } catch (_e) {
      // Try legacy notifications table
      try {
        const updatesLegacy: Record<string, any> = {
          status,
          updated_at: new Date().toISOString(),
        }
        if (status === 'sent') updatesLegacy.sent_at = new Date().toISOString()
        if (errorMessage) updatesLegacy.error_message = errorMessage
        await supabase.from('notifications').update(updatesLegacy).eq('id', id)
      } catch {
        // Final fallback: just log
        console.log(`Notification ${id} status updated to: ${status}`)
        if (errorMessage) console.log(`Error message: ${errorMessage}`)
      }
    }
  }

  // Get notifications for admin dashboard
  async getNotifications(
    limit = 50,
    offset = 0,
    status?: string,
    event?: NotificationEvent
  ): Promise<NotificationRecord[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (event) {
      query = query.eq('event', event)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return data as NotificationRecord[]
  }

  // Get notification statistics
  async getNotificationStats(): Promise<{
    total: number
    sent: number
    failed: number
    pending: number
    by_event: Record<NotificationEvent, number>
  }> {
    const { data, error } = await supabase
      .from('notifications')
      .select('status, event')

    if (error) {
      throw new Error(`Failed to fetch notification stats: ${error.message}`)
    }

    const stats = {
      total: data.length,
      sent: 0,
      failed: 0,
      pending: 0,
      by_event: {} as Record<NotificationEvent, number>
    }

    data.forEach((notification: Record<string, any>) => {
      // Count by status
      if (notification.status === 'sent') stats.sent++
      else if (notification.status === 'failed') stats.failed++
      else if (notification.status === 'pending') stats.pending++

      // Count by event
      const event = notification.event as NotificationEvent
      stats.by_event[event] = (stats.by_event[event] || 0) + 1
    })

    return stats
  }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Convenience functions for common notification events
export async function notifyOrderCreated(orderData: {
  order_id: string
  customer_email: string
  customer_name: string
  total_amount: string
  currency: string
  items: Array<{ name: string; quantity: number; price: string }>
  order_date: string
  payment_method: string
  shipping_address: string
}) {
  return await notificationService.sendNotification({
    event: 'order_created',
    recipient_email: orderData.customer_email,
    recipient_name: orderData.customer_name,
    data: orderData,
    priority: 'high'
  })
}

export async function notifyAdminOrderCreated(orderData: {
  order_id: string
  customer_email: string
  customer_name: string
  total_amount: string
  currency: string
  payment_method: string
  payment_status: string
  items_count: number
}) {
  try {
    // Get admin recipients from database using Supabase MCP
    const { data: recipients, error } = await supabase
      .from('notification_recipients')
      .select('email, name')
      .eq('is_active', true)
    
    if (error) {
      console.warn('Failed to fetch admin recipients, using fallback:', error)
      // Use hardcoded admin emails - can be expanded to database-driven later
      const adminEmails = [
        'francisjacob08@gmail.com',  // Primary admin
        'info@tiscomarket.store',     // Business email
        ...(process.env.ADMIN_EMAIL?.split(',') || [])
      ].filter((email, index, arr) => arr.indexOf(email) === index) // Remove duplicates
      
      console.log('Sending admin notifications to:', adminEmails)
      const notifications = adminEmails.map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email.trim(),
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
            action_url: `https://www.tiscomarket.store/admin/orders/${orderData.order_id}`
          },
          priority: 'high'
        })
      )
      return await Promise.allSettled(notifications)
    }
    
    if (!recipients || recipients.length === 0) {
      console.warn('No admin recipients found in database, using fallback')
      const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
      const notifications = adminEmails.map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email.trim(),
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
            action_url: `https://www.tiscomarket.store/admin/orders/${orderData.order_id}`
          },
          priority: 'high'
        })
      )
      return await Promise.allSettled(notifications)
    }
    
    // Send to all admin recipients from database
    const notifications = recipients.map(recipient => 
      notificationService.sendNotification({
        event: 'admin_order_created',
        recipient_email: recipient.email,
        recipient_name: recipient.name || 'Admin',
        data: {
          ...orderData,
          title: 'New Order Created',
          message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
          action_url: `https://www.tiscomarket.store/admin/orders/${orderData.order_id}`
        },
        priority: 'high'
      })
    )
    
    return await Promise.allSettled(notifications)
  } catch (error) {
    console.error('Error in notifyAdminOrderCreated:', error)
    // Final fallback
    const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
    const notifications = adminEmails.map(email => 
      notificationService.sendNotification({
        event: 'order_created',
        recipient_email: email.trim(),
        recipient_name: 'Admin',
        data: orderData,
        priority: 'high'
      })
    )
    return await Promise.allSettled(notifications)
  }
}

export async function notifyPaymentSuccess(paymentData: {
  order_id: string
  customer_email: string
  customer_name: string
  amount: string
  currency: string
  payment_method: string
  transaction_id?: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'payment_success',
    recipient_email: paymentData.customer_email,
    recipient_name: paymentData.customer_name,
    data: paymentData,
    priority: 'high',
  })
}

export async function notifyPaymentFailed(paymentData: {
  order_id: string
  customer_email: string
  customer_name?: string
  amount: string
  currency: string
  payment_method: string
  failure_reason?: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'payment_failed',
    recipient_email: paymentData.customer_email,
    recipient_name: paymentData.customer_name,
    data: paymentData,
    priority: 'urgent',
  })
}

export async function notifyBookingCreated(bookingData: {
  booking_id: string
  customer_email: string
  customer_name?: string
  service_name: string
  preferred_date: string
  preferred_time: string
  description: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'booking_created',
    recipient_email: bookingData.customer_email,
    recipient_name: bookingData.customer_name,
    data: {
      order_id: bookingData.booking_id,
      customer_name: bookingData.customer_name,
      order_date: new Date().toLocaleDateString(),
      total_amount: 'Service Booking',
      currency: '',
      items: [{
        name: bookingData.service_name,
        quantity: 1,
        price: 'TBD'
      }],
      shipping_address: `Service Date: ${bookingData.preferred_date} at ${bookingData.preferred_time}`,
      payment_method: 'Service Booking'
    },
    priority: 'medium',
  })
}

export async function notifyUserRegistered(userData: {
  email: string
  name?: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'user_registered',
    recipient_email: userData.email,
    recipient_name: userData.name,
    data: {
      customer_name: userData.name,
    },
    priority: 'low',
  })
}

export async function notifyContactMessageReceived(messageData: {
  admin_email: string
  customer_name: string
  customer_email: string
  subject: string
  message: string
  message_id: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'contact_message_received',
    recipient_email: messageData.admin_email,
    data: messageData,
    priority: 'medium',
  })
}

export async function notifyOrderStatusChanged(orderData: {
  order_id: string
  customer_email: string
  customer_name: string
  old_status: string
  new_status: string
  total_amount?: string
  currency?: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'order_status_changed',
    recipient_email: orderData.customer_email,
    recipient_name: orderData.customer_name,
    data: orderData,
    priority: 'medium',
  })
}
