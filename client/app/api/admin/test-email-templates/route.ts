import { NextRequest, NextResponse } from 'next/server'
import { emailTemplates } from '@/lib/email-templates'

export async function GET(request: NextRequest) {
  try {
    // Test data for different email templates
    const testData = {
      order_confirmation: {
        customer_name: 'John Doe',
        order_id: 'ORD-2025-001',
        order_date: '2025-01-16',
        total_amount: '2,345,200',
        currency: 'TSh',
        recipient_email: 'test@example.com',
        payment_method: 'ZenoPay Mobile Money',
        shipping_address: 'Dar es Salaam, Tanzania',
        items: [
          { name: 'Ryzen PC Gaming Desktop', quantity: 1, price: '2,000,000' },
          { name: 'Gaming Mouse', quantity: 1, price: '45,000' },
          { name: 'Mechanical Keyboard', quantity: 1, price: '300,200' }
        ]
      },
      booking_confirmation: {
        customer_name: 'Jane Smith',
        booking_id: 'BOOK-2025-001',
        service_name: 'PC Setup & Configuration',
        preferred_date: '2025-01-20',
        preferred_time: '10:00 AM',
        description: 'Complete gaming PC setup with software installation and optimization',
        recipient_email: 'jane@example.com'
      },
      welcome_email: {
        customer_name: 'Alice Johnson',
        recipient_email: 'alice@example.com'
      },
      payment_success: {
        customer_name: 'Bob Wilson',
        order_id: 'ORD-2025-002',
        amount: '1,200,000',
        currency: 'TSh',
        payment_method: 'Tigo Pesa',
        transaction_id: 'TXN-789456123',
        payment_date: '2025-01-16 14:30:00',
        recipient_email: 'bob@example.com'
      },
      payment_failed: {
        customer_name: 'Carol Brown',
        order_id: 'ORD-2025-003',
        amount: '850,000',
        currency: 'TSh',
        payment_method: 'Vodacom M-Pesa',
        failure_reason: 'Insufficient balance in mobile money account',
        recipient_email: 'carol@example.com'
      },
      cart_abandonment: {
        customer_name: 'David Lee',
        recipient_email: 'david@example.com',
        cart_url: 'https://tiscomarket.store/cart?resume=abc123'
      },
      password_reset: {
        customer_name: 'Eva Martinez',
        recipient_email: 'eva@example.com',
        reset_link: 'https://tiscomarket.store/auth/reset?token=reset-token-123',
        expires_at: '2025-01-17 14:30:00 EAT'
      }
    }

    const { searchParams } = new URL(request.url)
    const templateType = searchParams.get('template') || 'order_confirmation'
    const format = searchParams.get('format') || 'html'
    const preview = searchParams.get('preview') === 'true'

    // Generate email template
    const templateFunction = emailTemplates[templateType as keyof typeof emailTemplates]
    if (!templateFunction) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid template type',
        available_templates: Object.keys(emailTemplates)
      }, { status: 400 })
    }

    const emailHtml = templateFunction(testData[templateType as keyof typeof testData] as any)

    if (preview) {
      // Return HTML for browser preview
      return new NextResponse(emailHtml, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        template_type: templateType,
        html: emailHtml,
        test_data: testData[templateType as keyof typeof testData],
        preview_url: `/api/admin/test-email-templates?template=${templateType}&preview=true`,
        mobile_test_url: `/api/admin/test-email-templates?template=${templateType}&preview=true&mobile=true`
      })
    }

    return new NextResponse(emailHtml, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('[test-email-templates] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test email sending functionality
export async function POST(request: NextRequest) {
  try {
    const { template_type, recipient_email, test_mode = true } = await request.json()

    if (!template_type || !recipient_email) {
      return NextResponse.json({
        success: false,
        error: 'template_type and recipient_email are required'
      }, { status: 400 })
    }

    // In test mode, we just validate the template generation
    if (test_mode) {
      const templateFunction = emailTemplates[template_type as keyof typeof emailTemplates]
      if (!templateFunction) {
        return NextResponse.json({
          success: false,
          error: 'Invalid template type'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Email template validated successfully',
        template_type,
        recipient_email,
        preview_url: `/api/admin/test-email-templates?template=${template_type}&preview=true`
      })
    }

    // TODO: Implement actual email sending with SendPulse
    return NextResponse.json({
      success: true,
      message: 'Email sending not implemented in test mode',
      template_type,
      recipient_email
    })

  } catch (error) {
    console.error('[test-email-templates] POST Error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
