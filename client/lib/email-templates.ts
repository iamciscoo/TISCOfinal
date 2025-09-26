// Email Template System for TISCOマーケット
// =====================================
// This file contains all email templates used by the platform

export type TemplateType = 
  | 'order_confirmation'
  | 'order_status_update'
  | 'payment_success'
  | 'payment_failed'
  | 'cart_abandonment'
  | 'welcome_email'
  | 'password_reset'
  | 'delivery_confirmation'
  | 'review_request'
  | 'contact_reply'
  | 'booking_confirmation'
  | 'booking_status_update'
  | 'admin_notification'

interface BaseEmailData {
  customer_name?: string
  company_name?: string
  support_email?: string
  support_phone?: string
  recipient_email?: string
}

interface OrderEmailData extends BaseEmailData {
  order_id: string
  order_date: string
  total_amount: string
  currency: string
  items: Array<{
    name: string
    quantity: number
    price: string
  }>
  shipping_address?: string
  payment_method?: string
  tracking_number?: string
  estimated_delivery?: string
}

interface PaymentEmailData extends BaseEmailData {
  order_id: string
  amount: string
  currency: string
  payment_method: string
  transaction_id?: string
  failure_reason?: string
  payment_date?: string
}

interface ContactReplyData extends BaseEmailData {
  original_message?: string
  admin_response: string
  message_id: string
}

interface BookingEmailData extends BaseEmailData {
  booking_id: string
  service_name: string
  preferred_date: string
  preferred_time: string
  description: string
  status?: string
  customer_email?: string
}

interface AdminNotificationData extends BaseEmailData {
  notification_type: string
  title: string
  message: string
  action_url?: string
  order_id?: string
  customer_email?: string
  total_amount?: string
  currency?: string
  payment_method?: string
  payment_status?: string
  items_count?: number
}

