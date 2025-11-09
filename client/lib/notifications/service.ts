import { sendEmailViaSendPulse, getSendPulseConfig, type SendPulseEmail } from './sendpulse'
import { renderEmailTemplate, getDefaultSubject, type TemplateType } from '../email-templates'
import { createClient } from '@supabase/supabase-js'
import { notificationAudit } from './audit'
import { logger } from '../logger'

// Supabase client for notifications
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    logger.error('Missing Supabase configuration for notifications', null, {
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
      let emailSentSuccessfully = false
      
      for (const channel of channels) {
        if (channel === 'email') {
          emailSentSuccessfully = await this.sendEmailNotification(notificationRecord, notificationData)
        }
        // Add other channels (SMS, push, in-app) here in the future
      }

      // CRITICAL FIX: Only mark as sent if email actually succeeded
      if (emailSentSuccessfully) {
        await this.updateNotificationStatus(notificationRecord.id, 'sent')
        logger.info('Notification marked as sent', { recordId: notificationRecord.id })
      } else {
        logger.error('Notification failed - not marking as sent', null, { recordId: notificationRecord.id })
        // Don't throw error to prevent blocking order creation, but don't mark as sent either
      }
      
      return notificationRecord.id
    } catch (error) {
      logger.error('Notification send error', error)
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
        logger.error('Template render error', error, { event: data.event })
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
        logger.debug('Created notification DB record', { recordId: record.id })
        return record
      }
      if (error) throw error
    } catch (e) {
      // Try legacy notifications table before falling back to temp
      logger.warn('Email notifications table not available, trying legacy notifications', { error: (e as Error)?.message })
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
          logger.debug('Created legacy notification DB record', { recordId: record.id })
          return record
        }
        if (legacyError) throw legacyError
      } catch (e2) {
        logger.warn('Legacy notifications table unavailable, using temp record', { error: (e2 as Error)?.message })
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
    logger.debug('Created notification temp record', { recordId: tempRecord.id })
    return tempRecord
  }

  // Send email notification with enhanced HTML rendering
  // Returns true if email was sent successfully, false otherwise
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendEmailNotification(record: NotificationRecord, _: NotificationData): Promise<boolean> {
    try {
      // Ensure we have properly rendered HTML content
      if (!record.content || record.content.trim() === '') {
        throw new Error('Email content is empty or invalid')
      }

      // Validate HTML content contains proper structure
      if (!record.content.includes('<!DOCTYPE html') || !record.content.includes('</html>')) {
        logger.warn('Email content may not be properly formatted HTML, attempting to send anyway', { recordId: record.id })
      }

      const email: SendPulseEmail = {
        to: record.recipient_email,
        subject: record.subject,
        html: record.content,
        replyTo: 'info@tiscomarket.store',
      }

      logger.notificationEvent('Sending HTML email', { email: record.recipient_email, subject: record.subject })
      
      // Try to send email with better error handling
      try {
        await sendEmailViaSendPulse(this.config, email)
        logger.notificationEvent('Email notification sent successfully', { recordId: record.id })
        await this.updateNotificationStatus(record.id, 'sent')
        
        // Notify admin recipients about this notification
        try {
          await this.notifyAdminsOfNewNotification(record)
        } catch (adminNotifyError) {
          logger.warn('Failed to notify admins of new notification', { error: adminNotifyError, recordId: record.id })
          // Don't fail the main notification if admin notification fails
        }
        
        return true // Email sent successfully
      } catch (emailError) {
        logger.error('Failed to send email notification', emailError, { recordId: record.id })
        
        // Determine if this is a temporary or permanent failure
        const isTemporary = this.isTemporaryError(emailError)
        const errorMessage = (emailError as Error).message
        
        if (isTemporary) {
          // For temporary errors, mark as failed but don't throw
          await this.updateNotificationStatus(record.id, 'failed', `Temporary error: ${errorMessage}`)
          logger.warn('Email notification failed with temporary error, will retry later', { recordId: record.id, errorMessage })
        } else {
          // For permanent errors, mark as failed and log
          await this.updateNotificationStatus(record.id, 'failed', `Permanent error: ${errorMessage}`)
          logger.error('Email notification failed with permanent error', emailError, { recordId: record.id })
        }
        
        return false // Email failed
      }
    } catch (error) {
      logger.error('Failed to process email notification', error, { recordId: record.id })
      await this.updateNotificationStatus(record.id, 'failed', (error as Error).message)
      return false // Email failed
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
        logger.debug('Skipping admin notification for admin_order_created event to prevent duplicates')
        return
      }
      
      // Skip admin notifications for order_created events since we use notifyAdminOrderCreated directly
      // This prevents duplicate admin emails - we want only the beautiful "New Order Created" emails
      if (record.event === 'order_created') {
        logger.debug('Skipping admin notification for order_created event - using direct notifyAdminOrderCreated instead')
        return
      }
      
      logger.debug('Processing admin notification for event', { event: record.event })

      // Get admin recipients from database with category filtering
      const { data: recipients, error } = await supabase
        .from('notification_recipients')
        .select('email, name, notification_categories')
        .eq('is_active', true)
      
      if (error || !recipients || recipients.length === 0) {
        logger.warn('No admin recipients found, using fallback emails', { event: record.event })
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
        logger.debug('No recipients subscribed to event categories', { event: record.event })
        return
      }

      logger.info('Sending admin notifications', { recipientCount: filteredRecipients.length, event: record.event })

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
      logger.warn('Admin notification error', { error })
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
        
        // Use the proper admin_notification template from email-templates.ts
        const { emailTemplates } = await import('@/lib/email-templates')
        const htmlContent = emailTemplates.admin_notification({
          title: eventName,
          message: message,
          priority: 'high',
          notification_type: record.event,
          customer_name: name, // Admin recipient name
          recipient_email: email,
          action_url: actionUrl,
          action_label: 'View Details',
          // Include notification metadata
          order_id: record.id, // Using notification ID as reference
          customer_email: record.recipient_email // Original customer email if available
        })
        
        const adminEmail: SendPulseEmail = {
          to: email,
          subject: `Admin Alert 🔔 Action may be required`,
          html: htmlContent,
          replyTo: 'info@tiscomarket.store',
        }

      await sendEmailViaSendPulse(this.config, adminEmail)
      logger.notificationEvent('Admin notification sent', { email, event: record.event })
      return // Success, exit retry loop
        
      } catch (error) {
        attempt++
        logger.error('Failed to send admin notification', error, { email, attempt, maxRetries })
        
        if (attempt >= maxRetries) {
          logger.error('Final failure sending admin notification', null, { email, maxRetries })
          return
        }
        
        // Wait before retry: exponential backoff with some randomization
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000)
        logger.debug('Retrying admin notification', { email, delayMs: Math.round(delay) })
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
        logger.debug('Notification status updated', { id, status })
        if (errorMessage) logger.debug('Notification error message', { id, errorMessage })
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
  // CRITICAL: Wrap entire function in try-catch to prevent blocking
  try {
    logger.info('Starting notifyAdminOrderCreated with timeout protection', { orderId: orderData.order_id })
    
    // Add timeout protection to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Admin notification timeout after 30 seconds')), 30000)
    })
    
    const notificationPromise = async () => {
      // Get admin recipients from database with category and product filtering
      const { data: recipients, error } = await supabase
        .from('notification_recipients')
        .select('email, name, notification_categories, assigned_product_ids')
        .eq('is_active', true)
    
      if (error) {
        logger.warn('Failed to fetch admin recipients, using fallback', { error })
        // Use hardcoded admin emails as fallback
        const adminEmails = [
          'francisjacob08@gmail.com',  // Primary admin
          'info@tiscomarket.store',     // Business email
          ...(process.env.ADMIN_EMAIL?.split(',') || [])
        ].filter((email, index, arr) => arr.indexOf(email) === index && email.trim()) // Remove duplicates and empty
        
        logger.info('Sending admin order notifications to fallback emails', { emails: adminEmails })
        
        // Format product list for fallback notification with HTML-safe formatting
        const productsList = orderData.items && orderData.items.length > 0
          ? orderData.items.map((item, index) => 
              `${index + 1}. ${item.name} (Qty: ${item.quantity}) - ${orderData.currency} ${item.price}`
            ).join('<br>')
          : `${orderData.items_count} item(s)`
        
        const notifications = adminEmails.map(email => 
          Promise.resolve(notificationService.sendNotification({
            event: 'admin_order_created',
            recipient_email: email,
            recipient_name: 'Admin',
            data: {
              ...orderData,
              title: 'New Order Created',
              message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}.<br><br>Order ID: ${orderData.order_id}<br>Payment: ${orderData.payment_method} - ${orderData.payment_status}<br><br><strong>Products:</strong><br>${productsList}`,
              action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
            },
            priority: 'high'
          }).catch(err => {
            logger.error('Failed to send notification', err, { email })
            return `failed-${email}`
          }))
        )
        return await Promise.allSettled(notifications)
      }
    
    if (!recipients || recipients.length === 0) {
      logger.warn('No admin recipients found in database, using fallback')
      const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
      
      // Format product list for fallback notification with HTML-safe formatting
      const productsList = orderData.items && orderData.items.length > 0
        ? orderData.items.map((item, index) => 
            `${index + 1}. ${item.name} (Qty: ${item.quantity}) - ${orderData.currency} ${item.price}`
          ).join('<br>')
        : `${orderData.items_count} item(s)`
      
      const notifications = adminEmails.filter(email => email.trim()).map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email.trim(),
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}.<br><br>Order ID: ${orderData.order_id}<br>Payment: ${orderData.payment_method} - ${orderData.payment_status}<br><br><strong>Products:</strong><br>${productsList}`,
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
    
    logger.debug('Order Product ID Extraction', {
      orderDataItems: orderData.items,
      extractedProductIds: orderProductIds,
      itemsCount: orderData.items?.length || 0
    })
    
    // Step 1: Find all recipients with product assignments that match this order
    const productSpecificRecipients = recipients.filter(recipient => {
      if (!recipient.assigned_product_ids || recipient.assigned_product_ids.length === 0) {
        logger.debug('No product assignment for recipient', { email: recipient.email })
        return false // This recipient has no product assignments
      }
      
      if (orderProductIds.length === 0) {
        logger.warn('No product IDs found in order - product filtering will be skipped')
        return false // No order items to match against
      }
      
      const hasMatchingProduct = orderProductIds.some(productId => 
        recipient.assigned_product_ids?.includes(productId)
      )
      
      logger.debug('Product matching for recipient', {
        email: recipient.email,
        recipientProducts: recipient.assigned_product_ids,
        orderProducts: orderProductIds,
        hasMatch: hasMatchingProduct
      })
      
      if (hasMatchingProduct) {
        logger.debug('Product-specific match found', { email: recipient.email, products: recipient.assigned_product_ids })
      }
      
      return hasMatchingProduct
    })
    
    // Step 2: ADDITIVE filtering strategy - combine product-specific AND general recipients
    logger.debug('Using ADDITIVE filtering strategy: product-specific + general recipients')
    
    // Find recipients who should get notifications based on categories (including "all")
    const categoryBasedRecipients = recipients.filter(recipient => {
      // Skip recipients with product assignments - they're handled separately
      if (recipient.assigned_product_ids && recipient.assigned_product_ids.length > 0) {
        logger.debug('Skipping recipient for category filtering - has product assignments', { email: recipient.email })
        return false
      }
      
      // Use category-based filtering for recipients without product assignments
      const categories = recipient.notification_categories || ['all']
      
      // If recipient has 'all' category, they get all notifications
      if (categories.includes('all')) {
        logger.debug('Including recipient - has all category', { email: recipient.email })
        return true
      }
      
      // Check if they're subscribed to order-related categories
      const orderCategories = ['order_created', 'orders', 'admin_order_created']
      const hasOrderCategory = categories.some((category: string) => orderCategories.includes(category))
      logger.debug('Order categories match check', { email: recipient.email, hasMatch: hasOrderCategory })
      return hasOrderCategory
    })
    
    // Combine product-specific recipients + category-based recipients
    const allEligibleRecipients = [
      ...productSpecificRecipients,
      ...categoryBasedRecipients
    ]
    
    // Remove duplicates by email (shouldn't happen, but defensive programming)
    const filteredRecipients = allEligibleRecipients.filter((recipient, index, array) => 
      array.findIndex(r => r.email.toLowerCase() === recipient.email.toLowerCase()) === index
    )
    
    logger.info('ADDITIVE FILTERING RESULTS', {
      productSpecificCount: productSpecificRecipients.length,
      categoryBasedCount: categoryBasedRecipients.length,
      totalUniqueCount: filteredRecipients.length,
      finalRecipients: filteredRecipients.map(r => r.email)
    })

    // Enhanced fallback with detailed logging and validation
    if (filteredRecipients.length === 0) {
      logger.warn('CRITICAL: No recipients found for order notifications', {
        totalRecipients: recipients.length,
        recipientsWithProducts: recipients.filter(r => r.assigned_product_ids && r.assigned_product_ids.length > 0).length,
        recipientsWithCategories: recipients.filter(r => !r.assigned_product_ids || r.assigned_product_ids.length === 0).length,
        orderProductIds,
        allRecipientEmails: recipients.map(r => r.email)
      })
      
      logger.warn('Using emergency fallback admin emails')
      const adminEmails = ['francisjacob08@gmail.com', 'info@tiscomarket.store']
      
      // Format product list for emergency fallback with HTML-safe formatting
      const productsList = orderData.items && orderData.items.length > 0
        ? orderData.items.map((item, index) => 
            `${index + 1}. ${item.name} (Qty: ${item.quantity}) - ${orderData.currency} ${item.price}`
          ).join('<br>')
        : `${orderData.items_count} item(s)`
      
      const notifications = adminEmails.map(email => 
        notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: email,
          recipient_name: 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created (Fallback)',
            message: `⚠️ <strong>FALLBACK NOTIFICATION:</strong> A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}.<br><br>Order ID: ${orderData.order_id}<br>Payment: ${orderData.payment_method} - ${orderData.payment_status}<br><br><strong>Products:</strong><br>${productsList}<br><br><em>Note: Product-specific recipients may not have been notified correctly.</em>`,
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
        logger.warn('Invalid email format', { email: recipient.email })
        return false
      }
      
      // Validate recipient is active (handle case where is_active might not exist)
      const isActive = (recipient as Record<string, unknown>).is_active !== false // Default to true if undefined
      if (!isActive) {
        logger.debug('Skipping inactive recipient', { email: recipient.email })
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
        logger.debug('Deduplicating recipient - keeping most recent entry', { email: recipient.email })
      }
      return unique
    }, [] as typeof validatedRecipients)

    logger.info('Sending order notifications to validated unique recipients', { count: uniqueRecipients.length })
    logger.debug('Final recipient list', { recipients: uniqueRecipients.map(r => ({ email: r.email, productCount: r.assigned_product_ids?.length || 0, categories: r.notification_categories || ['all'] })) })

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
        logger.debug('Skipping duplicate notification', { email: recipient.email })
        continue
      }

      try {
        // Format product list for notification with HTML-safe formatting
        const productsList = orderData.items && orderData.items.length > 0
          ? orderData.items.map((item, index) => 
              `${index + 1}. ${item.name} (Qty: ${item.quantity}) - ${orderData.currency} ${item.price}`
            ).join('<br>')
          : `${orderData.items_count} item(s)`

        const notificationPromise = notificationService.sendNotification({
          event: 'admin_order_created',
          recipient_email: recipient.email,
          recipient_name: recipient.name || 'Admin',
          data: {
            ...orderData,
            title: 'New Order Created',
            message: `A new order has been received from ${orderData.customer_name} (${orderData.customer_email}) for ${orderData.currency} ${orderData.total_amount}.<br><br>Order ID: ${orderData.order_id}<br>Payment: ${orderData.payment_method} - ${orderData.payment_status}<br><br><strong>Products:</strong><br>${productsList}`,
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
        logger.error('Failed to send notification to recipient', error, { email: recipient.email })
      }
    }
    
      return await Promise.allSettled(notifications)
    }
    
    // Race between notification logic and timeout
    return await Promise.race([notificationPromise(), timeoutPromise])
    
  } catch (error) {
    logger.error('Error in notifyAdminOrderCreated (with timeout protection)', error)
    
    // GUARANTEED SIMPLE FALLBACK - No complex logic, just send basic emails
    logger.warn('Using GUARANTEED simple fallback for admin notifications')
    try {
      const adminEmails = ['francisjacob08@gmail.com', 'info@tiscomarket.store']
      
      // Format product list for simple fallback with HTML-safe formatting
      const productsList = orderData.items && orderData.items.length > 0
        ? orderData.items.map((item, index) => 
            `${index + 1}. ${item.name} (Qty: ${item.quantity})`
          ).join('<br>')
        : `${orderData.items_count} item(s)`
      
      const simpleNotifications = adminEmails.map(async email => {
        try {
          return await notificationService.sendNotification({
            event: 'admin_order_created',
            recipient_email: email,
            recipient_name: 'Admin',
            data: {
              ...orderData,
              title: 'New Order Created (Simple)',
              message: `<strong>SIMPLE FALLBACK:</strong> Order ${orderData.order_id} from ${orderData.customer_name} for ${orderData.currency} ${orderData.total_amount}<br><br><strong>Products:</strong><br>${productsList}`,
              action_url: `https://admin.tiscomarket.store/orders/${orderData.order_id}`
            },
            priority: 'high'
          })
        } catch (err) {
          logger.error('Simple fallback failed', err, { email })
          return `failed-${email}`
        }
      })
      
      return await Promise.allSettled(simpleNotifications)
    } catch (finalError) {
      logger.error('CRITICAL: All notification methods failed', finalError)
      return []
    }
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
      booking_id: bookingData.booking_id, // FIXED: Was order_id, now booking_id to match template
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
    // Note: notification_recipients doesn't have a 'type' column
    const { data: recipients, error } = await supabase
      .from('notification_recipients')
      .select('email, name')
      .eq('is_active', true)
    
    if (error || !recipients || recipients.length === 0) {
      logger.warn('No admin recipients found, using fallback emails')
      // Use fallback admin emails
      const adminEmails = [
        'francisjacob08@gmail.com',
        'info@tiscomarket.store',
        ...(process.env.ADMIN_EMAIL?.split(',') || [])
      ].filter((email, index, arr) => arr.indexOf(email) === index && email.trim())
      
      for (const email of adminEmails) {
        await notificationService.sendNotification({
          event: 'admin_order_created', // Use admin_notification template
          recipient_email: email.trim(),
          recipient_name: 'Admin',
          data: {
            notification_type: 'booking_created',
            title: 'New Service Booking',
            message: `A new service booking has been received from ${bookingData.customer_name || 'a customer'} (${bookingData.contact_email}).<br><br><strong>Service:</strong> ${bookingData.service_name}<br><strong>Preferred Date:</strong> ${bookingData.preferred_date}<br><strong>Preferred Time:</strong> ${bookingData.preferred_time}<br><br><strong>Description:</strong><br>${bookingData.description || 'No description provided'}`,
            order_id: bookingData.booking_id,
            customer_name: bookingData.customer_name || 'Unknown User',
            customer_email: bookingData.contact_email,
            payment_method: 'Service Booking',
            payment_status: 'pending',
            action_url: `https://admin.tiscomarket.store/service-bookings/${bookingData.booking_id}`
          },
          priority: 'high',
        })
      }
    } else {
      // Send to database recipients
      for (const recipient of recipients) {
        await notificationService.sendNotification({
          event: 'admin_order_created', // Use admin_notification template
          recipient_email: recipient.email,
          recipient_name: recipient.name || 'Admin',
          data: {
            notification_type: 'booking_created',
            title: 'New Service Booking',
            message: `A new service booking has been received from ${bookingData.customer_name || 'a customer'} (${bookingData.contact_email}).<br><br><strong>Service:</strong> ${bookingData.service_name}<br><strong>Preferred Date:</strong> ${bookingData.preferred_date}<br><strong>Preferred Time:</strong> ${bookingData.preferred_time}<br><br><strong>Description:</strong><br>${bookingData.description || 'No description provided'}`,
            order_id: bookingData.booking_id,
            customer_name: bookingData.customer_name || 'Unknown User',
            customer_email: bookingData.contact_email,
            payment_method: 'Service Booking',
            payment_status: 'pending',
            action_url: `https://admin.tiscomarket.store/service-bookings/${bookingData.booking_id}`
          },
          priority: 'high',
        })
      }
    }
  } catch (error) {
    logger.error('Error in notifyAdminBookingCreated', error)
    // Final fallback
    const adminEmails = process.env.ADMIN_EMAIL?.split(',') || ['info@tiscomarket.store']
    for (const email of adminEmails) {
      await notificationService.sendNotification({
        event: 'admin_order_created', // Use admin_notification template
        recipient_email: email.trim(),
        recipient_name: 'Admin',
        data: {
          notification_type: 'booking_created',
          title: 'New Service Booking',
          message: `A new service booking has been received from ${bookingData.customer_name || 'a customer'} (${bookingData.contact_email}).<br><br><strong>Service:</strong> ${bookingData.service_name}<br><strong>Preferred Date:</strong> ${bookingData.preferred_date}<br><strong>Preferred Time:</strong> ${bookingData.preferred_time}<br><br><strong>Description:</strong><br>${bookingData.description || 'No description provided'}`,
          order_id: bookingData.booking_id,
          customer_name: bookingData.customer_name || 'Unknown User',
          customer_email: bookingData.contact_email,
          payment_method: 'Service Booking',
          payment_status: 'pending',
          action_url: `https://admin.tiscomarket.store/service-bookings/${bookingData.booking_id}`
        },
        priority: 'high',
      })
    }
  }
}
