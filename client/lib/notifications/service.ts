import { sendEmailViaSendPulse, getSendPulseConfig, type SendPulseEmail } from './sendpulse'
import { renderEmailTemplate, getDefaultSubject, type TemplateType } from '../email-templates'
import { createClient } from '@supabase/supabase-js'
import { notificationAudit } from './audit'

// Supabase client for notifications
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    console.error('Missing Supabase configuration for notifications:', {
      hasUrl: !!url,
      hasServiceKey: !!serviceKey
    })
    throw new Error('Missing Supabase configuration for notifications')
  }
  
  return createClient(url, serviceKey)
}

const supabase = getSupabaseClient()

// Only include notification events that are actually implemented and make logical sense
export type NotificationEvent = 
  | 'order_created'           // ✅ Used in checkout/order creation (customer notifications)
  | 'payment_success'         // ✅ Used for successful payments (customer notifications)
  | 'payment_failed'          // ✅ Used for failed payments (customer notifications)  
  | 'booking_created'         // ✅ Used for service bookings (customer notifications)
  | 'contact_message_received' // ✅ Used for contact form submissions (customer notifications)
  | 'user_registered'         // ✅ Used for welcome emails to new users (customer notifications)
  | 'admin_order_created'     // ✅ Used for admin order notifications (admin notifications)

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app'

export interface NotificationData {
  event: NotificationEvent
  recipient_email: string
  recipient_name?: string
  data?: Record<string, unknown>
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
  metadata?: Record<string, unknown>
}

class NotificationService {
  private config = getSendPulseConfig()

  // Map active notification events to email templates
  private getTemplateForEvent(event: NotificationEvent): TemplateType | null {
    const eventTemplateMap: Record<NotificationEvent, TemplateType | null> = {
      order_created: 'order_confirmation',
      payment_success: 'payment_success',
      payment_failed: 'payment_failed',
      booking_created: 'booking_confirmation',
      contact_message_received: 'admin_notification',
      user_registered: 'welcome_email',
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
        content = await renderEmailTemplate(template, data.data || {})
      } catch (error) {
        console.error('Template render error:', error)
        content = `Notification for event: ${data.event}`
      }
    }

    // Attempt DB insert first (email_notifications), fallback to temp record
    try {
      const insertPayload: Record<string, unknown> = {
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
          .insert(legacyInsert as Record<string, unknown>)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendEmailNotification(record: NotificationRecord, _: NotificationData): Promise<void> {
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
        replyTo: 'info@tiscomarket.store',
      }

      console.log(`Sending HTML email to ${record.recipient_email} with subject: ${record.subject}`)
      
      // Try to send email with better error handling
      try {
        await sendEmailViaSendPulse(this.config, email)
        console.log(`Successfully sent email notification ${record.id}`)
        await this.updateNotificationStatus(record.id, 'sent')
      } catch (emailError) {
        console.error(`Failed to send email notification ${record.id}:`, emailError)
        
        // Determine if this is a temporary or permanent failure
        const isTemporary = this.isTemporaryError(emailError)
        const errorMessage = (emailError as Error).message
        
        if (isTemporary) {
          // For temporary errors, mark as failed but don't throw
          await this.updateNotificationStatus(record.id, 'failed', `Temporary error: ${errorMessage}`)
          console.warn(`Email notification ${record.id} failed with temporary error, will retry later`)
        } else {
          // For permanent errors, mark as failed and log
          await this.updateNotificationStatus(record.id, 'failed', `Permanent error: ${errorMessage}`)
          console.error(`Email notification ${record.id} failed with permanent error:`, emailError)
        }
        
        // Don't throw the error to prevent payment flow interruption
        return
      }

      // Notify admin recipients about this notification
      try {
        await this.notifyAdminsOfNewNotification(record)
      } catch (adminNotifyError) {
        console.warn('Failed to notify admins of new notification:', adminNotifyError)
        // Don't fail the main notification if admin notification fails
      }
    } catch (error) {
      console.error(`Failed to process email notification ${record.id}:`, error)
      await this.updateNotificationStatus(record.id, 'failed', (error as Error).message)
      // Don't throw the error to prevent payment flow interruption
    }
  }