// Modern Email Template with Enhanced Compatibility
const baseTemplate = (content: string, data: BaseEmailData, previewText?: string, templateType?: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="format-detection" content="telephone=no">
    <meta name="format-detection" content="date=no">
    <meta name="format-detection" content="address=no">
    <meta name="format-detection" content="email=no">
    ${previewText ? `<meta name="description" content="${previewText}">`  : ''}
    <title>TISCO Email - ${templateType?.replace('_', ' ').toUpperCase() || 'NOTIFICATION'}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        /* Reset Styles */
        body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        
        /* Client-specific Styles */
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
        #outlook a { padding: 0; }
        .ReadMsgBody { width: 100%; }
        
        /* Modern Typography */
        .heading-1 { font-size: 28px !important; line-height: 34px !important; font-weight: 700 !important; }
        .heading-2 { font-size: 22px !important; line-height: 28px !important; font-weight: 600 !important; }
        .heading-3 { font-size: 18px !important; line-height: 24px !important; font-weight: 600 !important; }
        .text-body { font-size: 16px !important; line-height: 24px !important; }
        .text-small { font-size: 14px !important; line-height: 20px !important; }
        
        /* Button Styles */
        .btn-primary { 
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
            border-radius: 8px !important;
            display: inline-block !important;
            padding: 16px 32px !important;
            color: #ffffff !important;
            text-decoration: none !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            text-align: center !important;
            border: none !important;
            cursor: pointer !important;
        }
        .btn-secondary {
            background: #f8fafc !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 8px !important;
            display: inline-block !important;
            padding: 14px 30px !important;
            color: #374151 !important;
            text-decoration: none !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            text-align: center !important;
        }
        
        /* Mobile Responsive */
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-full { width: 100% !important; }
            .mobile-padding { padding: 16px !important; }
            .mobile-margin { margin: 16px 0 !important; }
            .heading-1 { font-size: 24px !important; line-height: 30px !important; }
            .heading-2 { font-size: 20px !important; line-height: 26px !important; }
            .btn-primary, .btn-secondary { width: 100% !important; display: block !important; }
        }
        
        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
            .dark-bg { background-color: #1f2937 !important; }
            .dark-text { color: #f9fafb !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
    <!-- Hidden preheader text -->
    ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: #f8fafc; mso-hide: all;">${previewText}</div>` : ''}
    
    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; border-radius: 16px 16px 0 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="80" style="vertical-align: middle; padding-right: 16px;">
                                        <img src="https://tiscomarket.store/circular.svg" alt="TISCO Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.2;">TISCOマーケット</h1>
                                        <p style="margin: 8px 0 0 0; font-size: 16px; color: #cbd5e1; line-height: 1.4;">${previewText || 'Premium technology solutions for Tanzania'}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 32px; background-color: #ffffff;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">TISCOマーケット</p>
                                        <p style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">Your trusted technology partner in Tanzania</p>
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 12px;">
                                                    <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 500;">info@tiscomarket.store</a>
                                                </td>
                                                <td style="padding: 0 12px; border-left: 1px solid #e2e8f0;">
                                                    <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-size: 14px; font-weight: 500;">+255 748 624 684</a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">© 2024 TISCOマーケット. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`

// Resolve base URL for links inside emails - always use production URL for email links
const appBaseUrl = 'https://www.tiscomarket.store'
// Public asset host for images inside emails (must be publicly reachable by email clients)
// Note: Using production URL ensures email assets are accessible from email clients

// Template functions for each email type
export const emailTemplates = {
  order_confirmation: (data: OrderEmailData) => {
    const previewText = `Order confirmed! We're preparing ${data.order_id} for delivery`
    const content = `
      <!-- Success Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">✓</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Order Confirmed!</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">Your order is confirmed and we're getting it ready. You'll receive updates as we prepare your tech for delivery.</p>
          </td>
        </tr>
      </table>

      <!-- Order Summary Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; margin: 32px 0; border: 1px solid #bae6fd;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: #0c4a6e;">Order Summary</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Number</td>
                <td class="text-small" style="padding: 8px 0; color: #0c4a6e; font-weight: 600; text-align: right;">#${data.order_id}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Date</td>
                <td class="text-small" style="padding: 8px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${data.order_date}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Total Amount</td>
                <td class="text-small" style="padding: 8px 0; color: #0c4a6e; font-weight: 700; text-align: right; font-size: 16px;">${data.currency} ${data.total_amount}</td>
              </tr>
              ${data.payment_method ? `
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Method</td>
                <td class="text-small" style="padding: 8px 0; color: #0c4a6e; font-weight: 600; text-align: right;">${data.payment_method}</td>
              </tr>` : ''}
              ${data.estimated_delivery ? `
              <tr>
                <td class="text-small" style="padding: 12px 0 8px 0; color: #374151; font-weight: 500; border-top: 1px solid #bae6fd;">Estimated Delivery</td>
                <td class="text-small" style="padding: 12px 0 8px 0; color: #059669; font-weight: 600; text-align: right; border-top: 1px solid #bae6fd;">${data.estimated_delivery}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Items List -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td>
            <h3 class="heading-3" style="margin: 0 0 20px 0; color: #111827;">Your Items</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
              ${data.items.map((item, index) => `
                <tr>
                  <td style="padding: 20px; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="vertical-align: top; width: 70%;">
                          <p class="text-body" style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${item.name}</p>
                          <p class="text-small" style="margin: 0; color: #6b7280;">Quantity: ${item.quantity}</p>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                          <p class="text-body" style="margin: 0; font-weight: 600; color: #111827;">${data.currency} ${item.price}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              `).join('')}
            </table>
          </td>
        </tr>
      </table>

      <!-- What's Next Section -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px;">
            <h4 class="heading-3" style="margin: 0 0 12px 0; color: #92400e;">What happens next?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li class="text-small" style="margin-bottom: 8px; line-height: 1.5;">We're preparing your order for dispatch</li>
              <li class="text-small" style="margin-bottom: 8px; line-height: 1.5;">You'll get updates via email as your order progresses</li>
              <li class="text-small" style="margin-bottom: 0; line-height: 1.5;">Our team will contact you if we need any clarification</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- CTA Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/account/orders/${data.order_id}" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">View Order Details</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="https://wa.me/255748624684" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">Contact Support</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      ${data.shipping_address ? `
      <!-- Shipping Info -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280;">
        <tr>
          <td>
            <p class="text-small" style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Delivery Address</p>
            <p class="text-small" style="margin: 0; color: #6b7280; line-height: 1.5;">${data.shipping_address}</p>
          </td>
        </tr>
      </table>` : ''}
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  order_status_update: (data: OrderEmailData & { status: string, reason?: string }) => {
    const statusConfig = {
      processing: { 
        color: '#f59e0b', 
        bgColor: '#fef3c7', 
        borderColor: '#fcd34d',
        icon: '⏳',
        title: 'Order Processing',
        message: 'We\'re preparing your order and it will be dispatched soon.'
      },
      shipped: { 
        color: '#2563eb', 
        bgColor: '#dbeafe', 
        borderColor: '#93c5fd',
        icon: '🚚',
        title: 'Order Shipped',
        message: `Great news! Your order is on its way${data.tracking_number ? `. Track with: ${data.tracking_number}` : '.'}`
      },
      delivered: { 
        color: '#059669', 
        bgColor: '#d1fae5', 
        borderColor: '#a7f3d0',
        icon: '📦',
        title: 'Order Delivered',
        message: 'Your order has been successfully delivered. Enjoy your new tech!'
      },
      cancelled: { 
        color: '#dc2626', 
        bgColor: '#fee2e2', 
        borderColor: '#fca5a5',
        icon: '❌',
        title: 'Order Cancelled',
        message: `Your order has been cancelled${data.reason ? `. Reason: ${data.reason}` : '.'}`
      }
    }
    
    const config = statusConfig[data.status as keyof typeof statusConfig] || {
      color: '#6b7280',
      bgColor: '#f3f4f6',
      borderColor: '#d1d5db',
      icon: 'ℹ️',
      title: 'Status Update',
      message: 'Your order status has been updated.'
    }
    
    const previewText = `${config.title} - Order ${data.order_id}`
    const content = `
      <!-- Status Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: ${config.color}; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">${config.icon}</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">${config.title}</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">${config.message}</p>
          </td>
        </tr>
      </table>

      <!-- Status Details Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: ${config.bgColor}; border: 1px solid ${config.borderColor}; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: ${config.color};">Order Details</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Number</td>
                <td class="text-small" style="padding: 8px 0; color: ${config.color}; font-weight: 600; text-align: right;">#${data.order_id}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Status</td>
                <td class="text-small" style="padding: 8px 0; color: ${config.color}; font-weight: 700; text-align: right; text-transform: capitalize;">${data.status.replace('_', ' ')}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Date</td>
                <td class="text-small" style="padding: 8px 0; color: ${config.color}; font-weight: 600; text-align: right;">${data.order_date}</td>
              </tr>
              ${data.tracking_number && data.status === 'shipped' ? `
              <tr>
                <td class="text-small" style="padding: 12px 0 8px 0; color: #374151; font-weight: 500; border-top: 1px solid ${config.borderColor};">Tracking Number</td>
                <td class="text-small" style="padding: 12px 0 8px 0; color: ${config.color}; font-weight: 600; text-align: right; border-top: 1px solid ${config.borderColor};"><code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.tracking_number}</code></td>
              </tr>` : ''}
              ${data.estimated_delivery && (data.status === 'shipped' || data.status === 'processing') ? `
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Estimated Delivery</td>
                <td class="text-small" style="padding: 8px 0; color: #059669; font-weight: 600; text-align: right;">${data.estimated_delivery}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Action Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/account/orders/${data.order_id}" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">View Order Details</a>
                </td>
                ${data.status === 'delivered' ? `
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/account/orders/${data.order_id}/review" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">Leave Review</a>
                </td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Additional Info for specific statuses -->
      ${data.status === 'cancelled' ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280; margin: 32px 0;">
        <tr>
          <td style="padding: 20px;">
            <p class="text-small" style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Need Help?</p>
            <p class="text-small" style="margin: 0; color: #6b7280; line-height: 1.5;">If you have questions about this cancellation or need assistance, our support team is ready to help.</p>
          </td>
        </tr>
      </table>` : ''}
    `
    return baseTemplate(content, data, previewText, 'order_status_update')
  },

  payment_success: (data: PaymentEmailData) => {
    const previewText = `Payment confirmed! Your transaction was successful`
    const content = `
      <!-- Success Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">💳</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Payment Successful!</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">Your payment has been processed successfully. Thank you for your business!</p>
          </td>
        </tr>
      </table>

      <!-- Payment Details Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: #065f46;">Payment Receipt</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Amount Paid</td>
                <td class="text-small" style="padding: 8px 0; color: #065f46; font-weight: 700; text-align: right; font-size: 18px;">${data.currency} ${data.amount}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Method</td>
                <td class="text-small" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;">${data.payment_method}</td>
              </tr>
              ${data.transaction_id ? `
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Transaction ID</td>
                <td class="text-small" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;"><code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">${data.transaction_id}</code></td>
              </tr>` : ''}
              ${data.payment_date ? `
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Date</td>
                <td class="text-small" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;">${data.payment_date}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Success Message -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; margin: 32px 0;">
        <tr>
          <td style="padding: 20px;">
            <p class="text-small" style="margin: 0; color: #1e40af; text-align: center; line-height: 1.6;">✓ Your payment has been securely processed and confirmed. You'll receive email updates as your order progresses.</p>
          </td>
        </tr>
      </table>

      <!-- Action Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                ${data.order_id ? `
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/account/orders/${data.order_id}" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">View Order Details</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/shop" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">Continue Shopping</a>
                </td>` : `
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/shop" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">Continue Shopping</a>
                </td>`}
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'payment_success')
  },

  payment_failed: (data: PaymentEmailData) => {
    const previewText = `Payment issue - Let's resolve this together`
    const content = `
      <!-- Error Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">⚠️</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Payment Issue</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">We encountered an issue processing your payment. Don't worry - we're here to help resolve this quickly.</p>
          </td>
        </tr>
      </table>

      <!-- Payment Details Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef2f2 0%, #fecaca 50%); border: 1px solid #fca5a5; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: #991b1b;">Payment Details</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Attempted Amount</td>
                <td class="text-small" style="padding: 8px 0; color: #991b1b; font-weight: 700; text-align: right; font-size: 18px;">${data.currency} ${data.amount}</td>
              </tr>
              <tr>
                <td class="text-small" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Method</td>
                <td class="text-small" style="padding: 8px 0; color: #991b1b; font-weight: 600; text-align: right;">${data.payment_method}</td>
              </tr>
              ${data.failure_reason ? `
              <tr>
                <td class="text-small" style="padding: 12px 0 8px 0; color: #374151; font-weight: 500; border-top: 1px solid #fca5a5;">Issue</td>
                <td class="text-small" style="padding: 12px 0 8px 0; color: #991b1b; font-weight: 600; text-align: right; border-top: 1px solid #fca5a5;">${data.failure_reason}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Common Solutions -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px;">
            <h3 class="heading-3" style="margin: 0 0 16px 0; color: #92400e;">Quick Solutions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li class="text-small" style="margin-bottom: 8px; line-height: 1.5;">Check your card details and try again</li>
              <li class="text-small" style="margin-bottom: 8px; line-height: 1.5;">Ensure sufficient funds are available</li>
              <li class="text-small" style="margin-bottom: 8px; line-height: 1.5;">Try a different payment method</li>
              <li class="text-small" style="margin-bottom: 0; line-height: 1.5;">Contact your bank if the issue persists</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- Action Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/checkout" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">Try Again</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="https://wa.me/255748624684" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">Get Help</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Support Note -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280; margin: 32px 0;">
        <tr>
          <td style="padding: 20px;">
            <p class="text-small" style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Need Personal Assistance?</p>
            <p class="text-small" style="margin: 0; color: #6b7280; line-height: 1.5;">Our payment support team is available to help resolve any issues. Contact us via WhatsApp or email and we'll sort this out quickly.</p>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'payment_failed')
  },

  welcome_email: (data: BaseEmailData) => {
    const previewText = `Welcome aboard! Let's get you started with quality tech`
    const content = `
      <!-- Welcome Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">🚀</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Welcome to TISCO!</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">We're excited to have you join our community. Quality tech, delivered with care to Tanzania.</p>
          </td>
        </tr>
      </table>

      <!-- What We Offer -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: #0c4a6e; text-align: center;">What Makes Us Different</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 12px 16px; vertical-align: top; width: 50%;">
                  <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">🎮</span>
                    </div>
                    <h4 class="text-body" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600;">Gaming & Electronics</h4>
                    <p class="text-small" style="margin: 0; color: #374151; line-height: 1.4;">Latest gaming gear and office electronics</p>
                  </div>
                </td>
                <td style="padding: 12px 16px; vertical-align: top; width: 50%;">
                  <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">🔧</span>
                    </div>
                    <h4 class="text-body" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600;">Professional Setup</h4>
                    <p class="text-small" style="margin: 0; color: #374151; line-height: 1.4;">Expert installation and configuration</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; vertical-align: top; width: 50%;">
                  <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">🚚</span>
                    </div>
                    <h4 class="text-body" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600;">Direct Delivery</h4>
                    <p class="text-small" style="margin: 0; color: #374151; line-height: 1.4;">Straight to your door, no complications</p>
                  </div>
                </td>
                <td style="padding: 12px 16px; vertical-align: top; width: 50%;">
                  <div style="text-align: center;">
                    <div style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">📞</span>
                    </div>
                    <h4 class="text-body" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600;">Expert Support</h4>
                    <p class="text-small" style="margin: 0; color: #374151; line-height: 1.4;">WhatsApp support when you need it</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Getting Started -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            <h3 class="heading-3" style="margin: 0 0 16px 0; color: #92400e;">Ready to get started?</h3>
            <p class="text-body" style="margin: 0 0 24px 0; color: #92400e; line-height: 1.6;">Browse our curated selection of tech products or book a consultation with our experts.</p>
            
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/shop" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">Browse Products</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/services" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center;">View Services</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Contact Info -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280; margin: 32px 0;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p class="text-small" style="margin: 0 0 12px 0; color: #374151; font-weight: 600;">Questions? We're here to help!</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 16px;">
                  <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-weight: 600; font-size: 14px;">📱 WhatsApp Support</a>
                </td>
                <td style="padding: 0 16px; border-left: 1px solid #e2e8f0;">
                  <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 14px;">✉️ Email Us</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'welcome_email')
  },

  cart_abandonment: (data: BaseEmailData & { cart_url: string }) => {
    const previewText = `Don't miss out! Your cart is waiting for you`
    const content = `
      <!-- Cart Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">🛍️</span>
            </div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Don't Miss Out!</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">You've got some great tech waiting in your cart. Complete your order and get it delivered to your door.</p>
          </td>
        </tr>
      </table>

      <!-- Benefits Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3" style="margin: 0 0 20px 0; color: #92400e; text-align: center;">Why Complete Your Order Now?</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 8px 16px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; background: #92400e; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 20px;">🔒</span>
                    </div>
                    <p class="text-small" style="margin: 0; color: #92400e; font-weight: 600;">Secure Checkout</p>
                  </div>
                </td>
                <td style="padding: 8px 16px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; background: #92400e; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 20px;">💳</span>
                    </div>
                    <p class="text-small" style="margin: 0; color: #92400e; font-weight: 600;">Multiple Payment Options</p>
                  </div>
                </td>
                <td style="padding: 8px 16px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; background: #92400e; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 20px;">⚡</span>
                    </div>
                    <p class="text-small" style="margin: 0; color: #92400e; font-weight: 600;">Fast Delivery</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Urgency Message -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 8px; margin: 32px 0;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p class="text-small" style="margin: 0; color: #1e40af; line-height: 1.6;">⏰ Items in your cart are popular and may sell out. Complete your order to secure them!</p>
          </td>
        </tr>
      </table>

      <!-- Action Buttons -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${data.cart_url || appBaseUrl + '/cart'}" class="btn-primary" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 8px; display: inline-block; padding: 18px 36px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 18px; text-align: center; border: none;">Complete Your Order</a>
                </td>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/shop" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 16px 34px; color: #374151; text-decoration: none; font-weight: 600; font-size: 18px; text-align: center;">Continue Shopping</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Support Note -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280; margin: 32px 0;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            <p class="text-small" style="margin: 0 0 8px 0; color: #374151; font-weight: 600;">Need Help Deciding?</p>
            <p class="text-small" style="margin: 0 0 12px 0; color: #6b7280; line-height: 1.5;">Our team is available on WhatsApp to answer any questions about your cart items.</p>
            <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-weight: 600; font-size: 14px;">📱 Chat with Support: +255 748 624 684</a>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'cart_abandonment')
  },


  delivery_confirmation: (data: OrderEmailData) => {
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">Order Delivered!</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">Your order ${data.order_id} has been successfully delivered.</p>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">We hope you're happy with your purchase! If you have any issues or questions, please contact us.</p>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">Would you like to share your experience? Your feedback helps us improve.</p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${appBaseUrl}/account/orders/${data.order_id}/review" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">Leave a Review</a>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data)
  },

  review_request: (data: OrderEmailData) => {
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">How Was Your Experience?</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">We hope you're enjoying your recent purchase from order ${data.order_id}.</p>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">Your opinion matters to us! Please take a moment to review the products you purchased. Your feedback helps other customers make informed decisions.</p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${appBaseUrl}/account/orders/${data.order_id}/review" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">Write a Review</a>
          </td>
        </tr>
      </table>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">Thank you for choosing TISCOマーケット!</p>
    `
    return baseTemplate(content, data)
  },

  contact_reply: (data: ContactReplyData) => {
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">Response to Your Inquiry</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">Thank you for contacting TISCOマーケット. We've responded to your inquiry.</p>
      
      ${data.original_message ? `
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Your Message:</strong></p>
          <p style="font-style: italic;">"${data.original_message}"</p>
        </div>
      ` : ''}
      
      <div style="background-color: #e6f7ff; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #91d5ff;">
        <p><strong>Our Response:</strong></p>
        <p>${data.admin_response}</p>
      </div>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">If you need further assistance, please don't hesitate to contact us again.</p>
      
      <p>WhatsApp: <strong>+255748624684</strong></p>
    `
    return baseTemplate(content, data)
  },

  password_reset: (data: BaseEmailData & { reset_link: string, expires_at?: string }) => {
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">Password Reset Request</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">We received a request to reset the password for your TISCOマーケット account.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ffeaa7;">
        <p><strong>⚠️ Security Notice:</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">To reset your password, click the button below:</p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${data.reset_link}" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">Reset Password</a>
          </td>
        </tr>
      </table>
      
      ${data.expires_at ? `<p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">This link expires at: ${data.expires_at}</p>` : ''}
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">For security reasons, this link will expire in 24 hours.</p>
    `
    return baseTemplate(content, data)
  },

  booking_confirmation: (data: BookingEmailData) => {
    const previewText = `Service booking ${data.booking_id} confirmed - We'll be in touch soon!`
    const content = `
      <!-- Success Icon -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background-color:#059669;border-radius:50%;margin:0 auto;display:flex;align-items:center;justify-content:center;">
          <span style="color:#ffffff;font-size:32px;">📅</span>
        </div>
      </div>
      
      <h2 style="margin:0 0 24px 0;color:#111827;font-size:24px;font-weight:700;text-align:center;line-height:1.3;">Service Booking Confirmed!</h2>
      <p style="margin:0 0 16px 0;color:#374151;font-size:16px;text-align:center;">Dear ${data.customer_name || 'Valued Customer'},</p>
      <p style="margin:0 0 32px 0;color:#6b7280;font-size:16px;text-align:center;line-height:1.5;">Thank you for booking our service! We've received your request and our team will contact you within 24 hours to confirm the details.</p>
      
      <!-- Booking Details Card -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);border-radius:12px;padding:24px;margin:24px 0;border:1px solid #a7f3d0;">
        <h3 style="margin:0 0 20px 0;color:#065f46;font-size:18px;font-weight:600;">Booking Details</h3>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:500;">Booking ID:</td>
            <td style="padding:8px 0;color:#065f46;font-size:14px;font-weight:600;text-align:right;">#${data.booking_id}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:500;">Service:</td>
            <td style="padding:8px 0;color:#065f46;font-size:14px;font-weight:600;text-align:right;">${data.service_name}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:500;">Preferred Date:</td>
            <td style="padding:8px 0;color:#065f46;font-size:14px;font-weight:600;text-align:right;">${data.preferred_date}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px;font-weight:500;">Preferred Time:</td>
            <td style="padding:8px 0;color:#065f46;font-size:14px;font-weight:600;text-align:right;">${data.preferred_time}</td>
          </tr>
        </table>
        
        ${data.description ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #a7f3d0;">
          <p style="margin:0 0 8px 0;color:#374151;font-size:14px;font-weight:500;">Description:</p>
          <p style="margin:0;color:#065f46;font-size:14px;line-height:1.5;">${data.description}</p>
        </div>` : ''}
      </div>
      
      <!-- Next Steps -->
      <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:32px 0;">
        <h4 style="margin:0 0 12px 0;color:#1e40af;font-size:16px;font-weight:600;">What happens next?</h4>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.6;">
          <li>Our team will review your booking request</li>
          <li>We'll contact you within 24 hours to confirm</li>
          <li>Any additional details will be discussed during confirmation</li>
        </ul>
      </div>
            <!-- Contact Information -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:24px 0;">
        <tr>
          <td style="padding:20px;">
            <h4 style="margin:0 0 16px 0;color:#374151;font-size:16px;font-weight:600;">Need to make changes or have questions?</h4>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="width:50%;vertical-align:top;">
                  <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">WhatsApp Support</p>
                  <a href="https://wa.me/255748624684" style="color:#059669;text-decoration:none;font-weight:600;">+255 748 624 684</a>
                </td>
                <td style="width:50%;vertical-align:top;">
                  <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Email Support</p>
                  <a href="mailto:info@tiscomarket.store" style="color:#2563eb;text-decoration:none;font-weight:600;">info@tiscomarket.store</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <!-- CTA Button -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background-color:#2563eb;border-radius:8px;">
                  <a href="${appBaseUrl}/account/bookings/${data.booking_id}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">View Booking Details</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  booking_status_update: (data: BookingEmailData & { status: string, admin_notes?: string }) => {
    const statusMessages = {
      confirmed: 'Your service booking has been confirmed! We look forward to serving you.',
      in_progress: 'Our team is currently working on your service request.',
      completed: 'Your service has been completed. Thank you for choosing TISCOマーケット!',
      cancelled: 'Your service booking has been cancelled.',
      rescheduled: 'Your service booking has been rescheduled.'
    }
    
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">Booking Status Update</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">Your service booking ${data.booking_id} status has been updated to: <strong>${data.status}</strong></p>
      <p style="margin:0 0 15px 0;color:#333333;">${statusMessages[data.status as keyof typeof statusMessages] || 'Your booking status has been updated.'}</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p><strong>Service:</strong> ${data.service_name}</p>
        <p><strong>Date:</strong> ${data.preferred_date}</p>
        <p><strong>Time:</strong> ${data.preferred_time}</p>
        ${data.admin_notes ? `<p><strong>Notes:</strong> ${data.admin_notes}</p>` : ''}
      </div>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">If you have any questions, please don't hesitate to contact us.</p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${appBaseUrl}/account/bookings/${data.booking_id}" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">View Booking</a>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data)
  },

  admin_notification: (data: AdminNotificationData) => {
    const previewText = data.title || 'Admin Notification from TISCOマーケット'
    
    const content = `
      <h2 style="margin:0 0 24px 0;color:#1f2937;font-size:28px;font-weight:600;line-height:1.2;">
        ${data.title || 'Admin Notification'}
      </h2>
      
      <p style="margin:0 0 20px 0;color:#374151;font-size:16px;line-height:1.6;">
        Hello Admin,
      </p>
      
      <div style="background-color:#f3f4f6;border-left:4px solid #2563eb;padding:20px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#1f2937;font-size:16px;line-height:1.6;font-weight:500;">
          ${data.message}
        </p>
      </div>

      ${data.order_id ? `
      <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 16px 0;color:#1f2937;font-size:18px;font-weight:600;">Order Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;width:30%;">Order ID:</td>
            <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.order_id}</td>
          </tr>
          ${data.customer_name ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Customer:</td>
            <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.customer_name}</td>
          </tr>` : ''}
          ${data.customer_email ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Email:</td>
            <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.customer_email}</td>
          </tr>` : ''}
          ${data.total_amount && data.currency ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount:</td>
            <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.currency} ${data.total_amount}</td>
          </tr>` : ''}
          ${data.payment_method ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:14px;">Payment:</td>
            <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:500;">${data.payment_method}</td>
          </tr>` : ''}
        </table>
      </div>` : ''}
      
      ${data.action_url ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="background-color:#2563eb;border-radius:6px;">
                  <a href="${data.action_url}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;font-family:'Segoe UI',Arial,sans-serif;">View Order Details</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>` : ''}
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:32px 0;">
        <tr>
          <td style="border-top:1px solid #e5e7eb;padding-top:20px;">
            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.5;text-align:center;">
              Questions? Contact our support team
            </p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">
              <tr>
                <td style="width:50%;vertical-align:top;">
                  <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">WhatsApp Support</p>
                  <a href="https://wa.me/255748624684" style="color:#059669;text-decoration:none;font-weight:600;">+255 748 624 684</a>
                </td>
                <td style="width:50%;vertical-align:top;">
                  <p style="margin:0 0 8px 0;color:#6b7280;font-size:14px;">Email Support</p>
                  <a href="mailto:info@tiscomarket.store" style="color:#2563eb;text-decoration:none;font-weight:600;">info@tiscomarket.store</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  }
}

