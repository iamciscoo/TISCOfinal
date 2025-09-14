// Email Template System for TISCO Market
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
  | 'shipping_notification'
  | 'delivery_confirmation'
  | 'review_request'
  | 'contact_reply'

interface BaseEmailData {
  customer_name?: string
  company_name?: string
  support_email?: string
  support_phone?: string
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
}

interface ContactReplyData extends BaseEmailData {
  original_message?: string
  admin_response: string
  message_id: string
}

// Base template with consistent branding
const baseTemplate = (content: string, data: BaseEmailData) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TISCO Market</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1a1a1a; color: #ffffff; padding: 20px; text-align: center; }
    .logo { font-size: 24px; font-weight: bold; }
    .content { padding: 30px; }
    .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
    .order-item { border-bottom: 1px solid #eee; padding: 10px 0; }
    .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TISCO Market</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>${data.company_name || 'TISCO Market'} - Your Trusted Online Store</p>
      <p>Founded in 2025 | Dar es Salaam, Tanzania</p>
      <p>Email: ${data.support_email || 'support@tisco.com'} | WhatsApp: ${data.support_phone || '+255748624684'}</p>
      <p>© 2025 TISCO Market. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

// Resolve base URL for links inside emails
const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')

// Template functions for each email type
export const emailTemplates = {
  order_confirmation: (data: OrderEmailData) => {
    const content = `
      <h2>Order Confirmation</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p><strong>Order Number:</strong> ${data.order_id}</p>
        <p><strong>Order Date:</strong> ${data.order_date}</p>
        <p><strong>Total Amount:</strong> ${data.currency} ${data.total_amount}</p>
        ${data.payment_method ? `<p><strong>Payment Method:</strong> ${data.payment_method}</p>` : ''}
        ${data.shipping_address ? `<p><strong>Shipping Address:</strong> ${data.shipping_address}</p>` : ''}
      </div>
      
      <h3>Order Items:</h3>
      ${data.items.map(item => `
        <div class="order-item">
          <strong>${item.name}</strong><br>
          Quantity: ${item.quantity} | Price: ${data.currency} ${item.price}
        </div>
      `).join('')}
      
      <div class="total">Total: ${data.currency} ${data.total_amount}</div>
      
      <p>We'll send you another email when your order ships.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      
      <a href="${appBaseUrl}/account/orders/${data.order_id}" class="button">View Order</a>
    `
    return baseTemplate(content, data)
  },

  order_status_update: (data: OrderEmailData & { status: string, reason?: string }) => {
    const statusMessages = {
      processing: 'Your order is being processed and will be shipped soon.',
      shipped: `Great news! Your order has been shipped.${data.tracking_number ? ` Your tracking number is: ${data.tracking_number}` : ''}`,
      delivered: 'Your order has been delivered. We hope you enjoy your purchase!',
      cancelled: `Your order has been cancelled.${data.reason ? ` Reason: ${data.reason}` : ''}`
    }
    
    const content = `
      <h2>Order Status Update</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Your order ${data.order_id} status has been updated to: <strong>${data.status}</strong></p>
      <p>${statusMessages[data.status as keyof typeof statusMessages] || 'Your order status has been updated.'}</p>
      
      ${data.tracking_number ? `
        <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p><strong>Tracking Number:</strong> ${data.tracking_number}</p>
          ${data.estimated_delivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimated_delivery}</p>` : ''}
        </div>
      ` : ''}
      
      <a href="${appBaseUrl}/account/orders/${data.order_id}" class="button">Track Order</a>
    `
    return baseTemplate(content, data)
  },

  payment_success: (data: PaymentEmailData) => {
    const content = `
      <h2>Payment Successful</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>We've successfully received your payment for order ${data.order_id}.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p><strong>Amount Paid:</strong> ${data.currency} ${data.amount}</p>
        <p><strong>Payment Method:</strong> ${data.payment_method}</p>
        ${data.transaction_id ? `<p><strong>Transaction ID:</strong> ${data.transaction_id}</p>` : ''}
      </div>
      
      <p>Your order is now being processed and will be shipped soon.</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${data.order_id}" class="button">View Order</a>
    `
    return baseTemplate(content, data)
  },

  payment_failed: (data: PaymentEmailData) => {
    const content = `
      <h2>Payment Failed</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Unfortunately, we were unable to process your payment for order ${data.order_id}.</p>
      
      ${data.failure_reason ? `
        <div style="background-color: #fef2f2; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #fecaca;">
          <p><strong>Reason:</strong> ${data.failure_reason}</p>
        </div>
      ` : ''}
      
      <p>Please try again or use a different payment method. Your items are still reserved in your cart.</p>
      
      <a href="${appBaseUrl}/checkout" class="button">Complete Payment</a>
    `
    return baseTemplate(content, data)
  },

  welcome_email: (data: BaseEmailData) => {
    const content = `
      <h2>Welcome to TISCO Market!</h2>
      <p>Dear ${data.customer_name || 'Valued Customer'},</p>
      <p>Thank you for joining TISCO Market - Tanzania's trusted online store.</p>
      
      <p>Here's what you can expect:</p>
      <ul>
        <li>✓ Wide selection of quality products</li>
        <li>✓ Secure payment options</li>
        <li>✓ Fast delivery across Tanzania</li>
        <li>✓ Dedicated customer support via WhatsApp</li>
      </ul>
      
      <p>Start shopping today and enjoy exclusive deals!</p>
      
      <a href="${appBaseUrl}/products" class="button">Shop Now</a>
      
      <p>Need help? Contact us on WhatsApp: <strong>+255748624684</strong></p>
    `
    return baseTemplate(content, data)
  },

  cart_abandonment: (data: BaseEmailData & { cart_url: string }) => {
    const content = `
      <h2>You Left Something Behind!</h2>
      <p>Hi ${data.customer_name || 'there'},</p>
      <p>We noticed you left some items in your cart. Don't miss out on these great products!</p>
      
      <p>Complete your purchase now and enjoy:</p>
      <ul>
        <li>✓ Secure checkout process</li>
        <li>✓ Multiple payment options</li>
        <li>✓ Fast delivery</li>
      </ul>
      
      <a href="${data.cart_url || appBaseUrl + '/cart'}" class="button">Complete Your Order</a>
      
      <p>Need assistance? We're here to help on WhatsApp: <strong>+255748624684</strong></p>
    `
    return baseTemplate(content, data)
  },

  shipping_notification: (data: OrderEmailData) => {
    const content = `
      <h2>Your Order Has Shipped!</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Good news! Your order ${data.order_id} is on its way.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
        ${data.tracking_number ? `<p><strong>Tracking Number:</strong> ${data.tracking_number}</p>` : ''}
        ${data.estimated_delivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimated_delivery}</p>` : ''}
        ${data.shipping_address ? `<p><strong>Shipping To:</strong> ${data.shipping_address}</p>` : ''}
      </div>
      
      <p>You can track your order status anytime.</p>
      
      <a href="${appBaseUrl}/account/orders/${data.order_id}" class="button">Track Package</a>
    `
    return baseTemplate(content, data)
  },

  delivery_confirmation: (data: OrderEmailData) => {
    const content = `
      <h2>Order Delivered!</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Your order ${data.order_id} has been successfully delivered.</p>
      
      <p>We hope you're happy with your purchase! If you have any issues or questions, please contact us.</p>
      
      <p>Would you like to share your experience? Your feedback helps us improve.</p>
      
      <a href="${appBaseUrl}/account/orders/${data.order_id}/review" class="button">Leave a Review</a>
    `
    return baseTemplate(content, data)
  },

  review_request: (data: OrderEmailData) => {
    const content = `
      <h2>How Was Your Experience?</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>We hope you're enjoying your recent purchase from order ${data.order_id}.</p>
      
      <p>Your opinion matters to us! Please take a moment to review the products you purchased. Your feedback helps other customers make informed decisions.</p>
      
      <a href="${appBaseUrl}/account/orders/${data.order_id}/review" class="button">Write a Review</a>
      
      <p>Thank you for choosing TISCO Market!</p>
    `
    return baseTemplate(content, data)
  },

  contact_reply: (data: ContactReplyData) => {
    const content = `
      <h2>Response to Your Inquiry</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>Thank you for contacting TISCO Market. We've responded to your inquiry.</p>
      
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
      
      <p>If you need further assistance, please don't hesitate to contact us again.</p>
      
      <p>WhatsApp: <strong>+255748624684</strong></p>
    `
    return baseTemplate(content, data)
  },

  password_reset: (data: BaseEmailData & { reset_link: string, expires_at?: string }) => {
    const content = `
      <h2>Password Reset Request</h2>
      <p>Dear ${data.customer_name || 'Customer'},</p>
      <p>We received a request to reset the password for your TISCO Market account.</p>
      
      <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 4px; border: 1px solid #ffeaa7;">
        <p><strong>⚠️ Security Notice:</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      
      <p>To reset your password, click the button below:</p>
      
      <a href="${data.reset_link}" class="button" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
      
      ${data.expires_at ? `<p><small>This link expires at: ${data.expires_at}</small></p>` : ''}
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666; font-size: 14px;">${data.reset_link}</p>
      
      <p>For security reasons, this link will expire in 24 hours.</p>
    `
    return baseTemplate(content, data)
  }
}

