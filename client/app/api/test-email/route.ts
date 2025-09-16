import { NextRequest, NextResponse } from 'next/server'
import { emailTemplates } from '@/lib/email-templates'

export async function GET(request: NextRequest) {
  // Skip authentication for testing
  console.log('Testing email template generation...')
  try {
    const url = new URL(request.url)
    const template = url.searchParams.get('template') || 'order_confirmation'
    
    const sampleData = {
      order_confirmation: {
        customer_name: "Test User",
        order_id: "ORD-TEST-001",
        order_date: "January 16, 2025",
        total_amount: "1,250,000",
        currency: "TSh",
        payment_method: "Tigo Pesa",
        items: [
          { name: "Gaming Laptop", quantity: 1, price: "1,000,000" },
          { name: "Gaming Mouse", quantity: 1, price: "250,000" }
        ]
      },
      payment_success: {
        customer_name: "Test User",
        transaction_id: "TEST_TXN_123456",
        amount: "1,250,000",
        currency: "TSh",
        payment_method: "Tigo Pesa",
        payment_date: "January 16, 2025 5:54 PM EAT",
        order_id: "ORD-TEST-001"
      },
      payment_failed: {
        customer_name: "Test User",
        transaction_id: "TEST_TXN_123456",
        amount: "1,250,000",
        currency: "TSh",
        payment_method: "Tigo Pesa",
        failure_reason: "Insufficient balance"
      },
      welcome_email: {
        customer_name: "Test User"
      }
    }
    
    if (!emailTemplates[template as keyof typeof emailTemplates]) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 })
    }
    
    const templateFunction = emailTemplates[template as keyof typeof emailTemplates]
    const data = sampleData[template as keyof typeof sampleData] || {}
    const html = (templateFunction as any)(data)
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating test email:', error)
    return NextResponse.json({ error: 'Failed to generate email template' }, { status: 500 })
  }
}
