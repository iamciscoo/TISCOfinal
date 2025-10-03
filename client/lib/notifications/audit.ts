import { createClient } from '@supabase/supabase-js'

// Supabase client for audit logging
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    console.error('Missing Supabase configuration for audit logging')
    throw new Error('Missing Supabase configuration for audit logging')
  }
  
  return createClient(url, serviceKey)
}

const supabase = getSupabaseClient()

export interface NotificationAuditLog {
  id?: string
  notification_key: string
  event_type: string
  recipient_email: string
  order_id?: string
  customer_email?: string
  notification_data?: Record<string, unknown>
  status: 'pending' | 'sent' | 'failed' | 'duplicate_skipped'
  error_message?: string
  created_at?: string
  sent_at?: string
}

class NotificationAuditService {
  /**
   * Generate a unique notification key for idempotency
   * Format: {event_type}_{order_id}_{recipient_email}_{timestamp?}
   */
  generateNotificationKey(
    eventType: string, 
    recipientEmail: string, 
    orderId?: string,
    includeTimestamp = false
  ): string {
    const parts = [
      eventType,
      orderId || 'no_order',
      recipientEmail.replace('@', '_at_').replace(/[^a-zA-Z0-9_]/g, '_')
    ]
    
    if (includeTimestamp) {
      parts.push(Date.now().toString())
    }
    
    return parts.join('_')
  }

  /**
   * Check if a notification has already been sent (idempotency check)
   */
  async checkDuplicate(notificationKey: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notification_audit_logs')
        .select('id, status')
        .eq('notification_key', notificationKey)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.warn('Error checking notification duplicate:', error)
        return false // Allow sending on error
      }

      if (data) {
        console.log(`Duplicate notification detected: ${notificationKey} (status: ${data.status})`)
        return true
      }

      return false
    } catch (error) {
      console.warn('Error in duplicate check:', error)
      return false // Allow sending on error
    }
  }

  /**
   * Create an audit log entry for a notification attempt
   */
  async logNotificationAttempt(auditData: Omit<NotificationAuditLog, 'id' | 'created_at'>): Promise<string | null> {
    try {
      // Check for duplicate first
      const isDuplicate = await this.checkDuplicate(auditData.notification_key)
      
      if (isDuplicate) {
        console.log(`Skipping duplicate notification: ${auditData.notification_key}`)
        // Update existing record to show it was skipped
        await supabase
          .from('notification_audit_logs')
          .update({ 
            status: 'duplicate_skipped',
            error_message: 'Notification already sent or attempted'
          })
          .eq('notification_key', auditData.notification_key)
        
        return null // Return null to indicate skipped
      }

      const { data, error } = await supabase
        .from('notification_audit_logs')
        .insert({
          notification_key: auditData.notification_key,
          event_type: auditData.event_type,
          recipient_email: auditData.recipient_email,
          order_id: auditData.order_id,
          customer_email: auditData.customer_email,
          notification_data: auditData.notification_data,
          status: auditData.status,
          error_message: auditData.error_message
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating audit log:', error)
        return null
      }

      console.log(`Created audit log: ${auditData.notification_key} (${data?.id})`)
      return data?.id || null
    } catch (error) {
      console.error('Error in audit logging:', error)
      return null
    }
  }

  /**
   * Update audit log status after notification attempt
   */
  async updateAuditStatus(
    notificationKey: string, 
    status: 'sent' | 'failed', 
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: Partial<NotificationAuditLog> = {
        status,
        error_message: errorMessage
      }

      if (status === 'sent') {
        updates.sent_at = new Date().toISOString()
      }

      await supabase
        .from('notification_audit_logs')
        .update(updates)
        .eq('notification_key', notificationKey)

      console.log(`Updated audit status: ${notificationKey} -> ${status}`)
    } catch (error) {
      console.error('Error updating audit status:', error)
    }
  }

  /**
   * Get audit logs for a specific order
   */
  async getOrderAuditLogs(orderId: string): Promise<NotificationAuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('notification_audit_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching order audit logs:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getOrderAuditLogs:', error)
      return []
    }
  }

  /**
   * Clean up old audit logs (optional maintenance function)
   */
  async cleanupOldLogs(daysOld = 90): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase
        .from('notification_audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Error cleaning up old audit logs:', error)
      } else {
        console.log(`Cleaned up audit logs older than ${daysOld} days`)
      }
    } catch (error) {
      console.error('Error in cleanup:', error)
    }
  }
}

// Export singleton instance
export const notificationAudit = new NotificationAuditService()

// Export utility functions
export const {
  generateNotificationKey,
  checkDuplicate,
  logNotificationAttempt,
  updateAuditStatus,
  getOrderAuditLogs,
  cleanupOldLogs
} = notificationAudit