// Helper function to render email templates
export async function renderEmailTemplate(
  templateType: TemplateType,
  data: Record<string, unknown>
): Promise<string> {
  // Add default values
  const defaultData = {
    company_name: 'TISCOマーケット',
    support_email: 'info@tiscmarket.store',
    support_phone: '+255748624684',
    ...data
  }
  
  // Handle each template type explicitly to satisfy TypeScript
  switch (templateType) {
    case 'order_confirmation':
      return emailTemplates.order_confirmation(defaultData as OrderEmailData)
    case 'order_status_update':
      return emailTemplates.order_status_update(defaultData as OrderEmailData & { status: string, reason?: string })
    case 'payment_success':
      return emailTemplates.payment_success(defaultData as PaymentEmailData)
    case 'payment_failed':
      return emailTemplates.payment_failed(defaultData as PaymentEmailData)
    case 'cart_abandonment':
      return emailTemplates.cart_abandonment(defaultData as BaseEmailData & { cart_url: string })
    case 'welcome_email':
      return emailTemplates.welcome_email(defaultData as BaseEmailData)
    case 'password_reset':
      return emailTemplates.password_reset(defaultData as BaseEmailData & { reset_link: string, expires_at?: string })
    
    case 'delivery_confirmation':
      return emailTemplates.delivery_confirmation(defaultData as OrderEmailData)
    case 'review_request':
      return emailTemplates.review_request(defaultData as OrderEmailData)
    case 'contact_reply':
      return emailTemplates.contact_reply(defaultData as ContactReplyData)
    case 'booking_confirmation':
      return emailTemplates.booking_confirmation(defaultData as BookingEmailData)
    case 'booking_status_update':
      return emailTemplates.booking_status_update(defaultData as BookingEmailData & { status: string, admin_notes?: string })
    case 'admin_notification':
      return emailTemplates.admin_notification(defaultData as AdminNotificationData)
    default:
      throw new Error(`Unknown email template: ${templateType}`)
  }
}

// Get default subject lines for email types
export function getDefaultSubject(templateType: TemplateType): string {
  const subjects: Record<TemplateType, string> = {
    order_confirmation: 'Order Confirmed ✓ Your tech is on the way',
    order_status_update: 'Order Update → Status Changed',
    payment_success: 'Payment Successful ✓ Transaction Complete',
    payment_failed: 'Payment Issue ⚠️ Let\'s resolve this quickly',
    cart_abandonment: 'Your cart is waiting 🛍️ Complete your order',
    welcome_email: 'Welcome to TISCO! 🚀 Let\'s get started',
    password_reset: 'Reset Your Password 🔒 Secure link inside',
    delivery_confirmation: 'Delivered! 📦 Your order has arrived',
    review_request: 'How was your experience? ⭐ Share your thoughts',
    contact_reply: 'We\'ve responded 💬 Your inquiry answered',
    booking_confirmation: 'Service Booked 📅 We\'ll be in touch soon',
    booking_status_update: 'Booking Update 🔄 Status changed',
    admin_notification: 'Admin Alert 🔔 Action may be required'
  }
  
  return subjects[templateType] || 'Message from TISCOマーケット'
}
