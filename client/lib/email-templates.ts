// Email Template System for TISCOマーケット
// =====================================
// This file contains all email templates used by the platform

export type TemplateType = 
  | 'order_confirmation'
  | 'payment_success'
  | 'payment_failed'
  | 'welcome_email'
  | 'booking_confirmation'
  | 'admin_notification'
  | 'manual_notification'

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
  order_items?: Array<{
    name: string
    quantity: number
    price: string
  }>
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
  action_label?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  order_id?: string
  customer_email?: string
  total_amount?: string
  currency?: string
  payment_method?: string
  payment_status?: string
  items_count?: number
}

interface ManualNotificationData extends BaseEmailData {
  title: string
  message: string
  action_url?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  notification_type?: string
  template_style?: 'default' | 'professional' | 'modern' | 'minimal'
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
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light only">
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
            background: #2563eb !important;
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
            .mobile-full { width: 100% !important; display: block !important; margin: 8px 0 !important; }
            .mobile-padding { padding: 16px !important; }
            .mobile-margin { margin: 16px 0 !important; }
            .heading-1 { font-size: 24px !important; line-height: 30px !important; }
            .heading-2 { font-size: 20px !important; line-height: 26px !important; }
            .btn-primary, .btn-secondary { 
                width: 100% !important; 
                display: block !important; 
                margin: 8px 0 !important; 
                padding: 16px 24px !important; 
                text-align: center !important; 
            }
        }
        
        /* DISABLE Dark Mode Completely - Force Light Mode Always */
        @media (prefers-color-scheme: dark) {
            /* Force everything to light mode - Gmail iPhone fix */
            * { 
                background-color: inherit !important;
                color: inherit !important;
            }
            
            body { 
                background-color: #f8fafc !important; 
                color: #111827 !important;
            }
            
            .email-body { background-color: #f8fafc !important; }
            .email-container { background-color: #ffffff !important; }
            table, td, th, div, p, span { background-color: transparent !important; }

            /* Keep header dark with white text */
            [style*="#0f172a"] {
                background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%) !important;
            }
            [style*="#0f172a"] * {
                color: #ffffff !important;
            }

            /* Gmail iOS/Android specific wrappers - enforce readable light theme */
            u + .body { background-color: #f8fafc !important; }
            [data-ogsc], [data-ogsb] { background-color: #f8fafc !important; }
            [data-ogsc] .email-container, [data-ogsb] .email-container { background-color: #ffffff !important; }
            [data-ogsc] .footer-bg, [data-ogsb] .footer-bg { background: #ffffff !important; border-top-color: #e5e7eb !important; }
            [data-ogsc] .card-bg, [data-ogsb] .card-bg { background-color: #ffffff !important; border-color: #e5e7eb !important; }
            [data-ogsc] .card-bg-light, [data-ogsb] .card-bg-light { background-color: #f9fafb !important; border-color: #e5e7eb !important; }
            [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3, [data-ogsc] p, [data-ogsc] td, [data-ogsc] li, [data-ogsc] .text-body, [data-ogsc] .dark-text { color: #111827 !important; }
            [data-ogsc] .dark-text-secondary, [data-ogsb] .dark-text-secondary { color: #374151 !important; }
            [data-ogsc] a, [data-ogsb] a { color: #2563eb !important; }

            /* Neutralize gradient panels that Gmail dims in dark mode */
            [data-ogsc] table[style*="linear-gradient"],
            [data-ogsc] td[style*="linear-gradient"],
            [data-ogsb] table[style*="linear-gradient"],
            [data-ogsb] td[style*="linear-gradient"] {
                background: #ffffff !important;
                background-image: none !important;
            }
            /* Specific light tints used in our cards */
            [data-ogsc] [style*="#ecfdf5"], [data-ogsb] [style*="#ecfdf5"],
            [data-ogsc] [style*="#d1fae5"], [data-ogsb] [style*="#d1fae5"],
            [data-ogsc] [style*="#f0f9ff"], [data-ogsb] [style*="#f0f9ff"],
            [data-ogsc] [style*="#e0f2fe"], [data-ogsb] [style*="#e0f2fe"],
            [data-ogsc] [style*="#bfdbfe"], [data-ogsb] [style*="#bfdbfe"],
            [data-ogsc] [style*="#fef3c7"], [data-ogsb] [style*="#fef3c7"],
            [data-ogsc] [style*="#fcd34d"], [data-ogsb] [style*="#fcd34d"],
            [data-ogsc] [style*="#f1f5f9"], [data-ogsb] [style*="#f1f5f9"],
            [data-ogsc] [style*="#f8fafc"], [data-ogsb] [style*="#f8fafc"] {
                background-color: #ffffff !important;
                color: #111827 !important;
            }

            /* Header hero fix: force solid dark background + white text in Gmail dark mode */
            .header-hero { background: #0f172a !important; background-image: none !important; }
            .header-hero h1, .header-hero p, .header-hero div, .header-hero span { color: #ffffff !important; }
            .logo-disc { background: rgba(255,255,255,0.14) !important; }

            [data-ogsc] .header-hero, [data-ogsb] .header-hero { background: #0f172a !important; background-image: none !important; }
            [data-ogsc] .header-hero *, [data-ogsb] .header-hero * { color: #ffffff !important; }
            [data-ogsc] .logo-disc, [data-ogsb] .logo-disc { background: rgba(255,255,255,0.14) !important; }
        }
    </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
    <!-- Hidden preheader text -->
    ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; color: #f8fafc; mso-hide: all;">${previewText}</div>` : ''}
    
    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-body" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 20px 10px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td class="header-hero" bgcolor="#0f172a" style="background-color: #0f172a; padding: 40px 32px; position: relative; overflow: hidden;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="100" style="vertical-align: middle; padding-right: 20px;">
                                        <!-- Modern Futuristic Logo -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="logo-disc" style="width: 80px; height: 80px; background: rgba(255,255,255,0.14); border-radius: 50%; margin: 0;">
                                          <tr>
                                            <td style="vertical-align: middle; text-align: center; padding: 18px 5px;">
                                              <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-weight: 900; color: #ffffff; font-size: 14px; line-height: 16px; margin: 0; padding: 0; letter-spacing: 0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">TISCO</div>
                                              <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-weight: 600; color: #e2e8f0; font-size: 9px; line-height: 11px; margin: 2px 0 0 0; padding: 0; letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.3); white-space: nowrap;">マーケット</div>
                                            </td>
                                          </tr>
                                        </table>
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 28px; font-weight: 800; color: #ffffff; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.3); letter-spacing: 0.5px;">TISCOマーケット</h1>
                                        <p style="margin: 8px 0 0 0; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 14px; color: #cbd5e1; line-height: 1.5; font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Your Trusted Online Marketplace • Tech • Rare Finds • Services • Unique Items • Delivered Across Tanzania</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td class="content-area" style="padding: 40px 32px; background-color: #ffffff;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td class="footer-bg" style="padding: 40px 32px; background: #ffffff; border-top: 1px solid rgba(226, 232, 240, 0.8);">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p class="dark-text" style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #374151;">TISCOマーケット</p>
                                        <p class="dark-text-secondary" style="margin: 0 0 16px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">Your Trusted Online Marketplace • Tech • Rare Finds • Services • Unique Items • Delivered Across Tanzania</p>
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
                                        <p class="dark-text-muted" style="margin: 16px 0 0 0; font-size: 12px; color: #9ca3af;">© 2024 TISCOマーケット. All rights reserved.</p>
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
const appBaseUrl = 'https://tiscomarket.store'
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
            <!-- Icon centered using table for better email client support -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center" valign="middle" style="width: 72px; height: 72px; background: #059669; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ffffff; font-size: 36px; line-height: 72px; display: inline-block;">✓</span>
                </td>
              </tr>
            </table>
            <div style="height: 24px;"></div>
            <h1 class="heading-1 dark-text" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Order Confirmed!</h1>
            <p class="text-body dark-text" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body dark-text-secondary" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">Your order is confirmed and we're getting it ready. You'll receive updates as we prepare your tech for delivery.</p>
          </td>
        </tr>
      </table>

      <!-- Order Summary Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border-radius: 12px; margin: 32px 0; border: 1px solid #e5e7eb;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #0c4a6e; font-weight: 700;">Order Summary</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Number</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #0c4a6e; font-weight: 700; text-align: right;">#${data.order_id}</td>
              </tr>
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Date</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #0c4a6e; font-weight: 700; text-align: right;">${data.order_date}</td>
              </tr>
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Total Amount</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #0c4a6e; font-weight: 700; text-align: right; font-size: 18px;">${data.currency} ${data.total_amount}</td>
              </tr>
              ${data.payment_method ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Method</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #0c4a6e; font-weight: 700; text-align: right;">${data.payment_method}</td>
              </tr>` : ''}
              ${data.estimated_delivery ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0 8px 0; color: #374151; font-weight: 500; border-top: 1px solid #bae6fd;">Estimated Delivery</td>
                <td class="text-small dark-text" style="padding: 12px 0 8px 0; color: #059669; font-weight: 700; text-align: right; border-top: 1px solid #bae6fd;">${data.estimated_delivery}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <!-- Items List -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td>
            <h3 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #111827;">Your Items</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
              ${data.items.map((item, index) => `
                <tr>
                  <td style="padding: 20px; ${index < data.items.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="vertical-align: top; width: 70%;">
                          <p class="text-body dark-text" style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${item.name}</p>
                          <p class="text-small dark-text-secondary" style="margin: 0; color: #6b7280;">Quantity: ${item.quantity}</p>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                          <p class="text-body dark-text" style="margin: 0; font-weight: 600; color: #111827;">${data.currency} ${item.price}</p>
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
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg-light" style="background: #ffffff; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px;">
            <h4 class="heading-3 dark-text" style="margin: 0 0 12px 0; color: #92400e; font-weight: 700;">What happens next?</h4>
            <ul style="margin: 0; padding-left: 20px;">
              <li class="text-small dark-text-secondary" style="margin-bottom: 8px; line-height: 1.6; color: #92400e; font-weight: 500;">We're preparing your order for dispatch</li>
              <li class="text-small dark-text-secondary" style="margin-bottom: 8px; line-height: 1.6; color: #92400e; font-weight: 500;">You'll get updates via email as your order progresses</li>
              <li class="text-small dark-text-secondary" style="margin-bottom: 0; line-height: 1.6; color: #92400e; font-weight: 500;">Our team will contact you if we need any clarification</li>
            </ul>
          </td>
        </tr>
      </table>

      <!-- CTA Buttons - Stacked for Mobile -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center" style="padding: 0 20px 12px 20px;">
            <a href="${appBaseUrl}/account/orders/${data.order_id}" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none; min-width: 200px; max-width: 90%;">View Order Details</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0 20px;">
            <a href="https://wa.me/255748624684" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151 !important; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; max-width: 90%;">Contact Support</a>
          </td>
        </tr>
      </table>

      ${data.shipping_address ? `
      <!-- Shipping Info -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg-light" style="margin: 32px 0; background: #f9fafb; border-radius: 8px; border-left: 4px solid #6b7280;">
        <tr>
          <td style="padding: 20px;">
            <p class="text-small dark-text" style="margin: 0 0 8px 0; color: #374151; font-weight: 700;">Delivery Address</p>
            <p class="text-small dark-text-secondary" style="margin: 0; color: #6b7280; line-height: 1.6; font-weight: 500;">${data.shipping_address}</p>
          </td>
        </tr>
      </table>` : ''}
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  payment_success: (data: PaymentEmailData) => {
    const previewText = `Payment confirmed! Your transaction was successful`
    const content = `
      <!-- Success Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <!-- Icon centered using table for better email client support -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center" valign="middle" style="width: 72px; height: 72px; background: #059669; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ffffff; font-size: 36px; line-height: 72px; display: inline-block;">💳</span>
                </td>
              </tr>
            </table>
            <div style="height: 24px;"></div>
            <h1 class="heading-1 dark-text" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Payment Successful!</h1>
            <p class="text-body dark-text" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body dark-text-secondary" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">Your payment has been processed successfully. Thank you for your business!</p>
          </td>
        </tr>
      </table>

      <!-- Payment Details Card (solid white for readability) -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border: 1px solid #a7f3d0; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #065f46;">Payment Receipt</h2>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              ${data.order_id ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Order Number</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #065f46; font-weight: 700; text-align: right;">#${data.order_id}</td>
              </tr>` : ''}
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Amount Paid</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #065f46; font-weight: 700; text-align: right; font-size: 18px;">${data.currency} ${data.amount}</td>
              </tr>
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Method</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;">${data.payment_method}</td>
              </tr>
              ${data.transaction_id ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Transaction ID</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;"><code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">${data.transaction_id}</code></td>
              </tr>` : ''}
              ${data.payment_date ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 8px 0; color: #374151; font-weight: 500;">Payment Date</td>
                <td class="text-small dark-text" style="padding: 8px 0; color: #065f46; font-weight: 600; text-align: right;">${data.payment_date}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      ${data.order_items && data.order_items.length > 0 ? `
      <!-- Order Items -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td>
            <h3 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #111827;">Your Items</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #ffffff;">
              ${data.order_items.map((item, index) => `
                <tr>
                  <td style="padding: 20px; ${index < data.order_items!.length - 1 ? 'border-bottom: 1px solid #f3f4f6;' : ''}">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="vertical-align: top; width: 70%;">
                          <p class="text-body dark-text" style="margin: 0 0 4px 0; font-weight: 600; color: #111827;">${item.name}</p>
                          <p class="text-small dark-text-secondary" style="margin: 0; color: #6b7280;">Quantity: ${item.quantity}</p>
                        </td>
                        <td style="vertical-align: top; text-align: right;">
                          <p class="text-body dark-text" style="margin: 0; font-weight: 600; color: #111827;">${data.currency} ${item.price}</p>
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
      ` : ''}

      <!-- Success Message (solid white for readability) -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #bfdbfe; border-radius: 8px; margin: 32px 0;">
        <tr>
          <td style="padding: 20px;">
            <p class="text-small" style="margin: 0; color: #1e40af; text-align: center; line-height: 1.6;">✓ Your payment has been securely processed and confirmed. You'll receive email updates as your order progresses.</p>
          </td>
        </tr>
      </table>

      <!-- Action Buttons - Stacked for Mobile -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        ${data.order_id ? `
        <tr>
          <td align="center" style="padding: 0 20px 12px 20px;">
            <a href="${appBaseUrl}/account/orders/${data.order_id}" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none; min-width: 200px; max-width: 90%;">View Order Details</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0 20px;">
            <a href="${appBaseUrl}/products" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; max-width: 90%;">Continue Shopping</a>
          </td>
        </tr>` : `
        <tr>
          <td align="center" style="padding: 0 20px;">
            <a href="${appBaseUrl}/products" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none; min-width: 200px; max-width: 90%;">Continue Shopping</a>
          </td>
        </tr>`}
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
            <!-- Icon centered using table for better email client support -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center" valign="middle" style="width: 72px; height: 72px; background: #dc2626; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ffffff; font-size: 36px; line-height: 72px; display: inline-block;">⚠️</span>
                </td>
              </tr>
            </table>
            <div style="height: 24px;"></div>
            <h1 class="heading-1" style="margin: 0 0 16px 0; color: #111827; text-align: center;">Payment Issue</h1>
            <p class="text-body" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name || 'there'},</p>
            <p class="text-body" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">We encountered an issue processing your payment. Don't worry - we're here to help resolve this quickly.</p>
          </td>
        </tr>
      </table>

      <!-- Payment Details Card (solid white for readability) -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #fca5a5; border-radius: 12px; margin: 32px 0;">
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

      <!-- Common Solutions (solid white for readability) -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
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

      <!-- Action Buttons - Stacked for Mobile -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center" style="padding: 0 20px 12px 20px;">
            <a href="${appBaseUrl}/checkout" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff !important; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none; min-width: 200px; max-width: 90%;">Try Again</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 0 20px;">
            <a href="https://wa.me/255748624684" class="btn-secondary" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; display: inline-block; padding: 14px 30px; color: #374151 !important; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px; max-width: 90%;">Get Help</a>
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
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 32px 0;">
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
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            <h3 class="heading-3" style="margin: 0 0 16px 0; color: #92400e;">Ready to get started?</h3>
            <p class="text-body" style="margin: 0 0 24px 0; color: #92400e; line-height: 1.6;">Browse our curated selection of tech products or book a consultation with our experts.</p>
            
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 8px;">
                  <a href="${appBaseUrl}/products" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border: none;">Browse Products</a>
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
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; border-left: 4px solid #6b7280; margin: 32px 0;">
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

  booking_confirmation: (data: BookingEmailData) => {
    const previewText = `Service booking ${data.booking_id} confirmed - We'll be in touch soon!`
    const content = `
      <!-- Success Icon -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 64px; height: 64px; background: #059669; border-radius: 50%; margin: 0 auto;">
              <tr>
                <td style="text-align: center; vertical-align: middle; padding: 16px;">
                  <span style="color: #ffffff; font-size: 32px; line-height: 1;">📅</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <h2 style="margin:0 0 24px 0;color:#111827;font-size:24px;font-weight:700;text-align:center;line-height:1.3;">Service Booking Confirmed!</h2>
      <p style="margin:0 0 16px 0;color:#374151;font-size:16px;text-align:center;">Dear ${data.customer_name || 'Valued Customer'},</p>
      <p style="margin:0 0 32px 0;color:#6b7280;font-size:16px;text-align:center;line-height:1.5;">Thank you for booking our service! We've received your request and our team will contact you within 24 hours to confirm the details.</p>
      
      <!-- Booking Details Card (solid white for readability) -->
      <div style="background: #ffffff;border-radius:12px;padding:24px;margin:24px 0;border:1px solid #a7f3d0;">
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
      
      <!-- Next Steps (solid white for readability) -->
      <div style="background-color:#ffffff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:32px 0;">
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
                <td>
                  <a href="${appBaseUrl}/account/bookings/${data.booking_id}" class="btn-primary" style="background:#2563eb;display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">View Booking Details</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  admin_notification: (data: AdminNotificationData) => {
    const previewText = data.title || 'Admin Notification from TISCOマーケット'
    
    // Determine priority-based styling (use orange for medium priority to match order notifications)
    const priorityConfig = {
      low: { bgColor: '#6b7280', icon: '🔔' },
      medium: { bgColor: '#f59e0b', icon: '🔔' }, // Orange for medium priority
      high: { bgColor: '#dc2626', icon: '🔔' },
      urgent: { bgColor: '#991b1b', icon: '🔔' }
    }
    
    const priority = data.priority || 'high' // Default to high for admin notifications
    const config = priorityConfig[priority]
    
    const content = `
      <!-- Alert Icon - EXACTLY matches order confirmation layout -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <!-- Icon centered using table for better email client support -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td align="center" valign="middle" style="width: 72px; height: 72px; background: ${config.bgColor}; border-radius: 50%; text-align: center; vertical-align: middle;">
                  <span style="color: #ffffff; font-size: 36px; line-height: 72px; display: inline-block;">${config.icon}</span>
                </td>
              </tr>
            </table>
            <div style="height: 24px;"></div>
            <h1 class="heading-1 dark-text" style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">${data.title || 'Admin Alert'}</h1>
            ${data.customer_name ? `<p class="text-body dark-text" style="margin: 0 0 8px 0; color: #374151; text-align: center;">Hi ${data.customer_name},</p>` : ''}
            <p class="text-body dark-text-secondary" style="margin: 0; color: #6b7280; font-size: 16px; text-align: center; line-height: 1.6;">Action may be required</p>
          </td>
        </tr>
      </table>

      <!-- Alert Message Card - Clean white box with red left border -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border: 1px solid #e5e7eb; border-left: 4px solid #dc2626; border-radius: 8px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px;">
            <p class="dark-text" style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7; font-weight: 400;">
              ${data.message}
            </p>
          </td>
        </tr>
      </table>

      ${data.order_id ? `
      <!-- Order Details Card with improved layout -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h3 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #111827;">Order Information</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Order ID</td>
                <td class="text-small dark-text" style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 700; text-align: right;">#${data.order_id}</td>
              </tr>
              ${data.customer_name ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Customer</td>
                <td class="text-small dark-text" style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.customer_name}</td>
              </tr>` : ''}
              ${data.customer_email ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Email</td>
                <td class="text-small" style="padding: 12px 0; font-size: 14px; font-weight: 600; text-align: right;"><a href="mailto:${data.customer_email}" style="color: #2563eb; text-decoration: none;">${data.customer_email}</a></td>
              </tr>` : ''}
              ${data.items_count ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Items Count</td>
                <td class="text-small dark-text" style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.items_count} ${data.items_count === 1 ? 'item' : 'items'}</td>
              </tr>` : ''}
              ${data.payment_method ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Payment Method</td>
                <td class="text-small dark-text" style="padding: 12px 0; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${data.payment_method}</td>
              </tr>` : ''}
              ${data.payment_status ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 12px 0; color: #6b7280; font-size: 14px; font-weight: 500;">Payment Status</td>
                <td class="text-small" style="padding: 12px 0; font-size: 14px; font-weight: 700; text-align: right; color: ${data.payment_status === 'paid' ? '#059669' : '#f59e0b'}; text-transform: capitalize;">${data.payment_status}</td>
              </tr>` : ''}
              ${data.total_amount && data.currency ? `
              <tr>
                <td class="text-small dark-text-secondary" style="padding: 16px 0 12px 0; color: #6b7280; font-size: 14px; font-weight: 500; border-top: 2px solid #e5e7eb;">Total Amount</td>
                <td class="text-small" style="padding: 16px 0 12px 0; color: #059669; font-size: 18px; font-weight: 700; text-align: right; border-top: 2px solid #e5e7eb;">${data.currency} ${data.total_amount}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>` : ''}
      
      ${data.action_url ? `
      <!-- Action Button - Mobile responsive -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 40px 0;">
        <tr>
          <td align="center" style="padding: 0 20px;">
            <a href="${data.action_url}" class="btn-primary" style="background: #2563eb; display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border-radius: 8px; min-width: 200px; max-width: 90%;">View Order Details</a>
          </td>
        </tr>
      </table>` : ''}
      
      <!-- Quick Actions Card with proper spacing -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg-light" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            <p class="text-small dark-text" style="margin: 0 0 16px 0; color: #111827; font-size: 15px; font-weight: 600; line-height: 1.5;">Need to take action or have questions?</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="padding: 0 16px;">
                  <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-size: 14px; font-weight: 600;">📱 WhatsApp Support</a>
                </td>
                <td style="padding: 0 16px; border-left: 2px solid #e5e7eb;">
                  <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-size: 14px; font-weight: 600;">✉️ Email Support</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
    return baseTemplate(content, data, previewText, 'order_confirmation')
  },

  manual_notification: (data: ManualNotificationData) => {
    const priority = data.priority || 'medium'
    
    // Priority configurations matching the template design system
    const priorityConfig = {
      low: { 
        color: '#0c4a6e',
        iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        borderColor: '#bfdbfe',
        icon: 'ℹ️',
        label: 'Information',
        badgeColor: '#0284c7'
      },
      medium: { 
        color: '#1e40af',
        iconBg: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        borderColor: '#93c5fd',
        icon: '📋',
        label: 'Notice',
        badgeColor: '#2563eb'
      },
      high: { 
        color: '#c2410c',
        iconBg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        borderColor: '#fed7aa',
        icon: '⚠️',
        label: 'Important',
        badgeColor: '#ea580c'
      },
      urgent: { 
        color: '#991b1b',
        iconBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderColor: '#fecaca',
        icon: '🚨',
        label: 'Urgent Action Required',
        badgeColor: '#dc2626'
      }
    }
    
    const config = priorityConfig[priority]
    const previewText = data.title || 'Important message from TISCOマーケット'
    
    const content = `
      <!-- Priority Icon & Header -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td align="center">
            <!-- Priority Icon with gradient background matching other templates -->
            <div style="width: 72px; height: 72px; background: ${config.iconBg}; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
              <span style="color: #ffffff; font-size: 36px; line-height: 1;">${config.icon}</span>
            </div>
            
            <!-- Priority Badge -->
            <div style="display: inline-block; background: ${config.iconBg}; border-radius: 24px; padding: 8px 20px; margin-bottom: 16px;">
              <p style="margin: 0; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${config.label}</p>
            </div>
            
            <h1 class="heading-1 dark-text" style="margin: 0 0 16px 0; color: #111827; text-align: center; font-size: 28px; line-height: 1.3; font-weight: 700;">
              ${data.title}
            </h1>
            <p class="text-body dark-text-secondary" style="margin: 0; color: #6b7280; text-align: center; line-height: 1.6;">Please review the message below from our team</p>
          </td>
        </tr>
      </table>

      <!-- Main Message Card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h2 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: ${config.color}; font-weight: 600;">Message Details</h2>
            <div class="dark-text" style="color: #374151; font-size: 16px; line-height: 1.7;">
              ${data.message.split('\n').map(paragraph => 
                paragraph.trim() ? `<p class="dark-text" style="margin: 0 0 16px 0; color: #374151;">${paragraph}</p>` : '<div style="height: 16px;"></div>'
              ).join('')}
            </div>
          </td>
        </tr>
      </table>

      <!-- Action Button (if provided) -->
      ${data.action_url ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="border-radius: 8px; background: ${config.iconBg};">
                  <a href="${data.action_url}" class="btn-primary" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; border-radius: 8px;">
                    Take Action →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>` : ''}

      <!-- Important Notice Box -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 24px; text-align: center;">
            <h3 class="heading-3" style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">📌 Important Information</h3>
            <p class="text-body" style="margin: 0; color: #92400e; line-height: 1.6; font-size: 14px;">
              This notification was sent directly by our team. If you have questions about this message, please contact us using the support options below.
            </p>
          </td>
        </tr>
      </table>

      <!-- Contact Support Section -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; margin: 32px 0;">
        <tr>
          <td style="padding: 28px;">
            <h3 class="heading-3 dark-text" style="margin: 0 0 20px 0; color: #0c4a6e; text-align: center; font-weight: 600;">Need Help?</h3>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 12px 8px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div class="card-bg" style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">💬</span>
                    </div>
                    <h4 class="text-body dark-text" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600; font-size: 14px;">WhatsApp</h4>
                    <a href="https://wa.me/255748624684" style="color: #059669; text-decoration: none; font-weight: 600; font-size: 13px;">+255 748 624 684</a>
                  </div>
                </td>
                <td style="padding: 12px 8px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div class="card-bg" style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">✉️</span>
                    </div>
                    <h4 class="text-body dark-text" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600; font-size: 14px;">Email</h4>
                    <a href="mailto:info@tiscomarket.store" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px;">info@tiscomarket.store</a>
                  </div>
                </td>
                <td style="padding: 12px 8px; vertical-align: top; width: 33.33%;">
                  <div style="text-align: center;">
                    <div class="card-bg" style="width: 48px; height: 48px; background: #0c4a6e; border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                      <span style="color: #ffffff; font-size: 24px;">🌐</span>
                    </div>
                    <h4 class="text-body dark-text" style="margin: 0 0 8px 0; color: #0c4a6e; font-weight: 600; font-size: 14px;">Visit Store</h4>
                    <a href="${appBaseUrl}" style="color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px;">tiscomarket.store</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Timestamp -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="card-bg-light" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 24px 0;">
        <tr>
          <td style="padding: 16px; text-align: center;">
            <p class="dark-text-muted" style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">
              Sent on ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </td>
        </tr>
      </table>
    `
    
    return baseTemplate(content, data, previewText, 'manual_notification')
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
    support_email: 'info@tiscomarket.store',
    support_phone: '+255748624684',
    ...data
  }
  
  // Handle each template type explicitly to satisfy TypeScript
  switch (templateType) {
    case 'order_confirmation':
      return emailTemplates.order_confirmation(defaultData as OrderEmailData)
    case 'payment_success':
      return emailTemplates.payment_success(defaultData as PaymentEmailData)
    case 'payment_failed':
      return emailTemplates.payment_failed(defaultData as PaymentEmailData)
    case 'welcome_email':
      return emailTemplates.welcome_email(defaultData as BaseEmailData)
    case 'booking_confirmation':
      return emailTemplates.booking_confirmation(defaultData as BookingEmailData)
    case 'admin_notification':
      return emailTemplates.admin_notification(defaultData as AdminNotificationData)
    case 'manual_notification':
      return emailTemplates.manual_notification(defaultData as ManualNotificationData)
    default:
      throw new Error(`Unknown email template: ${templateType}`)
  }
}

// Get default subject lines for email types
export function getDefaultSubject(templateType: TemplateType): string {
  const subjects: Record<TemplateType, string> = {
    order_confirmation: 'Order Confirmed ✓ Your package is on the way',
    payment_success: 'Payment Successful ✓ Transaction Complete',
    payment_failed: 'Payment Issue ⚠️ Let\'s resolve this quickly',
    welcome_email: 'Welcome to TISCO! 🚀 Let\'s get started',
    booking_confirmation: 'Service Booked 📅 We\'ll be in touch soon',
    admin_notification: 'Admin Alert 🔔 Action may be required',
    manual_notification: 'Important Message 📢 From TISCOマーケット'
  }
  
  return subjects[templateType] || 'Message from TISCOマーケット'
}
