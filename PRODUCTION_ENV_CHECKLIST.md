# TISCO Production Environment Variables Checklist

## Required Environment Variables for tiscomarket.store

### ✅ Client Application (NEXT.js)

#### **Database (Supabase) - REQUIRED**
```
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Payment Gateway (ZenoPay) - REQUIRED**
```
ZENOPAY_API_KEY=your_zenopay_api_key_here
ZENOPAY_BASE_URL=https://zenoapi.com/api/payments
ZENOPAY_REMOTE_STATUS=true
WEBHOOK_SECRET=your_webhook_secret_for_hmac_verification
```

#### **Email Notifications (SendPulse) - REQUIRED**
```
SENDPULSE_CLIENT_ID=your_sendpulse_client_id
SENDPULSE_CLIENT_SECRET=your_sendpulse_client_secret  
SENDPULSE_SENDER_EMAIL=info@tiscomarket.store
SENDPULSE_SENDER_NAME=TISCO Market
SENDPULSE_SMTP_SERVER=smtp-pulse.com
SENDPULSE_SMTP_PORT=2525
```

#### **Domain Configuration - REQUIRED**
```
NEXT_PUBLIC_BASE_URL=https://tiscomarket.store
SITE_URL=https://tiscomarket.store
NEXT_PUBLIC_SITE_URL=https://tiscomarket.store
VERCEL_URL=tiscomarket.store (automatically set by Vercel)
```

#### **Admin Configuration - REQUIRED**
```
ADMIN_EMAIL=francisjacob08@gmail.com,info@tiscomarket.store
```

### ✅ Admin Dashboard (admin.tiscomarket.store)

#### **Database (Same as client)**
```
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ Security Requirements

### SSL/HTTPS Configuration
- **Client Domain**: `https://tiscomarket.store` (with www redirect)
- **Admin Domain**: `https://admin.tiscomarket.store`
- **SSL Certificate**: Managed by Vercel (automatic)
- **HSTS**: Enabled via Vercel headers

### API Security
- All environment variables containing keys/secrets must be server-side only
- `NEXT_PUBLIC_*` variables are client-side visible - only use for non-sensitive data
- Webhook signatures must be verified using `WEBHOOK_SECRET`

## 🔍 Environment Validation

The platform includes built-in environment validation:
- `/client/lib/env-check.ts` - validates required environment variables
- Graceful fallbacks for non-critical variables
- Error logging for missing required variables

## 🚀 Deployment Configuration

### Vercel Configuration
1. Set all environment variables in Vercel dashboard
2. Configure domains: `tiscomarket.store` → client, `admin.tiscomarket.store` → admin
3. Enable Edge Runtime for optimal performance
4. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js Version: 18.x

### Database Configuration (Supabase)
- Row Level Security (RLS) enabled on all tables
- Service role key for server-side operations
- Anonymous key for client-side operations
- CORS configured for `tiscomarket.store` and `admin.tiscomarket.store`

### Payment Integration (ZenoPay)
- Webhook URL: `https://tiscomarket.store/api/payments/webhooks`
- Supported providers: Tigo Pesa, M-Pesa, Airtel Money, Halopesa
- Currency: TZS (Tanzanian Shilling)
- HMAC signature verification enabled

## ✅ Production Readiness Checklist

- [✅] Environment variables configured
- [✅] SSL certificates active
- [✅] Database connections tested
- [✅] Payment gateway configured
- [✅] Email notifications working
- [✅] Domain routing correct
- [✅] Build processes successful
- [✅] TypeScript errors resolved
- [✅] Authentication flows tested

## 🔧 Monitoring & Maintenance

### Required Monitoring
- Supabase database metrics
- Vercel deployment logs  
- ZenoPay transaction logs
- SendPulse email delivery rates
- Error tracking via console logs

### Regular Maintenance
- Monitor SSL certificate renewal (automatic via Vercel)
- Update dependency versions monthly
- Review database performance metrics
- Test payment flows regularly
- Monitor email deliverability rates
