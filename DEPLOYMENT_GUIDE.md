# TISCO Market - Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying TISCO Market to production using Vercel via GitHub. The platform consists of two applications: the client-facing e-commerce site and the admin dashboard.

## Prerequisites
- GitHub account
- Vercel account (free tier available)
- Supabase project (for database and storage)
- Clerk account (for authentication)
- Domain name (optional, Vercel provides free subdomains)
- Email service provider account (SendGrid, Resend, or AWS SES)
- Payment provider account (Stripe or local provider for Tanzania)

## Repository Structure
```
TISCO/
├── client/                 # Customer-facing e-commerce app
├── admin/                  # Administrative dashboard
├── docs/                   # Documentation and assets
├── DEPLOYMENT_GUIDE.md     # This file
├── PRODUCT_REQUIREMENTS_DOCUMENT.md
└── README.md
```

## Step 1: Repository Setup

### 1.1 Create GitHub Repository
```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - Production ready TISCO Market"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/tisco-market.git
git branch -M main
git push -u origin main
```

### 1.2 Repository Configuration
- Set repository to **Public** or **Private** (your choice)
- Add a comprehensive README.md
- Configure branch protection rules for `main` branch (recommended)

## Step 2: Environment Variables Setup

### 2.1 Client Application Environment Variables
Create `.env.local` in the `client/` directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
ADMIN_API_URL=https://admin.your-domain.com/api

# Optional: Payment Integration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Service (Required for notifications)
SENDGRID_API_KEY=your_sendgrid_key
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=TISCO Market

# Internal API Security
INTERNAL_API_SECRET=generate_a_secure_random_string
CRON_SECRET=generate_another_secure_random_string

# Payment Provider (Already Integrated)
# The platform includes comprehensive payment processing
# Only production credentials needed:
PAYMENT_PROVIDER_API_KEY=your_production_key
PAYMENT_PROVIDER_SECRET=your_production_secret
PAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

### 2.2 Admin Application Environment Variables
Create `.env.local` in the `admin/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your_service_role_key

# Admin Authentication
ADMIN_API_KEY=your_secure_admin_key

# Application URLs
NEXT_PUBLIC_APP_URL=https://admin.your-domain.com
CLIENT_APP_URL=https://your-domain.com

# Optional: Analytics
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

## Step 3: Database Setup

### 3.1 Supabase Project Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Note down your project URL and API keys
3. Run the database migrations:

```sql
-- Run the SQL files in this order from docs/resources/sql/:
-- 1. 01_initial_schema.sql
-- 2. 02_comprehensive_updates.sql
-- 3. 03_stock_functions.sql
-- 4. 04_deals_migration.sql
-- 5. 05_performance_optimization.sql
-- 6. 06_cart_analytics_updates.sql
-- 7. 07_realtime_enable_cart_items.sql
-- 8. 08_email_notifications.sql
```

**Important**: Run each file completely before proceeding to the next.

### 3.2 Row Level Security (RLS) Policies
The database includes comprehensive RLS policies. Ensure they're enabled:
- Products: Public read, admin write
- Users: User-specific access
- Orders: User-specific access
- Cart items: User-specific access
- Reviews: Public read, authenticated write

### 3.3 Storage Buckets
Create the following storage buckets in Supabase:
- `product-images` (public)
- `user-avatars` (public)

## Step 4: Vercel Deployment

### 4.1 Deploy Client Application

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `client` folder as the root directory

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: client
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   - Add all environment variables from Section 2.1
   - Set `NODE_ENV=production`

4. **Domain Configuration**
   - Use Vercel's free subdomain: `your-app.vercel.app`
   - Or configure custom domain: `your-domain.com`

### 4.2 Deploy Admin Application

1. **Create Second Vercel Project**
   - Import the same GitHub repository
   - Select the `admin` folder as the root directory

2. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: admin
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**
   - Add all environment variables from Section 2.2
   - Set `NODE_ENV=production`

4. **Domain Configuration**
   - Use subdomain: `admin.your-domain.com`
   - Or Vercel subdomain: `your-admin.vercel.app`

## Step 5: Post-Deployment Configuration

### 5.1 DNS Configuration (Custom Domain)
If using custom domains, configure DNS:
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

### 5.2 SSL Certificates
Vercel automatically provides SSL certificates for all deployments.

### 5.3 Clerk Configuration
Update Clerk dashboard with production URLs:
- Authorized redirect URLs:
  - `https://your-domain.com/*`
  - `https://your-domain.com/sign-in`
  - `https://your-domain.com/sign-up`
