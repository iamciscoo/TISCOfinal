# Environment Variables Documentation

## Overview

TISCO requires several environment variables for proper operation. This document lists all required and optional environment variables for both client and admin applications.

## Security Notice

⚠️ **NEVER commit `.env` files to version control!**

All `.env` files are properly gitignored. Use `.env.example` files as templates.

## Client Application Environment Variables

### Required Variables

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
```

**Purpose**:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous/public API key for client-side operations
- `SUPABASE_SERVICE_ROLE`: Service role key for server-side admin operations (keep secret!)

#### Payment Integration
```bash
ZENOPAY_API_KEY=your-zenopay-api-key
WEBHOOK_SECRET=your-webhook-secret-key
```

**Purpose**:
- `ZENOPAY_API_KEY`: API key for ZenoPay mobile money integration
- `WEBHOOK_SECRET`: Secret key for verifying webhook signatures from ZenoPay

#### Email Service
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
```

**Purpose**:
- `SENDGRID_API_KEY`: SendGrid API key for sending transactional emails

### Optional Variables

```bash
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=https://tiscomarket.store
```

**Purpose**:
- `NODE_ENV`: Environment mode (affects logging, error handling)
- `NEXT_PUBLIC_APP_URL`: Public URL of the application (for email links, redirects)

## Admin Application Environment Variables

### Required Variables

#### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
```

**Purpose**: Same as client application

#### Email Service (Optional for Admin)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Purpose**:
- Admin dashboard can optionally use SMTP for sending manual notifications
- Alternative to SendGrid for admin-specific emails

## Environment Variable Validation

Both applications include environment variable validation at startup:

```typescript
// /client/lib/env-check.ts
// /admin/src/lib/env-check.ts (if exists)

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE'
]

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})
```

## Setup Instructions

### 1. Client Application

```bash
cd client
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 2. Admin Application

```bash
cd admin
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 3. Verify Configuration

Run the development server to verify all environment variables are properly configured:

```bash
npm run dev
```

Check the console for any missing environment variable errors.

## Security Best Practices

### ✅ DO:
- Use `.env.local` for local development
- Use platform-specific environment variable management in production (Vercel, Netlify, etc.)
- Rotate API keys regularly
- Use different keys for development, staging, and production
- Keep service role keys extremely secure (server-side only)

### ❌ DON'T:
- Commit `.env` files to git
- Share API keys in public channels
- Use production keys in development
- Expose service role keys to client-side code
- Hardcode sensitive values in source code

## Troubleshooting

### "Missing required environment variable" Error

**Solution**: Ensure all required variables are set in your `.env.local` file

### Webhook Signature Verification Fails

**Solution**: Verify `WEBHOOK_SECRET` matches the secret configured in ZenoPay dashboard

### Supabase Connection Issues

**Solution**: 
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check that `SUPABASE_ANON_KEY` has proper permissions
3. Ensure RLS policies are configured correctly

### SendGrid Email Not Sending

**Solution**:
1. Verify `SENDGRID_API_KEY` is valid
2. Check SendGrid dashboard for API key permissions
3. Ensure sender email is verified in SendGrid

## Production Deployment

### Vercel Deployment

Add environment variables in Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Set appropriate environment (Production, Preview, Development)

### Netlify Deployment

Add environment variables in Netlify dashboard:
1. Go to Site Settings → Build & Deploy → Environment
2. Add all required variables
3. Redeploy site after adding variables

## Reference

For more information on specific integrations:
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [ZenoPay API Documentation](https://zenopay.co.tz/docs)
- [SendGrid API Keys](https://docs.sendgrid.com/ui/account-and-settings/api-keys)