// Helper function to render email templates
export async function renderEmailTemplate(
  templateType: TemplateType,
  data: Record<string, unknown>
): Promise<string> {
  // Add default values
  const defaultData = {
    company_name: 'TISCO Market',
    support_email: 'support@tiscomarket.com',
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
    case 'shipping_notification':
      return emailTemplates.shipping_notification(defaultData as OrderEmailData)
    case 'delivery_confirmation':
      return emailTemplates.delivery_confirmation(defaultData as OrderEmailData)
    case 'review_request':
      return emailTemplates.review_request(defaultData as OrderEmailData)
    case 'contact_reply':
      return emailTemplates.contact_reply(defaultData as ContactReplyData)
    default:
      throw new Error(`Unknown email template: ${templateType}`)
  }
}

// Get default subject lines for email types
export function getDefaultSubject(templateType: TemplateType): string {
  const subjects: Record<TemplateType, string> = {
    order_confirmation: 'Order Confirmation - TISCO Market',
    order_status_update: 'Order Status Update - TISCO Market',
    payment_success: 'Payment Received - TISCO Market',
    payment_failed: 'Payment Failed - Action Required',
    cart_abandonment: 'You left items in your cart',
    welcome_email: 'Welcome to TISCO Market!',
    password_reset: 'Password Reset Request - TISCO Market',
    shipping_notification: 'Your order has shipped!',
    delivery_confirmation: 'Your order has been delivered',
    review_request: 'How was your experience?',
    contact_reply: 'Response to your inquiry - TISCO Market'
  }
  
  return subjects[templateType] || 'TISCO Market'
}