- Webhook endpoints:
  - `https://your-domain.com/api/webhooks/clerk`
- CORS origins:
  - `https://your-domain.com`
  - `https://admin.your-domain.com`
- Enable webhook events:
  - user.created
  - user.updated
  - user.deleted

### 5.4 Supabase Configuration
Update Supabase project settings:
- Site URL: `https://your-domain.com`
- Additional redirect URLs:
  - `https://your-domain.com`
  - `https://admin.your-domain.com`
- Enable Row Level Security (RLS) on all tables
- Configure storage buckets:
  - `product-images` (public)
  - `user-avatars` (public)
- Set up database backups:
  - Enable Point-in-time Recovery
  - Daily backups at 2 AM EAT

## Step 6: Monitoring and Analytics

### 6.1 Vercel Analytics
Enable Vercel Analytics in your project dashboard for:
- Performance monitoring
- User analytics
- Error tracking

### 6.2 Supabase Monitoring
Monitor database performance:
- Query performance
- Connection pooling
- Storage usage

### 6.3 Application Monitoring
Consider integrating:
- Sentry for error tracking
- Google Analytics for user behavior
- Stripe Dashboard for payment monitoring

## Step 7: CI/CD Pipeline

### 7.1 Automatic Deployments
Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and feature branches

### 7.2 Build Optimization
The applications are optimized for production:
- Static generation where possible
- Image optimization
- Code splitting
- Compression

## Step 8: Security Checklist

### 8.1 Environment Variables
- ✅ All secrets stored in Vercel environment variables
- ✅ No hardcoded API keys in code
- ✅ Different keys for development and production

### 8.2 Database Security
- ✅ Row Level Security enabled
- ✅ Service role key secured
- ✅ Database backups enabled

### 8.3 Authentication
- ✅ Clerk production keys configured
- ✅ Secure redirect URLs
- ✅ Admin authentication secured

## Step 9: Performance Optimization

### 9.1 Vercel Edge Network
- Global CDN automatically enabled
- Edge functions for API routes
- Automatic image optimization

### 9.2 Database Optimization
- Connection pooling enabled
- Indexes on frequently queried columns
- Query optimization implemented

## Step 10: Backup and Recovery

### 10.1 Database Backups
Supabase provides:
- Daily automatic backups
- Point-in-time recovery
- Manual backup options

### 10.2 Code Backups
- GitHub repository serves as code backup
- Vercel maintains deployment history
- Consider additional backup strategies

## Step 10.5: Email Service Setup

### Configure Email Provider
1. Follow the [Email Setup Guide](EMAIL_SETUP_GUIDE.md)
2. Set up domain authentication (SPF, DKIM, DMARC)
3. Configure email templates
4. Test email delivery
5. Set up email worker/cron job

## Step 10.6: Payment Integration

### Payment Service Integration (Already Configured)
The platform already includes a comprehensive payment system with the following features:

**Supported Payment Methods:**
- Mobile Money (M-Pesa, Tigo Pesa, Airtel Money, Halo Pesa)
- Bank Transfer
- Office Payment
- Cash on Delivery

**Payment Flow:**
1. Session-based payment processing
2. Real-time payment confirmation via webhooks
3. Automatic order creation after successful payment
4. Email notifications for payment status

**Configuration Status:**
- ✅ Payment API endpoints implemented
- ✅ Webhook handling configured
- ✅ Database schema for payments ready
- ⚠️ Production credentials needed from payment provider

