# TISCO Market - Email Notification System Setup Guide

## Overview
This guide provides step-by-step instructions for setting up email notifications in TISCO Market. The platform includes a complete email template system and notification queue, requiring only integration with an email service provider.

## Email System Architecture

### Components
1. **Email Queue**: Database table `email_notifications` stores all pending emails
2. **Templates**: Pre-built HTML email templates in `/client/lib/email-templates.ts`
3. **API Endpoints**: Email notification endpoints at `/api/notifications/email`
4. **Admin Interface**: Message management in admin panel

### Supported Email Types
- Order confirmation
- Order status updates
- Payment success/failure notifications
- Cart abandonment reminders
- Welcome emails
- Shipping notifications
- Delivery confirmations
- Review requests
- Contact form replies

## Step 1: Choose an Email Service Provider

### Recommended Options

#### Option 1: SendGrid (Recommended)
**Best for**: Reliability and deliverability
**Free tier**: 100 emails/day forever
**Setup time**: 15-30 minutes

#### Option 2: Resend
**Best for**: Developer experience
**Free tier**: 100 emails/day
**Setup time**: 10 minutes

#### Option 3: AWS SES
**Best for**: Cost at scale
**Free tier**: 62,000 emails/month (if sending from EC2)
**Setup time**: 30-60 minutes (requires domain verification)

## Step 2: Database Setup

Run the email notifications migration:

```sql
-- Run this in your Supabase SQL editor
-- File: /docs/resources/sql/08_email_notifications.sql
```

This creates:
- `email_notifications` table
- `push_notifications` table (for future mobile app)
- Necessary indexes and RLS policies

## Step 3: Email Service Integration

### SendGrid Setup

1. **Create SendGrid Account**
   - Sign up at [sendgrid.com](https://sendgrid.com)
   - Verify your email address
   - Create an API key with "Mail Send" permissions

2. **Install SendGrid Package**
   ```bash
   cd client
   npm install @sendgrid/mail
   ```

3. **Update Environment Variables**
   ```env
   # Add to client/.env.local
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=noreply@yourdomain.com
   FROM_NAME=TISCO Market
   ```

4. **Update Email Service Code**
   
   Edit `/client/app/api/notifications/email/route.ts`:
   
   ```typescript
   // Add at top of file
   import sgMail from '@sendgrid/mail'
   
   // Initialize SendGrid
   sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
   
   // Replace the sendEmail function:
   async function sendEmail(notification: NotificationRequest): Promise<void> {
     try {
       const html = await renderEmailTemplate(
         notification.template_type as any,
         notification.template_data
       )
       
       const msg = {
         to: notification.recipient_email,
         from: {
           email: process.env.FROM_EMAIL!,
           name: process.env.FROM_NAME || 'TISCO Market'
         },
         subject: notification.subject || getDefaultSubject(notification.template_type as any),
         html: html,
       }
       
       await sgMail.send(msg)
       
       // Update notification status to sent
       await supabase
         .from('email_notifications')
         .update({ 
           status: 'sent', 
           sent_at: new Date().toISOString()
         })
         .eq('id', notification.id)
         
     } catch (error) {
       console.error('Email send error:', error)
       
       // Update notification status to failed
       await supabase
         .from('email_notifications')
         .update({ 
           status: 'failed', 
           error_message: (error as Error).message,
           failed_at: new Date().toISOString(),
           retry_count: (notification.retry_count || 0) + 1
         })
         .eq('id', notification.id)
         
       throw error
     }
   }
   ```

### Resend Setup (Alternative)

1. **Create Resend Account**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain
   - Create an API key

2. **Install Resend Package**
   ```bash
   cd client
   npm install resend
   ```

3. **Update Environment Variables**
   ```env
   # Add to client/.env.local
   RESEND_API_KEY=your_resend_api_key
   FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Update Email Service Code**
   ```typescript
   import { Resend } from 'resend'
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   // In sendEmail function:
   await resend.emails.send({
     from: `TISCO Market <${process.env.FROM_EMAIL}>`,
     to: notification.recipient_email,
     subject: notification.subject,
     html: await renderEmailTemplate(notification.template_type as any, notification.template_data)
   })
   ```

## Step 4: Email Worker Setup (Optional but Recommended)

For production, set up a background worker to process queued emails:

### Option 1: Vercel Cron Jobs

Create `/client/app/api/cron/process-emails/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch pending emails
    const { data: emails, error } = await supabase
      .from('email_notifications')
      .select('*')
      .in('status', ['queued', 'pending'])
      .lte('scheduled_for', new Date().toISOString())
      .limit(10)

    if (error) throw error

    // Process each email
    for (const email of emails || []) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-internal-secret': process.env.INTERNAL_API_SECRET!
          },
          body: JSON.stringify({
            ...email,
            send_immediately: true
          })
        })
      } catch (err) {
        console.error('Failed to process email:', email.id, err)
      }
    }

    return NextResponse.json({ 
      processed: emails?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Email cron error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-emails",
    "schedule": "*/5 * * * *"
  }]
}
```

### Option 2: Supabase Edge Functions

Create a Supabase Edge Function to process emails directly.

## Step 5: Testing Email Notifications

### 1. Test Email Endpoint

Create a test endpoint at `/client/app/api/test-email/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { type = 'welcome_email' } = await request.json()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_type: type,
        recipient_email: user.emailAddresses[0].emailAddress,
        template_data: {
          customer_name: `${user.firstName} ${user.lastName}`,
          order_id: 'TEST-12345',
          order_date: new Date().toLocaleDateString(),
          total_amount: '50,000',
          currency: 'TZS',
          items: [
            { name: 'Test Product', quantity: 1, price: '50,000' }
          ]
        },
        send_immediately: true
      })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
