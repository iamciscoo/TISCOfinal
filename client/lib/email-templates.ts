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

// Modernized Email Template with Japanese Branding
const baseTemplate = (content: string, data: BaseEmailData, previewText?: string, templateType?: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>TISCO Email Template - ${templateType?.toUpperCase() || 'NOTIFICATION'}</title>
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
            <table role="presentation" width="100%" style="border-collapse:collapse;"><tr>
                <td style="width:64px;padding-right:12px;vertical-align:middle;text-align:left;">
                    <img src="https://tiscomarket.store/circular.svg" alt="TISCO Logo" width="64" height="64" border="0" style="display: block; width: 64px; height: 64px; margin: 0; padding: 0; border: 0 none; border-radius: 50%;">
                </td>
                <td style="vertical-align:middle;text-align:left;">
                    <h1 style="color: white; margin: 0; font-size: 2rem;">TISCOマーケット</h1>
                    <p style="color: #cbd5e1; margin: 0.5rem 0 0 0;">${previewText || 'Your trusted technology partner'}</p>
                </td>
            </tr></table>
        </div>
        <div style="padding: 2rem; background: white; margin: 1rem;">
            ${content}
        </div>
    </div>
    <div style="max-width: 600px; margin: 0 auto; text-align: center; color: #64748b; font-size: 12px; padding: 1rem;">
        TISCOマーケット | info@tiscomarket.store | +255748624684
    </div>
</body>
</html>`

// Resolve base URL for links inside emails - always use production URL for email links
const appBaseUrl = 'https://www.tiscomarket.store'
// Public asset host for images inside emails (must be publicly reachable by email clients)
// Note: Using production URL ensures email assets are accessible from email clients

// Template functions for each email type
export const emailTemplates = {
  order_confirmation: (data: OrderEmailData) => {
    const previewText = `Order Confirmation ${data.order_id} - TISCOマーケット`
    const content = `
      <h2 style="color: #1e293b; margin-bottom: 1rem;">Hi ${data.customer_name || 'Valued Customer'},</h2>
      <p style="color: #374151; line-height: 1.6;">Thank you for choosing TISCOマーケット! We've received your order and our team is preparing it for delivery. No tracking numbers, no complicated processes - just straightforward service and quality tech delivered to your door.</p>
      
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
        <h3 style="color: #1e293b; margin-bottom: 1rem;">Order Details</h3>
        <p><strong>Order ID:</strong> ${data.order_id}</p>
        <p><strong>Order Date:</strong> ${data.order_date}</p>
        <p><strong>Total Amount:</strong> ${data.currency} ${data.total_amount}</p>
        ${data.payment_method ? `<p><strong>Payment Method:</strong> ${data.payment_method}</p>` : ''}
      </div>
      
      <div style="margin: 2rem 0;">
        <h3 style="color: #1e293b; margin-bottom: 1rem;">Items Ordered</h3>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          ${data.items.map((item, index) => `
            <div style="padding: 1rem; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #e2e8f0;' : ''}">
              <strong>${item.name}</strong> × ${item.quantity} - ${data.currency} ${item.price}
            </div>
          `).join('')}
        </div>
      </div>
      
      <div style="text-align: left; margin: 2rem 0;">
        <a href="${appBaseUrl}/account/orders/${data.order_id}" style="padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">View Order Details</a>
      </div>
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  order_status_update: (data: OrderEmailData & { status: string, reason?: string }) => {
    const statusMessages = {
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: `Great news! Your order has been shipped.${data.tracking_number ? ` Tracking: ${data.tracking_number}` : ''}`,
      delivered: 'Your order has been delivered. We hope you enjoy your purchase!',
      cancelled: `Your order has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ''}`
    }
    
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">Order Status Update</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Dear ${data.customer_name || 'Valued Customer'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">Your order status has been updated:</p>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8f9fa;border-radius:4px;margin:15px 0;">
        <tr>
          <td style="padding:15px;">
            <p style="margin:0 0 8px 0;color:#333333;font-size:13px;"><strong>Order #:</strong> ${data.order_id}</p>
            <p style="margin:0 0 8px 0;color:#333333;font-size:13px;"><strong>Status:</strong> ${data.status.toUpperCase()}</p>
            <p style="margin:0;color:#333333;font-size:13px;">${statusMessages[data.status as keyof typeof statusMessages] || 'Status updated'}</p>
          </td>
        </tr>
      </table>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${appBaseUrl}/account/orders/${data.order_id}" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">View Order</a>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data)
  },

  payment_success: (data: PaymentEmailData) => {
    const previewText = `✅ Payment Successful - TISCOマーケット`
    const content = `
      <h2 style="color: #1e293b; margin-bottom: 1rem;">Hi ${data.customer_name || 'Valued Customer'},</h2>
      <p style="color: #374151; line-height: 1.6;">Great news! Your payment was successful.</p>
      
      <div style="background: #f0fdf4; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
        <h3 style="color: #1e293b; margin-bottom: 1rem;">Payment Details</h3>
        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
        <p><strong>Payment Method:</strong> ${data.payment_method}</p>
        <p><strong>Transaction ID:</strong> ${data.transaction_id}</p>
        <p><strong>Date:</strong> ${data.payment_date}</p>
      </div>
      
      ${data.order_id ? `
      <div style="text-align: left; margin: 2rem 0;">
        <a href="${appBaseUrl}/account/orders/${data.order_id}" style="padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">View Order</a>
      </div>
      ` : ''}
    `
    return baseTemplate(content, data, previewText, 'payment_success')
  },

  payment_failed: (data: PaymentEmailData) => {
    const previewText = `❌ Payment Failed - TISCOマーケット`
    const content = `
      <h2 style="color: #1e293b; margin-bottom: 1rem;">Hi ${data.customer_name || 'Valued Customer'},</h2>
      <p style="color: #374151; line-height: 1.6;">Unfortunately, your payment could not be processed. Contact Support or Please try again with a different payment method.</p>
      
      <div style="background: #fef2f2; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #1e293b; margin-bottom: 1rem;">Payment Details</h3>
        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
        <p><strong>Payment Method:</strong> ${data.payment_method}</p>
        ${data.failure_reason ? `<p><strong>Failure Reason:</strong> ${data.failure_reason}</p>` : ''}
      </div>
      
      <div style="text-align: left; margin: 2rem 0;">
        <a href="${appBaseUrl}/contact" style="padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">Contact Support</a>
      </div>
    `
    return baseTemplate(content, data, previewText, 'payment_failed')
  },

  welcome_email: (data: BaseEmailData) => {
    const previewText = `Welcome to TISCOマーケット! - We're excited to have you on board`
    const content = `
      <h2 style="color: #1e293b; margin-bottom: 1rem;">Hi ${data.customer_name || 'Valued Customer'},</h2>
      <p style="color: #374151; line-height: 1.6;">Welcome to TISCOマーケット! No BS, no fluff - just quality tech products and professional services delivered straight to your door in Tanzania.</p>
      
      <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 1.5rem; margin: 1.5rem 0;">
        <h3 style="color: #1e293b; margin-bottom: 1rem;">What We Offer:</h3>
        <ul style="color: #374151; line-height: 1.6;">
          <li>Gaming & office electronics</li>
          <li>Professional tech setup services</li>
          <li>Direct delivery - no tracking hassles</li>
          <li>Expert support when you need it</li>
        </ul>
      </div>
      
      <div style="text-align: left; margin: 2rem 0;">
        <a href="${appBaseUrl}/shop" style="padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 18px; display: inline-block; text-align: center; transition: all 0.2s; background: #2563eb; color: white; border: none;">Start Shopping</a>
      </div>
    `
    return baseTemplate(content, data, previewText, 'welcome_email')
  },

  cart_abandonment: (data: BaseEmailData & { cart_url: string }) => {
    const content = `
      <h2 style="margin:0 0 15px 0;color:#1a1a1a;font-size:20px;font-weight:bold;">You Left Something Behind!</h2>
      <p style="margin:0 0 10px 0;color:#333333;">Hi ${data.customer_name || 'there'},</p>
      <p style="margin:0 0 15px 0;color:#333333;">We noticed you left some items in your cart. Don't miss out on these great products!</p>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">Complete your purchase now and enjoy:</p>
      <ul>
        <li>✓ Secure checkout process</li>
        <li>✓ Multiple payment options</li>
        <li>✓ Fast delivery</li>
      </ul>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:15px 0;">
        <tr>
          <td style="background-color:#1a1a1a;border-radius:4px;">
            <a href="${data.cart_url || appBaseUrl + '/cart'}" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-weight:bold;font-size:13px;">Complete Your Order</a>
          </td>
        </tr>
      </table>
      
      <p style="margin:15px 0 10px 0;color:#333333;font-size:13px;">Need assistance? We're here to help on WhatsApp: <strong>+255748624684</strong></p>
    `
    return baseTemplate(content, data)
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
    order_confirmation: 'Order Confirmation - TISCOマーケット',
    order_status_update: 'Order Status Update - TISCOマーケット',
    payment_success: 'Payment Received - TISCOマーケット',
    payment_failed: 'Payment Failed - Action Required - TISCOマーケット',
    cart_abandonment: 'You left items in your cart - TISCOマーケット',
    welcome_email: 'Welcome to TISCOマーケット!',
    password_reset: 'Password Reset Request - TISCOマーケット',
    delivery_confirmation: 'Your order has been delivered - TISCOマーケット',
    review_request: 'How was your experience? - TISCOマーケット',
    contact_reply: 'Response to your inquiry - TISCOマーケット',
    booking_confirmation: 'Service Booking Confirmation - TISCOマーケット',
    booking_status_update: 'Booking Status Update - TISCOマーケット',
    admin_notification: 'Admin Notification - TISCOマーケット'
  }
  
  return subjects[templateType] || 'TISCOマーケット'
}