## Step 10.7: Real-time Features Configuration

### Enable Supabase Realtime
1. Go to Supabase Dashboard > Database > Replication
2. Enable replication for:
   - `cart_items` table
   - `orders` table
   - `products` table (for inventory updates)
3. Verify realtime subscriptions are working

## Step 10.8: Performance Optimization

### Vercel Configuration
1. Enable Edge Runtime for API routes where applicable
2. Configure caching headers
3. Set up ISR (Incremental Static Regeneration) for product pages
4. Enable image optimization

### Database Optimization
1. Create indexes (already in migrations)
2. Enable connection pooling in Supabase
3. Set up query performance monitoring

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm install --legacy-peer-deps
npm run build
```

**Environment Variable Issues**
- Ensure all required variables are set
- Check variable names match exactly
- Restart deployments after changes

**Database Connection Issues**
- Verify Supabase URL and keys
- Check RLS policies
- Ensure service role permissions

**Authentication Issues**
- Verify Clerk configuration
- Check redirect URLs
- Ensure production keys are used

### Support Resources
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Clerk Documentation: [clerk.com/docs](https://clerk.com/docs)

## Maintenance

### Regular Tasks
- Monitor application performance
- Update dependencies monthly
- Review security logs
- Backup verification
- Performance optimization

### Scaling Considerations
- Monitor Vercel usage limits
- Consider Supabase Pro for higher traffic
- Implement caching strategies
- Database optimization

---

## Quick Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Supabase project configured with database
- [ ] Clerk authentication set up
- [ ] Environment variables prepared
- [ ] Client app deployed to Vercel
- [ ] Admin app deployed to Vercel
- [ ] Custom domains configured (optional)
- [ ] DNS records updated
- [ ] SSL certificates verified
- [ ] Authentication flows tested
- [ ] Database connections verified
- [ ] Payment integration tested (if enabled)
- [ ] Monitoring and analytics configured

**Estimated Deployment Time**: 30-60 minutes

**Platform Status**: ✅ **PRODUCTION READY**

---

## Production Launch Checklist

### Pre-Launch (1 Week Before)
- [ ] All database migrations applied successfully
- [ ] Email service configured and tested
- [ ] Payment gateway integrated and tested
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Security audit performed
- [ ] Legal pages updated (Terms, Privacy, etc.)

### Launch Day
- [ ] Deploy client application to production
- [ ] Deploy admin application to production
- [ ] Verify all environment variables
- [ ] Test critical user flows
- [ ] Enable email notifications
- [ ] Enable payment processing
- [ ] Monitor error logs
- [ ] Verify real-time features
- [ ] Test mobile responsiveness
- [ ] Announce launch

### Post-Launch (First Week)
- [ ] Monitor performance metrics
- [ ] Review error logs daily
- [ ] Check email delivery rates
- [ ] Monitor payment success rates
- [ ] Gather user feedback
- [ ] Fix critical bugs immediately
- [ ] Update documentation
- [ ] Plan first feature updates

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   ```bash
   # Revert to previous deployment in Vercel
   # Go to Vercel Dashboard > Deployments > Select previous working deployment > Promote to Production
   ```

2. **Database Rollback**
   - Use Supabase point-in-time recovery
   - Restore to pre-deployment backup

3. **Communication**
   - Update status page
   - Notify users via email/social media
   - Document issues for post-mortem

## Support & Resources

### Platform Support
- **WhatsApp Business**: +255748624684
- **Email**: support@tiscomarket.com
- **Admin Access**: https://admin.your-domain.com

### Technical Resources
- **Vercel Status**: [status.vercel.com](https://status.vercel.com)
- **Supabase Status**: [status.supabase.com](https://status.supabase.com)
- **Clerk Status**: [status.clerk.com](https://status.clerk.com)

### Documentation
- [Email Setup Guide](EMAIL_SETUP_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md)
- [Payment Flow Documentation](PAYMENT_FLOW_DOCUMENTATION.md)

---

*Last Updated: January 2025*
*Version: 2.0*
