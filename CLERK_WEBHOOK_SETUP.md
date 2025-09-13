# Clerk Webhook Configuration for tiscomarket.store

## Overview
Webhooks allow Clerk to notify your application when authentication events occur (user signs up, signs in, updates profile, etc.). This guide shows you how to configure webhooks for your production domain.

## Your Domain Configuration

**Main Store**: `https://tiscomarket.store`
**Admin Panel**: `https://admin.tiscomarket.store`

## Step 1: Access Clerk Webhook Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Ensure you're in **Production** mode (toggle in top-right)
4. Navigate to **Configure** → **Webhooks**

## Step 2: Create Webhook Endpoints

### 2.1 Client Application Webhook
Click **"Add Endpoint"** and configure:

**Endpoint URL**: `https://tiscomarket.store/api/webhooks/clerk`

**Events to Subscribe**:
- `user.created` - When a new user signs up
- `user.updated` - When user profile is updated
- `user.deleted` - When user account is deleted
- `session.created` - When user signs in
- `session.ended` - When user signs out

**Description**: "TISCO Store - User Events"

### 2.2 Admin Application Webhook
Click **"Add Endpoint"** and configure:

**Endpoint URL**: `https://admin.tiscomarket.store/api/webhooks/clerk`

**Events to Subscribe**:
- `user.created` - For admin user management
- `user.updated` - For admin user management
- `user.deleted` - For admin user management

**Description**: "TISCO Admin - User Management"

## Step 3: Copy Webhook Secrets

After creating each webhook:
1. Click on the webhook endpoint
2. Copy the **Signing Secret** (starts with `whsec_`)
3. Update your environment files:

### Client Webhook Secret
Update `client/.env.production`:
```bash
CLERK_WEBHOOK_SECRET=whsec_YOUR_CLIENT_WEBHOOK_SECRET
```

### Admin Webhook Secret  
Update `admin/.env.production`:
```bash
CLERK_WEBHOOK_SECRET=whsec_YOUR_ADMIN_WEBHOOK_SECRET
```

## Step 4: Create Webhook Handler Files

### 4.1 Client Webhook Handler
Your client app needs a webhook handler at `app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const { id } = evt.data
  const eventType = evt.type

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body)

  switch (eventType) {
    case 'user.created':
      // Handle new user signup
      console.log('New user created:', evt.data)
      // You can sync user data to your database here
      break
    
    case 'user.updated':
      // Handle user profile updates
      console.log('User updated:', evt.data)
      break
    
    case 'user.deleted':
      // Handle user deletion
      console.log('User deleted:', evt.data)
      break
    
    case 'session.created':
      // Handle user sign in
      console.log('User signed in:', evt.data)
      break
    
    case 'session.ended':
      // Handle user sign out
      console.log('User signed out:', evt.data)
      break
    
    default:
      console.log(`Unhandled event type: ${eventType}`)
  }

  return new Response('', { status: 200 })
}
```

### 4.2 Admin Webhook Handler
Your admin app needs a similar handler at `app/api/webhooks/clerk/route.ts`:

```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local')
  }

  // Get the headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook for admin purposes
  const { id } = evt.data
  const eventType = evt.type

  console.log(`Admin webhook: ${eventType} for user ${id}`)

  switch (eventType) {
    case 'user.created':
      // Sync new user to admin dashboard
      console.log('Admin: New user to track:', evt.data)
      break
    
    case 'user.updated':
      // Update user in admin system
      console.log('Admin: User updated:', evt.data)
      break
    
    case 'user.deleted':
      // Handle user deletion in admin
      console.log('Admin: User deleted:', evt.data)
      break
    
    default:
      console.log(`Admin: Unhandled event type: ${eventType}`)
  }

  return new Response('', { status: 200 })
}
```

## Step 5: Domain Configuration in Clerk

### 5.1 Add Production Domains
In Clerk Dashboard → **Configure** → **Domains**:

**Add these domains**:
- `tiscomarket.store`
- `admin.tiscomarket.store`

### 5.2 Configure Redirect URLs
In **URL Configuration** section, set:

**Site URL**: `https://tiscomarket.store`

**Additional Redirect URLs**:
```
https://tiscomarket.store
https://tiscomarket.store/auth/callback
https://admin.tiscomarket.store
https://admin.tiscomarket.store/auth/callback
```

## Step 6: Test Webhook Configuration

### 6.1 Deploy Your Applications First
Make sure both applications are deployed with the webhook handlers:
```bash
./deploy-production.sh
```

### 6.2 Test Webhooks in Clerk Dashboard
1. Go to **Configure** → **Webhooks**
2. Click on each webhook endpoint
3. Click **"Send Test Event"**
4. Choose an event type (e.g., `user.created`)
5. Click **"Send"**

### 6.3 Check Webhook Delivery
- Check the **"Recent Deliveries"** section
- Successful deliveries show **200** status
- Failed deliveries show error details

## Step 7: Monitor Webhook Activity

### 7.1 Vercel Function Logs
Monitor webhook activity in Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to **Functions** tab
4. Check logs for `/api/webhooks/clerk`

### 7.2 Clerk Dashboard Monitoring
In Clerk Dashboard → **Configure** → **Webhooks**:
- View delivery success rates
- Check failed delivery reasons
- Monitor webhook performance

## Common Webhook Use Cases

### For Your TISCO Platform:

**User Registration** (`user.created`):
- Create user profile in Supabase
- Send welcome email
- Initialize user cart
- Set up default preferences

**User Updates** (`user.updated`):
- Sync profile changes to database
- Update user permissions
- Log activity for admin

**User Deletion** (`user.deleted`):
- Clean up user data
- Cancel active orders
- Remove from mailing lists

## Troubleshooting

### Common Issues:

1. **Webhook Returns 404**:
   - Ensure webhook handler files exist
   - Check deployment was successful
   - Verify URL paths are correct

2. **Webhook Signature Verification Fails**:
   - Check `CLERK_WEBHOOK_SECRET` is correct
   - Ensure secret matches the one in Clerk dashboard
   - Verify environment variables are set in Vercel

3. **Webhook Times Out**:
   - Keep webhook handlers lightweight
   - Use background jobs for heavy processing
   - Return 200 status quickly

### Debug Commands:
```bash
# Check if webhook endpoint is accessible
curl -X POST https://tiscomarket.store/api/webhooks/clerk

# Check Vercel function logs
vercel logs --follow
```

## Security Best Practices

1. **Always Verify Signatures**: Never skip webhook signature verification
2. **Use HTTPS Only**: Webhooks should only use secure endpoints
3. **Rotate Secrets**: Regularly rotate webhook secrets
4. **Log Suspicious Activity**: Monitor for unusual webhook patterns
5. **Rate Limiting**: Implement rate limiting on webhook endpoints

## Next Steps

After configuring webhooks:
1. Deploy your applications with webhook handlers
2. Test webhook delivery in Clerk dashboard
3. Monitor webhook logs in Vercel
4. Implement specific business logic for each event type
5. Set up error alerting for failed webhooks