```

### 2. Test via Admin Panel

The admin panel can trigger emails when:
- Responding to contact messages
- Updating order status
- Sending custom notifications

### 3. Test Templates

Test each email template to ensure proper rendering:

```bash
# Quick test script
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"type": "order_confirmation"}'
```

## Step 6: Email Triggers Integration

### Order Confirmation Emails

Update `/client/app/api/orders/route.ts` to send confirmation:

```typescript
// After successful order creation
await fetch('/api/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_type: 'order_confirmation',
    recipient_email: user.emailAddresses[0].emailAddress,
    template_data: {
      customer_name: `${user.firstName} ${user.lastName}`,
      order_id: order.id,
      order_date: new Date().toLocaleDateString(),
      total_amount: order.total_amount.toLocaleString(),
      currency: order.currency,
      items: orderItems,
      shipping_address: order.shipping_address,
      payment_method: order.payment_method
    },
    send_immediately: true
  })
})
```

### Payment Success Emails

Update `/client/app/api/payments/webhooks/route.ts`:

```typescript
// After payment success
await fetch('/api/notifications/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    template_type: 'payment_success',
    recipient_email: userEmail,
    template_data: {
      customer_name: customerName,
      order_id: order.id,
      amount: amount.toLocaleString(),
      currency: currency,
      payment_method: paymentMethod,
      transaction_id: transactionId
    },
    send_immediately: true
  })
})
```

## Step 7: Monitoring & Maintenance

### Email Analytics Dashboard

Create an admin dashboard to monitor:
- Email send rates
- Failed emails
- Retry queue
- Template performance

### Database Maintenance

Schedule regular cleanup of old notifications:

```sql
-- Run weekly to clean up old sent emails
SELECT cleanup_old_notifications();
```

### Error Monitoring

1. Monitor failed emails in admin panel
2. Set up alerts for high failure rates
3. Review error messages for common issues

## Step 8: Compliance & Best Practices

### Email Requirements
1. **Unsubscribe Links**: Add to marketing emails
2. **Privacy Policy**: Link in email footer
3. **Physical Address**: Required by CAN-SPAM
4. **Reply-To Address**: Set to support email

### Sending Best Practices
1. **Warm Up IP**: Start with low volume
2. **Monitor Reputation**: Check sender score
3. **Authenticate Domain**: Set up SPF, DKIM, DMARC
4. **Handle Bounces**: Process bounce notifications
5. **Respect Preferences**: Honor unsubscribe requests

## Troubleshooting

### Common Issues

**Emails not sending**
- Check API key configuration
- Verify sender domain/email
- Check email service logs
- Review error messages in database

**Emails going to spam**
- Authenticate your domain
- Use consistent from address
- Avoid spam trigger words
- Include unsubscribe link

**Rate limiting**
- Implement queue processing
- Add retry logic with backoff
- Monitor service limits
- Consider upgrading plan

### Debug Checklist
- [ ] Environment variables set correctly
- [ ] Email service API key valid
- [ ] From email verified with service
- [ ] Database migrations run
- [ ] Email templates rendering correctly
- [ ] Worker/cron job running
- [ ] Error logs checked

## Production Checklist

Before going live:
- [ ] Real email service integrated (not mock)
- [ ] Domain authentication configured
- [ ] Email templates tested
- [ ] Queue processing automated
- [ ] Error handling implemented
- [ ] Monitoring set up
- [ ] Compliance requirements met
- [ ] Backup email service configured
- [ ] Rate limiting implemented
- [ ] Unsubscribe mechanism working

---

**Support**: For email delivery issues, check your email service provider's documentation and support channels.

**Last Updated**: January 2025