  // Check if an error is temporary (retryable) or permanent
  private isTemporaryError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase()
      const cause = (error as { cause?: { code?: string } })?.cause
      
      // Network connectivity issues (temporary)
      if (message.includes('fetch failed') || message.includes('network error')) return true
      if (message.includes('timeout') || message.includes('connect timeout')) return true
      if (message.includes('econnreset') || message.includes('enotfound')) return true
      if (message.includes('socket hang up')) return true
      
      // Undici/Node.js network errors (temporary)
      if (cause?.code === 'UND_ERR_CONNECT_TIMEOUT') return true
      if (cause?.code === 'UND_ERR_SOCKET') return true
      if (cause?.code === 'UND_ERR_REQUEST_TIMEOUT') return true
      
      // HTTP status codes
      if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) return true
      if (message.includes('429')) return true // Rate limiting
      
      // Authentication errors (permanent)
      if (message.includes('401') || message.includes('403')) return false
      if (message.includes('invalid credentials') || message.includes('unauthorized')) return false
      
      // Bad request errors (permanent)
      if (message.includes('400') || message.includes('404')) return false
    }
    
    // Default to temporary for unknown errors
    return true
  }

  // Notify admin recipients about new user notifications with category filtering
  private async notifyAdminsOfNewNotification(record: NotificationRecord): Promise<void> {
    try {
      // Skip admin notifications for admin_order_created events to prevent duplicates
      // These events ARE the admin notifications, so they shouldn't trigger additional admin emails
      if (record.event === 'admin_order_created') {
        console.log('Skipping admin notification for admin_order_created event to prevent duplicates')
        return
      }
      
      // Skip admin notifications for order_created events since we use notifyAdminOrderCreated directly
      // This prevents duplicate admin emails - we want only the beautiful "New Order Created" emails
      if (record.event === 'order_created') {
        console.log('Skipping admin notification for order_created event - using direct notifyAdminOrderCreated instead')
        return
      }
      
      console.log(`Processing admin notification for event: ${record.event}`)

      // Get admin recipients from database with category filtering
      const { data: recipients, error } = await supabase
        .from('notification_recipients')
        .select('email, name, notification_categories')
        .eq('is_active', true)
      
      if (error || !recipients || recipients.length === 0) {
        console.warn('No admin recipients found, using fallback emails for event:', record.event)
        // Use fallback admin emails only for critical events (excluding admin_order_created to prevent duplicates)
        const criticalEvents: NotificationEvent[] = ['payment_failed', 'order_created', 'user_registered']
        if (criticalEvents.includes(record.event)) {
          const adminEmails = [
            'francisjacob08@gmail.com',
            'info@tiscomarket.store',
            ...(process.env.ADMIN_EMAIL?.split(',') || [])
          ].filter((email, index, arr) => arr.indexOf(email) === index && email.trim())
          
          for (const email of adminEmails) {
            await this.sendAdminNotificationEmail(email.trim(), 'Admin', record)
          }
        }
        return
      }

      // Filter recipients based on their notification categories
      const filteredRecipients = recipients.filter(recipient => {
        const categories = recipient.notification_categories || ['all']
        
        // If recipient has 'all' category, they get all notifications
        if (categories.includes('all')) {
          return true
        }
        
        // Map active events to their corresponding categories
        const eventCategoryMap: Record<NotificationEvent, string[]> = {
          'order_created': ['order_created', 'orders'],
          'admin_order_created': ['order_created', 'orders', 'admin_order_created'],
          'payment_success': ['payment_success', 'payments'],
          'payment_failed': ['payment_failed', 'payments'],
          'booking_created': ['booking_created', 'bookings'],
          'contact_message_received': ['contact_message_received', 'contact'],
          'user_registered': ['user_registered', 'users'],
        }
        
        const eventCategories = eventCategoryMap[record.event] || [record.event]
        
        // Check if recipient's categories intersect with event categories
        return categories.some((category: string) => eventCategories.includes(category))
      })

      if (filteredRecipients.length === 0) {
        console.log(`No recipients subscribed to event '${record.event}' categories`)
        return
      }

      console.log(`Sending admin notifications to ${filteredRecipients.length} recipients for event: ${record.event}`)

      // Send to filtered recipients with delay between sends
      for (let i = 0; i < filteredRecipients.length; i++) {
        const recipient = filteredRecipients[i]
        await this.sendAdminNotificationEmail(recipient.email, recipient.name || 'Admin', record)
        
        // Add delay between emails to avoid API rate limits (except for last email)
        if (i < filteredRecipients.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay
        }
      }
    } catch (error) {
      console.warn('Admin notification error:', error)
    }
  }

  // Send individual admin notification email with retry logic
  private async sendAdminNotificationEmail(email: string, name: string, record: NotificationRecord): Promise<void> {
    const maxRetries = 3
    let attempt = 0
    
    while (attempt < maxRetries) {
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
                <a href="https://admin.tiscomarket.store" style="color: #2563eb; text-decoration: none;">Admin Panel</a>
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
      return // Success, exit retry loop
        
      } catch (error) {
        attempt++
        console.error(`Failed to send admin notification to ${email} (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt >= maxRetries) {
          console.error(`Final failure sending admin notification to ${email} after ${maxRetries} attempts`)
          return
        }
        
        // Wait before retry: exponential backoff with some randomization
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000)
        console.log(`Retrying admin notification to ${email} in ${Math.round(delay)}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Get priority level for admin notifications based on event type
  private getAdminNotificationPriority(event: NotificationEvent): 'low' | 'medium' | 'high' | 'urgent' {
    const urgentEvents: NotificationEvent[] = ['payment_failed']
    const highPriorityEvents: NotificationEvent[] = ['payment_failed', 'admin_order_created']
    
    if (urgentEvents.includes(event)) return 'urgent'
    if (highPriorityEvents.includes(event)) return 'high'
    return 'medium'
  }

  // Get human-readable event name
  private getEventDisplayName(event: NotificationEvent): string {
    const eventNames: Record<NotificationEvent, string> = {
      order_created: 'Order Created',
      payment_success: 'Payment Success',
      payment_failed: 'Payment Failed',
      booking_created: 'Booking Created',
      contact_message_received: 'Contact Message Received',
      user_registered: 'User Registered',
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
    } else if (record.event === 'user_registered') {
      message += '\n\n👤 NEW USER REGISTRATION:'
      message += '\n• Welcome new customer to TISCO platform'
      message += '\n• Monitor user engagement and first purchase'
      message += '\n• Consider sending personalized product recommendations'
      message += '\n• Add to newsletter and marketing campaigns'
    }
    
    return message
  }

  // Get action URL for admin notifications (if applicable)
  private getActionUrl(record: NotificationRecord): string | undefined {
    // Production admin panel URLs
    const adminBaseUrl = 'https://admin.tiscomarket.store'
    
    if (record.event === 'order_created' || record.event === 'admin_order_created') {
      return `${adminBaseUrl}/orders` // Admin orders page
    } else if (record.event === 'contact_message_received') {
      return `${adminBaseUrl}/messages` // Admin messages page
    } else if (record.event === 'payment_failed') {
      return `${adminBaseUrl}/orders?status=payment_failed` // Failed payments
    } else if (record.event === 'booking_created') {
      return `${adminBaseUrl}/service-bookings` // Admin bookings page
    } else if (record.event === 'user_registered') {
      return `${adminBaseUrl}/users` // Admin users page
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
      const updates: Record<string, unknown> = {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_: unknown) {
      // Try legacy notifications table
      try {
        const updatesLegacy: Record<string, unknown> = {
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

    data.forEach((notification: Record<string, unknown>) => {
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
  items?: Array<{ product_id?: string; name: string; quantity: number; price: string }> // Add items for product filtering
}) {
  try {
    // Get admin recipients from database with category and product filtering
    const { data: recipients, error } = await supabase
      .from('notification_recipients')
      .select('email, name, notification_categories, assigned_product_ids')
      .eq('is_active', true)
    
    if (error) {
      console.warn('Failed to fetch admin recipients, using fallback:', error)
      // Use hardcoded admin emails as fallback
      const adminEmails = [
        'francisjacob08@gmail.com',  // Primary admin
        'info@tiscomarket.store',     // Business email
        ...(process.env.ADMIN_EMAIL?.split(',') || [])
      ].filter((email, index, arr) => arr.indexOf(email) === index && email.trim()) // Remove duplicates and empty
      
      console.log('Sending admin order notifications to fallback emails:', adminEmails)
      const notifications = adminEmails.map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email,
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
            action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
          },
          priority: 'high'
        })
      )
      return await Promise.allSettled(notifications)
    }
    
    if (!recipients || recipients.length === 0) {
      console.warn('No admin recipients found in database, using fallback')
      const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
      const notifications = adminEmails.filter(email => email.trim()).map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email.trim(),
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
            action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
          },
          priority: 'high'
        })
      )
      return await Promise.allSettled(notifications)
    }
    
    // ENHANCED FIX: Product-specific filtering logic with comprehensive validation
    // If ANY recipients have product assignments that match this order, 
    // ONLY notify those recipients (exclusive filtering)
    
    // Enhanced product ID extraction with multiple fallback strategies
    const orderProductIds = [
      // Strategy 1: Direct product_id from items
      ...(orderData.items?.map(item => item.product_id).filter(Boolean) || []),
      // Strategy 2: Fallback to productId field (backward compatibility)
      ...(orderData.items?.map(item => (item as Record<string, unknown>).productId).filter(Boolean) || []),
      // Strategy 3: Extract from any nested product object
      ...(orderData.items?.map(item => {
        const product = (item as Record<string, unknown>).product as Record<string, unknown> | undefined
        return product?.id
      }).filter(Boolean) || [])
    ].filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
    
    console.log('🔍 DEBUG: Order Product ID Extraction:', {
      orderData_items: orderData.items,
      extracted_product_ids: orderProductIds,
      items_count: orderData.items?.length || 0
    })
    
    // Step 1: Find all recipients with product assignments that match this order
    const productSpecificRecipients = recipients.filter(recipient => {
      if (!recipient.assigned_product_ids || recipient.assigned_product_ids.length === 0) {
        console.log(`⚪ No product assignment for ${recipient.email}`)
        return false // This recipient has no product assignments
      }
      
      if (orderProductIds.length === 0) {
        console.log('⚠️  No product IDs found in order - product filtering will be skipped')
        return false // No order items to match against
      }
      
      const hasMatchingProduct = orderProductIds.some(productId => 
        recipient.assigned_product_ids?.includes(productId)
      )
      
      console.log(`🔍 Product matching for ${recipient.email}:`, {
        recipient_products: recipient.assigned_product_ids,
        order_products: orderProductIds,
        has_match: hasMatchingProduct
      })
      
      if (hasMatchingProduct) {
        console.log(`✅ Product-specific match: ${recipient.email} assigned to products [${recipient.assigned_product_ids.join(', ')}]`)
      }
      
      return hasMatchingProduct
    })
    
    let filteredRecipients = []
    
    // Step 2: Enhanced filtering strategy with detailed logging
    if (productSpecificRecipients.length > 0) {
      // EXCLUSIVE: Only notify product-specific recipients
      console.log(`🎯 Using EXCLUSIVE product filtering: ${productSpecificRecipients.length} recipients with matching products`)
      console.log(`📦 Order products: [${orderProductIds.join(', ')}]`)
      console.log('📋 Product-specific recipients:', productSpecificRecipients.map(r => `${r.email} (products: [${r.assigned_product_ids?.join(', ')}])`))
      filteredRecipients = productSpecificRecipients
    } else {
      // FALLBACK: No product matches, use category-based filtering  
      console.log('📂 No product-specific matches, falling back to category-based recipients')
      console.log('🔍 Available recipients for category filtering:', recipients.map(r => `${r.email} (products: ${r.assigned_product_ids?.length || 0}, categories: [${r.notification_categories?.join(', ') || 'none'}])`))
      
      filteredRecipients = recipients.filter(recipient => {
        // Skip recipients with product assignments (they already didn't match)
        if (recipient.assigned_product_ids && recipient.assigned_product_ids.length > 0) {
          console.log(`⏭️  Skipping ${recipient.email} - has product assignments but no match`)
          return false
        }
        
        // Use category-based filtering for recipients without product assignments
        const categories = recipient.notification_categories || ['all']
        
        // If recipient has 'all' category, they get all notifications
        if (categories.includes('all')) {
          console.log(`✅ Including ${recipient.email} - has 'all' category`)
          return true
        }
        
        // Check if they're subscribed to order-related categories
        const orderCategories = ['order_created', 'orders', 'admin_order_created']
        const hasOrderCategory = categories.some((category: string) => orderCategories.includes(category))
        console.log(`${hasOrderCategory ? '✅' : '❌'} ${recipient.email} - order categories match: ${hasOrderCategory}`)
        return hasOrderCategory
      })
      
      console.log('📋 Category-based recipients selected:', filteredRecipients.map(r => r.email))
    }

    // Enhanced fallback with detailed logging and validation
    if (filteredRecipients.length === 0) {
      console.warn('⚠️  CRITICAL: No recipients found for order notifications!')
      console.warn('🔍 DEBUG INFO:', {
        total_recipients: recipients.length,
        recipients_with_products: recipients.filter(r => r.assigned_product_ids && r.assigned_product_ids.length > 0).length,
        recipients_with_categories: recipients.filter(r => !r.assigned_product_ids || r.assigned_product_ids.length === 0).length,
        order_product_ids: orderProductIds,
        all_recipient_emails: recipients.map(r => r.email)
      })
      
      console.warn('🚨 Using emergency fallback admin emails')
      const adminEmails = ['francisjacob08@gmail.com', 'info@tiscomarket.store']
      const notifications = adminEmails.map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email,
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created (Fallback)',
            message: `⚠️ FALLBACK NOTIFICATION: A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}. Note: Product-specific recipients may not have been notified correctly.`,
            action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
          },
          priority: 'high'
        })
      )
      return await Promise.allSettled(notifications)
    }

    // Enhanced recipient validation and deduplication
    const validatedRecipients = filteredRecipients.filter(recipient => {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(recipient.email)) {
        console.warn(`❌ Invalid email format: ${recipient.email}`)
        return false
      }
      
      // Validate recipient is active (handle case where is_active might not exist)
      const isActive = (recipient as Record<string, unknown>).is_active !== false // Default to true if undefined
      if (!isActive) {
        console.log(`⏭️  Skipping inactive recipient: ${recipient.email}`)
        return false
      }
      
      return true
    })

    // Deduplicate by email (handle case where same email might be in database multiple times)
    const uniqueRecipients = validatedRecipients.reduce((unique, recipient) => {
      const existingIndex = unique.findIndex(r => r.email.toLowerCase() === recipient.email.toLowerCase())
      if (existingIndex === -1) {
        unique.push(recipient)
      } else {
        // Keep the most recent entry (assuming they're sorted by created_at desc)
        console.log(`🔄 Deduplicating ${recipient.email} - keeping most recent entry`)
      }
      return unique
    }, [] as typeof validatedRecipients)

    console.log(`📧 Sending order notifications to ${uniqueRecipients.length} validated unique recipients`)
    console.log('📋 Final recipient list:', uniqueRecipients.map(r => `${r.email} (${r.assigned_product_ids?.length || 0} products, categories: [${r.notification_categories?.join(', ') || 'all'}])`))

    // Send to filtered recipients from database with audit logging and idempotency
    const notifications = []
    for (const recipient of uniqueRecipients) {
      // Generate unique notification key for idempotency
      const notificationKey = notificationAudit.generateNotificationKey(
        'admin_order_created',
        recipient.email,
        orderData.order_id
      )

      // Create audit log entry (will skip if duplicate)
      const auditLogId = await notificationAudit.logNotificationAttempt({
        notification_key: notificationKey,
        event_type: 'admin_order_created',
        recipient_email: recipient.email,
        order_id: orderData.order_id,
        customer_email: orderData.customer_email,
        notification_data: {
          ...orderData,
          recipient_name: recipient.name || 'Admin'
        },
        status: 'pending'
      })

      // Skip if duplicate detected
      if (!auditLogId) {
        console.log(`Skipping duplicate notification for ${recipient.email}`)
        continue
      }

      try {
        const notificationPromise = notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: recipient.email,
          recipient_name: recipient.name || 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}. Order ID: ${orderData.order_id}`,
            action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
          },
          priority: 'high'
        })

        // Update audit log on success/failure
        notificationPromise
          .then(() => notificationAudit.updateAuditStatus(notificationKey, 'sent'))
          .catch((error) => notificationAudit.updateAuditStatus(notificationKey, 'failed', error.message))

        notifications.push(notificationPromise)
      } catch (error) {
        await notificationAudit.updateAuditStatus(notificationKey, 'failed', (error as Error).message)
        console.error(`Failed to send notification to ${recipient.email}:`, error)
      }
    }
    
    return await Promise.allSettled(notifications)
  } catch (error) {
    console.error('Error in notifyAdminOrderCreated:', error)
    // Final fallback
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
          action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
        },
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
  contact_email: string
  customer_name: string
  service_name: string
  preferred_date: string
  preferred_time: string
  description: string
  service_type?: string
}): Promise<string> {
  return notificationService.sendNotification({
    event: 'booking_created',
    recipient_email: bookingData.contact_email,
    recipient_name: bookingData.customer_name,
    data: {
      order_id: bookingData.booking_id,
      customer_name: bookingData.customer_name,
      customer_email: bookingData.contact_email,
      service_name: bookingData.service_name,
      service_type: bookingData.service_type || 'standard',
      preferred_date: bookingData.preferred_date,
      preferred_time: bookingData.preferred_time,
      description: bookingData.description,
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

export async function notifyAdminBookingCreated(bookingData: {
  booking_id: string
  contact_email: string
  customer_name: string
  service_name: string
  preferred_date: string
  preferred_time: string
  description: string
  service_type?: string
}): Promise<void> {
  try {
    // Try to fetch admin recipients from database
    const { data: recipients, error } = await supabase
      .from('notification_recipients')
      .select('email, name')
      .eq('type', 'admin')
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
        await notificationService.sendNotification({
          event: 'booking_created',
          recipient_email: email.trim(),
          data: {
            order_id: bookingData.booking_id,
            customer_name: bookingData.customer_name || 'Unknown User',
            customer_email: bookingData.contact_email,
            service_name: bookingData.service_name,
            preferred_date: bookingData.preferred_date,
            preferred_time: bookingData.preferred_time,
            description: bookingData.description,
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
          priority: 'high',
        })
      }
    } else {
      // Send to database recipients
      for (const recipient of recipients) {
        await notificationService.sendNotification({
          event: 'booking_created',
          recipient_email: recipient.email,
          data: {
            order_id: bookingData.booking_id,
            customer_name: bookingData.customer_name || 'Unknown User',
            customer_email: bookingData.contact_email,
            service_name: bookingData.service_name,
            preferred_date: bookingData.preferred_date,
            preferred_time: bookingData.preferred_time,
            description: bookingData.description,
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
          priority: 'high',
        })
      }
    }
  } catch (error) {
    console.error('Error in notifyAdminBookingCreated:', error)
    // Final fallback
    const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
    for (const email of adminEmails) {
      await notificationService.sendNotification({
        event: 'booking_created',
        recipient_email: email.trim(),
        data: {
          order_id: bookingData.booking_id,
          customer_name: bookingData.customer_name || 'Unknown User',
          customer_email: bookingData.contact_email,
          service_name: bookingData.service_name,
          preferred_date: bookingData.preferred_date,
          preferred_time: bookingData.preferred_time,
          description: bookingData.description,
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
        priority: 'high',
      })
    }
  }
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
  // Use order_created event for status updates since order_status_changed was removed
  return notificationService.sendNotification({
    event: 'order_created',
    recipient_email: orderData.customer_email,
    recipient_name: orderData.customer_name,
    data: {
      ...orderData,
      order_status_update: true, // Flag to indicate this is a status update
    },
    priority: 'medium',
  })
}
