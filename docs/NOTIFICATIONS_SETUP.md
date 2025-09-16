# TISCO Market Notifications System Setup Guide

## Overview
This guide covers the complete setup of the notifications system using SendPulse SMTP with your custom domain (tiscomarket.store) and Supabase Auth integration.

## Environment Variables Setup

Add the following environment variables to your `.env.local` files:

### Client Application (.env.local)
```env
# SendPulse Configuration
SENDPULSE_CLIENT_ID=your_sendpulse_client_id
SENDPULSE_CLIENT_SECRET=your_sendpulse_client_secret
SENDPULSE_SENDER_EMAIL=info@tiscomarket.store
SENDPULSE_SENDER_NAME=TISCO Market
SENDPULSE_SMTP_SERVER=smtp-pulse.com
SENDPULSE_SMTP_PORT=2525
SENDPULSE_SMTP_LOGIN=your_smtp_login
SENDPULSE_SMTP_PASSWORD=your_smtp_password

# Admin Configuration
ADMIN_EMAIL=info@tiscomarket.store

# Application URLs
NEXT_PUBLIC_APP_URL=https://tiscomarket.store
```

### Admin Application (.env.local)
```env
# Same SendPulse configuration as above
SENDPULSE_CLIENT_ID=your_sendpulse_client_id
SENDPULSE_CLIENT_SECRET=your_sendpulse_client_secret
SENDPULSE_SENDER_EMAIL=info@tiscomarket.store
SENDPULSE_SENDER_NAME=TISCO Market

# Admin Configuration
ADMIN_EMAIL=info@tiscomarket.store
NEXT_PUBLIC_APP_URL=https://admin.tiscomarket.store
```

## Supabase Auth SMTP Configuration

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication → Settings → SMTP Settings

### Step 2: Configure SMTP Settings
Based on your SendPulse screenshots, configure the following:

```
SMTP Host: smtp-pulse.com
SMTP Port: 2525 (or 465 for SSL, 587 for TLS)
SMTP Username: francislac21@gmail.com (your SendPulse login)
SMTP Password: [Your SendPulse SMTP password]
Sender Email: info@tiscomarket.store
Sender Name: TISCO Market
Enable SMTP: Yes
```

### Step 3: Email Templates Configuration
In Supabase Dashboard → Authentication → Email Templates, customize:

#### Confirm Signup Template
```html
<h2>Welcome to TISCO Market!</h2>
<p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your account</a></p>
<p>If you didn't create an account with us, please ignore this email.</p>
<p>Best regards,<br>TISCO Market Team</p>
```

#### Reset Password Template
```html
<h2>Reset Your Password</h2>
<p>We received a request to reset your password for your TISCO Market account.</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, please ignore this email.</p>
<p>This link will expire in 24 hours.</p>
<p>Best regards,<br>TISCO Market Team</p>
```

#### Magic Link Template
```html
<h2>Sign in to TISCO Market</h2>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to TISCO Market</a></p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>TISCO Market Team</p>
```

## Database Setup

### Step 1: Create Notifications Table
Run the SQL script in your Supabase SQL editor:

```sql
-- Execute the contents of /lib/database/notifications-schema.sql
```

### Step 2: Verify RLS Policies
Ensure the notifications table has proper Row Level Security policies for admin access.

## SendPulse API Setup

### Step 1: Get API Credentials
1. Log in to your SendPulse account
2. Go to Settings → API
3. Create new API credentials
4. Copy the Client ID and Client Secret

### Step 2: Verify SMTP Settings
Based on your screenshots, your SendPulse SMTP is configured with:
- Server: smtp-pulse.com
- Port: 2525
- Login: francislac21@gmail.com
- Sender emails: info@tiscomarket.store (Active)

## Testing the Setup

### Step 1: Test SendPulse Connection
```bash
# In your client application directory
npm run dev

# Test notification endpoint
curl -X POST http://localhost:3000/api/admin/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "event": "admin_notification",
    "recipient_email": "test@example.com",
    "data": {
      "title": "Test Notification",
      "message": "This is a test notification"
    }
  }'
```

### Step 2: Test Order Notifications
1. Create a test order through the application
2. Check that order confirmation emails are sent
3. Verify notifications appear in admin dashboard

### Step 3: Test Booking Notifications
1. Create a test service booking
2. Verify booking confirmation emails
3. Check admin notifications

## Notification Events Implemented

### Automatic Notifications
- **Order Created**: Sent to customer when order is placed
- **Booking Created**: Sent to customer when service is booked
- **Contact Message**: Sent to admin when contact form is submitted
- **User Registration**: Welcome email to new users
- **Payment Success/Failed**: Payment status notifications
- **Order Status Updates**: Shipping, delivery notifications

### Manual Notifications
- Admin can send custom notifications through the admin panel
- Support for different priority levels
- Multiple recipient support

## Admin Dashboard Features

### Notifications Management
- View all notifications with filtering
- Real-time status updates
- Send manual notifications
- Statistics and analytics
- Error tracking and retry mechanisms

### Access the Admin Dashboard
Navigate to `/notifications` in your admin application to:
- View notification history
- Send manual notifications
- Monitor system performance
- Track delivery rates

## Security Considerations

1. **Environment Variables**: Never commit sensitive credentials to version control
2. **SMTP Credentials**: Store securely and rotate regularly
3. **Admin Access**: Ensure only authorized users can access notification settings
4. **Rate Limiting**: Implement rate limiting for notification endpoints
5. **Email Validation**: Validate email addresses before sending

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Verify SMTP credentials in SendPulse
   - Check firewall settings
   - Ensure correct port configuration

2. **Notifications Not Sending**
   - Check environment variables
   - Verify Supabase service role permissions
   - Review application logs

3. **Admin Dashboard Not Loading**
   - Verify admin user role in database
   - Check API endpoint permissions
   - Review browser console for errors

### Logs and Monitoring
- Check application logs for notification errors
- Monitor SendPulse dashboard for delivery statistics
- Use Supabase logs for database-related issues

## Next Steps

1. Set up monitoring and alerting for failed notifications
2. Implement notification preferences for users
3. Add SMS notifications using SendPulse SMS API
4. Set up automated notification campaigns
5. Implement A/B testing for email templates

## Support

For issues with:
- SendPulse: Contact SendPulse support or check their documentation
- Supabase: Review Supabase docs or community forums
- Application: Check application logs and error messages
