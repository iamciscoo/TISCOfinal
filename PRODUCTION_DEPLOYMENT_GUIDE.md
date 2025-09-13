# TISCO Platform - Production Deployment Guide

## Overview
This guide walks you through deploying your Clerk-powered TISCO platform to production on Vercel while maintaining your local development environment.

## Prerequisites
- Vercel account with CLI installed
- Clerk account with production instance
- Supabase project (already configured)
- Domain names (optional but recommended)

## Step 1: Clerk Production Setup

### 1.1 Create Production Instance
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application or create a new one
3. Switch to **Production** mode in the top-right toggle
4. Note your production keys:
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`

### 1.2 Configure Production Domains
In Clerk Dashboard → **Configure** → **Domains**:
- Add your client production domain (e.g., `tisco-shop.vercel.app`)
- Add your admin production domain (e.g., `tisco-admin.vercel.app`)

### 1.3 Generate Webhook Secrets
In Clerk Dashboard → **Configure** → **Webhooks**:
- Create separate webhook endpoints for client and admin
- Copy the webhook secrets for each

## Step 2: Update Environment Variables

### 2.1 Client Production Variables
Update `/client/.env.production` with your actual production keys:

```bash
# Replace these with your actual Clerk production keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET
CLERK_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET

# Update with your actual production domain
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.vercel.app
```

### 2.2 Admin Production Variables
Update `/admin/.env.production` with your actual production keys:

```bash
# Replace these with your actual Clerk production keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_KEY
CLERK_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET
CLERK_WEBHOOK_SECRET=whsec_YOUR_ADMIN_WEBHOOK_SECRET

# Update with your actual admin domain
NEXT_PUBLIC_BASE_URL=https://your-admin-domain.vercel.app
```

## Step 3: Deploy to Vercel

### 3.1 Deploy Client Application
```bash
cd client
vercel --prod
```

### 3.2 Deploy Admin Application
```bash
cd admin
vercel --prod
```

### 3.3 Set Environment Variables in Vercel Dashboard
For each deployment:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all variables from your `.env.production` file
3. Set Environment to "Production"
4. Redeploy after adding variables

## Step 4: Configure Production Environment Variables in Vercel

### Client App Variables:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ZENOPAY_BASE_URL=https://zenoapi.com/api/payments
ZENOPAY_ACCOUNT_ID=zp82248053
ZENOPAY_API_KEY=a09eMYJfzRya4nSTsOFybPejSlKgRFsO1Kd5A_-MS700hri2ES-sZBamYiGbO0TnuvFWIuf1FafyjoJmZ70nIA
WEBHOOK_SECRET=0f1e2d3c4b5a69788796a5b4c3d2e1f0aa112233445566778899aabbccddeeff
ZENOPAY_SECRET_KEY=your_zenopay_secret_key
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
ZENOPAY_REMOTE_STATUS=true
NODE_ENV=production
```

### Admin App Variables:
```
ADMIN_ACCESS_KEY=Ciscolinuxadmin@22
ADMIN_SESSION_SECRET=73086e5fe9a36758231dafa643640a5dd8593af720e4c2ca70ae8628bfa40cdf6e6ae4211454e4cb6d0823aa05fc37c6b0b7af7477ef8df8e30d83a621edc766
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://your-admin-domain.vercel.app
```

## Step 5: Supabase Production Configuration

### 5.1 Update Allowed Origins
In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Add your production client domain
- Add your production admin domain

### 5.2 Update CORS Settings
In Supabase Dashboard → **Settings** → **API**:
- Add your production domains to allowed origins

## Step 6: Verification Checklist

### 6.1 Authentication Testing
- [ ] Sign up works on production client
- [ ] Sign in works on production client
- [ ] Admin login works on production admin
- [ ] User sessions persist correctly
- [ ] Sign out works properly

### 6.2 Database Operations
- [ ] Products load correctly
- [ ] Cart operations work
- [ ] Order creation works
- [ ] Admin CRUD operations work
- [ ] Image uploads work

### 6.3 Payment Integration
- [ ] ZenoPay integration works
- [ ] Webhook endpoints respond correctly
- [ ] Order status updates properly

## Step 7: Post-Deployment Tasks

### 7.1 Update Clerk Webhook URLs
In Clerk Dashboard → **Configure** → **Webhooks**:
- Update webhook URLs to point to production domains
- Test webhook delivery

### 7.2 Monitor and Test
- Check Vercel function logs
- Monitor Supabase logs
- Test all critical user flows
- Verify email notifications work

## Step 8: Custom Domain Setup (Optional)

### 8.1 Add Custom Domains in Vercel
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domains
3. Configure DNS records as instructed

### 8.2 Update Environment Variables
Update `NEXT_PUBLIC_BASE_URL` in both applications to use custom domains

## Rollback Plan

If issues occur:
1. Revert to previous Vercel deployment
2. Switch Clerk back to development mode temporarily
3. Check logs in Vercel and Supabase dashboards
4. Test locally first before redeploying

## Local Development Preservation

Your local environment continues to work with:
- `.env.local` files (unchanged)
- Development Clerk keys
- Same Supabase instance (shared between dev/prod)

## Security Considerations

- Never commit production keys to version control
- Use Vercel environment variables for sensitive data
- Regularly rotate webhook secrets
- Monitor authentication logs for suspicious activity
- Set up proper CORS policies

## Support and Troubleshooting

Common issues:
1. **Authentication fails**: Check Clerk domain configuration
2. **Database errors**: Verify Supabase CORS settings
3. **Build failures**: Check environment variable names
4. **Webhook failures**: Verify endpoint URLs and secrets

For additional support, check:
- Vercel deployment logs
- Clerk dashboard logs
- Supabase dashboard logs
- Browser developer console
