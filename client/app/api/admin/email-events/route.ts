import { NextRequest, NextResponse } from 'next/server'
import { emailTemplates } from '@/lib/email-templates'

// Add CORS headers for cross-origin requests
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

// Get all available email events with their test data
export async function GET() {
  try {
    const emailEvents = {
      order_confirmation: {
        name: 'Order Confirmation',
        description: 'Sent when customer places an order',
        trigger: 'Order created',
        testData: {
          customer_name: 'John Doe',
          order_id: 'ORD-2025-001',
          order_date: '2025-01-16',
          total_amount: '2,345,200',
          currency: 'TSh',
          recipient_email: 'john@example.com',
          payment_method: 'ZenoPay Mobile Money',
          shipping_address: '123 Kilimani Street, Dar es Salaam, Tanzania',
          items: [
            { name: 'Ryzen PC Gaming Desktop', quantity: 1, price: '2,000,000' },
            { name: 'Gaming Mouse Pro', quantity: 1, price: '145,000' },
            { name: 'Mechanical Keyboard RGB', quantity: 1, price: '200,200' }
          ]
        }
      },
      booking_confirmation: {
        name: 'Service Booking Confirmation',
        description: 'Sent when customer books a service',
        trigger: 'Service booking created',
        testData: {
          customer_name: 'Jane Smith',
          booking_id: 'BOOK-2025-001',
          service_name: 'PC Setup & Configuration Service',
          preferred_date: '2025-01-20',
          preferred_time: '10:00 AM - 12:00 PM',
          description: 'Complete gaming PC setup with software installation, driver updates, and performance optimization',
          recipient_email: 'jane@example.com'
        }
      },
      welcome_email: {
        name: 'Welcome Email',
        description: 'Sent to new registered users',
        trigger: 'User registration',
        testData: {
          customer_name: 'Alice Johnson',
          recipient_email: 'alice@example.com'
        }
      },
      payment_success: {
        name: 'Payment Success',
        description: 'Sent when payment is successfully processed',
        trigger: 'Payment completed',
        testData: {
          customer_name: 'Bob Wilson',
          order_id: 'ORD-2025-002',
          amount: '1,200,000',
          currency: 'TSh',
          payment_method: 'Tigo Pesa',
          transaction_id: 'TXN-789456123',
          payment_date: '2025-01-16 14:30:00 EAT',
          recipient_email: 'bob@example.com'
        }
      },
      payment_failed: {
        name: 'Payment Failed',
        description: 'Sent when payment processing fails',
        trigger: 'Payment failure',
        testData: {
          customer_name: 'Carol Brown',
          order_id: 'ORD-2025-003',
          amount: '850,000',
          currency: 'TSh',
          payment_method: 'Vodacom M-Pesa',
          failure_reason: 'Insufficient balance in mobile money account',
          recipient_email: 'carol@example.com'
        }
      },
      order_status_update: {
        name: 'Order Status Update',
        description: 'Sent when order status changes',
        trigger: 'Order status change',
        testData: {
          customer_name: 'David Lee',
          order_id: 'ORD-2025-004',
          order_date: '2025-01-15',
          total_amount: '450,000',
          currency: 'TSh',
          status: 'shipped',
          tracking_number: 'TK123456789TZ',
          recipient_email: 'david@example.com',
          items: [
            { name: 'Wireless Headphones', quantity: 2, price: '225,000' }
          ]
        }
      },
      cart_abandonment: {
        name: 'Cart Abandonment',
        description: 'Sent when user leaves items in cart',
        trigger: 'Cart abandoned for 24+ hours',
        testData: {
          customer_name: 'Eva Martinez',
          recipient_email: 'eva@example.com',
          cart_url: 'https://tiscomarket.store/cart?resume=abc123'
        }
      },
      password_reset: {
        name: 'Password Reset',
        description: 'Sent when user requests password reset',
        trigger: 'Password reset request',
        testData: {
          customer_name: 'Frank Wilson',
          recipient_email: 'frank@example.com',
          reset_link: 'https://tiscomarket.store/auth/reset?token=reset-token-123',
          expires_at: '2025-01-17 14:30:00 EAT'
        }
      },
      delivery_confirmation: {
        name: 'Delivery Confirmation',
        description: 'Sent when order is delivered',
        trigger: 'Order delivered',
        testData: {
          customer_name: 'Grace Kim',
          order_id: 'ORD-2025-005',
          order_date: '2025-01-14',
          total_amount: '75,000',
          currency: 'TSh',
          recipient_email: 'grace@example.com',
          items: [
            { name: 'Phone Case Premium', quantity: 1, price: '75,000' }
          ]
        }
      },
      review_request: {
        name: 'Review Request',
        description: 'Sent requesting customer review',
        trigger: '7 days after delivery',
        testData: {
          customer_name: 'Henry Chen',
          order_id: 'ORD-2025-006',
          order_date: '2025-01-10',
          total_amount: '320,000',
          currency: 'TSh',
          recipient_email: 'henry@example.com',
          items: [
            { name: 'Smart Watch Series 5', quantity: 1, price: '320,000' }
          ]
        }
      },
      contact_reply: {
        name: 'Contact Form Reply',
        description: 'Sent in response to customer inquiries',
        trigger: 'Admin replies to contact form',
        testData: {
          customer_name: 'Isabella Rodriguez',
          recipient_email: 'isabella@example.com',
          original_message: 'Hi, I would like to know about warranty options for gaming laptops.',
          admin_response: 'Thank you for your inquiry! All our gaming laptops come with a 2-year manufacturer warranty plus an optional extended warranty. Our team can help you choose the best coverage for your needs.',
          message_id: 'MSG-2025-001'
        }
      },
      booking_status_update: {
        name: 'Booking Status Update',
        description: 'Sent when service booking status changes',
        trigger: 'Booking status change',
        testData: {
          customer_name: 'Jack Thompson',
          booking_id: 'BOOK-2025-002',
          service_name: 'Laptop Repair Service',
          preferred_date: '2025-01-18',
          preferred_time: '2:00 PM - 4:00 PM',
          description: 'Screen replacement and keyboard repair for Dell Laptop',
          status: 'confirmed',
          admin_notes: 'Your laptop repair has been confirmed. Please bring your charger and any external accessories.',
          recipient_email: 'jack@example.com'
        }
      },
      admin_notification: {
        name: 'Admin Notification',
        description: 'Internal notifications for admin team',
        trigger: 'Various admin events',
        testData: {
          notification_type: 'new_order',
          title: 'New Order Alert',
          message: 'A new order has been placed requiring immediate attention. Order value: TSh 2,500,000',
          action_url: 'https://admin.tiscomarket.store/orders/ORD-2025-007',
          recipient_email: 'admin@tiscomarket.store'
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      total_events: Object.keys(emailEvents).length,
      events: emailEvents,
      available_actions: [
        'preview_template',
        'customize_styling', 
        'test_send',
        'export_html'
      ]
    })
    
    return addCorsHeaders(response)

  } catch (error) {
    console.error('[email-events] Error:', error)
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// Generate template with custom styling
export async function POST(request: NextRequest) {
  try {
    const { event_type, custom_styles, test_data_override } = await request.json()

    if (!event_type) {
      return NextResponse.json({
        success: false,
        error: 'event_type is required'
      }, { status: 400 })
    }

    const templateFunction = emailTemplates[event_type as keyof typeof emailTemplates]
    if (!templateFunction) {
      return NextResponse.json({
        success: false,
        error: 'Invalid event type'
      }, { status: 400 })
    }

    // Get the event data
    const eventsResponse = await GET()
    const eventsData = await eventsResponse.json()
    const eventData = eventsData.events[event_type]

    if (!eventData) {
      return NextResponse.json({
        success: false,
        error: 'Event data not found'
      }, { status: 400 })
    }

    // Merge test data with any overrides
    const finalTestData = { ...eventData.testData, ...test_data_override }

    // Generate the email HTML
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let emailHtml = templateFunction(finalTestData as any)

    // Apply custom styles if provided
    if (custom_styles) {
      emailHtml = applyCustomStyles(emailHtml, custom_styles)
    }

    const response = NextResponse.json({
      success: true,
      event_type,
      event_name: eventData.name,
      html: emailHtml,
      test_data: finalTestData,
      custom_styles: custom_styles || null
    })
    
    return addCorsHeaders(response)

  } catch (error) {
    console.error('[email-events] POST Error:', error)
    const response = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

function applyCustomStyles(html: string, styles: Record<string, string>): string {
  let styledHtml = html

  // Apply custom color scheme
  if (styles.headerColor) {
    styledHtml = styledHtml.replace(
      /background:\s*linear-gradient\([^)]+\)/g,
      `background: ${styles.headerColor}`
    )
  }

  if (styles.accentColor) {
    styledHtml = styledHtml.replace(/#2563eb/g, styles.accentColor)
  }

  if (styles.textColor) {
    styledHtml = styledHtml.replace(/#374151/g, styles.textColor)
  }

  if (styles.backgroundColor) {
    styledHtml = styledHtml.replace(/#f8fafc/g, styles.backgroundColor)
  }

  // Apply custom fonts
  if (styles.fontFamily) {
    styledHtml = styledHtml.replace(
      /font-family:'Segoe UI'[^;]+;/g,
      `font-family:'${styles.fontFamily}',Arial,sans-serif;`
    )
  }

  // Apply border radius changes
  if (styles.borderRadius) {
    styledHtml = styledHtml.replace(
      /border-radius:\s*\d+px/g,
      `border-radius: ${styles.borderRadius}`
    )
  }

  return styledHtml
}
