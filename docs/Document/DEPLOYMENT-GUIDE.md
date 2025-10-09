# TISCO Platform Deployment Guide

**Last Updated:** October 9, 2025  
**Version:** 3.1  
**Status:** ✅ Production-Ready - All Critical Issues Resolved

## Overview

This comprehensive guide covers deployment procedures for both the client marketplace and admin dashboard applications. Follow these steps for successful production deployment.

## 🆕 Recent Platform Updates (October 2025)

### Critical Fixes Applied ✅
1. **Email Notification Delivery** - Customers now receive order confirmation emails
2. **Payment Retry System** - Order reuse prevents duplicates
3. **Admin Notification Filtering** - Category-based targeting
4. **Account Email Prioritization** - Uses registered email, not checkout form

### Build Status
- ✅ TypeScript compilation: Clean
- ✅ Lint checks: Passing
- ✅ 53 routes built successfully
- ✅ No console errors or warnings

---

## **Pre-Deployment Checklist**

### ✅ Code Preparation
- [ ] All tests passing (if implemented)
- [ ] Build successful locally (`npm run build`)
- [ ] TypeScript compilation clean
- [ ] ESLint passing (`npm run lint`)
- [ ] No console errors in development
- [ ] Environment variables documented

### ✅ Database Preparation
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] RLS policies enabled and tested
- [ ] Indexes created for performance
- [ ] Backup strategy in place

### ✅ External Services
- [ ] SendGrid account configured
- [ ] ZenoPay API credentials obtained
- [ ] Domain DNS configured
- [ ] SSL certificates ready (handled by platform)

---

## **Deployment Platforms**

### **Option 1: Vercel (Recommended)**

#### Advantages
- ✅ Optimized for Next.js
- ✅ Automatic deployments from Git
- ✅ Edge network for global performance
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ Zero-config SSL

#### Client Application Deployment

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Login to Vercel**
```bash
vercel login
```

**Step 3: Deploy from Client Directory**
```bash
cd /path/to/TISCO/client
vercel
```

**Step 4: Configure Environment Variables**
```bash
# Via Vercel Dashboard or CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE
vercel env add SENDGRID_API_KEY
vercel env add ZENOPAY_API_KEY
vercel env add WEBHOOK_SECRET
```

**Step 5: Configure Production Settings**
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 20.x

**Step 6: Set Custom Domain**
```bash
vercel domains add tiscomarket.store
```

#### Admin Application Deployment

**Step 1: Deploy Admin Dashboard**
```bash
cd /path/to/TISCO/admin
vercel
```

**Step 2: Configure Environment Variables**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
```

**Step 3: Set Custom Domain**
```bash
vercel domains add admin.tiscomarket.store
```

---

### **Option 2: Netlify**

#### Client Application Deployment

**Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

**Step 2: Login to Netlify**
```bash
netlify login
```

**Step 3: Initialize Site**
```bash
cd /path/to/TISCO/client
netlify init
```

**Step 4: Configure Build Settings**
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Functions Directory**: (leave empty for Next.js)

**Step 5: Add Environment Variables**
```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "your-value"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-value"
netlify env:set SUPABASE_SERVICE_ROLE "your-value"
netlify env:set SENDGRID_API_KEY "your-value"
netlify env:set ZENOPAY_API_KEY "your-value"
netlify env:set WEBHOOK_SECRET "your-value"
```

**Step 6: Deploy**
```bash
netlify deploy --prod
```

---

### **Option 3: Self-Hosted (VPS/Cloud)**

#### Requirements
- Ubuntu 22.04 LTS or similar
- Node.js 20.x
- Nginx or Apache
- PM2 for process management
- SSL certificate (Let's Encrypt)

#### Server Setup

**Step 1: Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Step 2: Install PM2**
```bash
sudo npm install -g pm2
```

**Step 3: Clone Repository**
```bash
git clone https://github.com/your-org/tisco.git
cd tisco
```

**Step 4: Setup Client Application**
```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with production values
npm run build
```

**Step 5: Start with PM2**
```bash
pm2 start npm --name "tisco-client" -- start
pm2 save
pm2 startup
```

**Step 6: Configure Nginx**
```nginx
# /etc/nginx/sites-available/tiscomarket.store
server {
    listen 80;
    server_name tiscomarket.store www.tiscomarket.store;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Step 7: Enable Site and Restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/tiscomarket.store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 8: Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tiscomarket.store -d www.tiscomarket.store
```

---

## **Database Setup (Supabase)**

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Choose region (closest to Tanzania: Singapore or Europe)
4. Set strong database password

### Step 2: Apply Database Schema
```sql
-- Run migrations in Supabase SQL Editor
-- See DATABASE.md for complete schema

-- Example: Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email varchar UNIQUE NOT NULL,
  -- ... (see DATABASE.md for full schema)
);
```

### Step 3: Enable Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)
```

### Step 4: Create RLS Policies
```sql
-- Example: Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- See AUTHENTICATION.md for complete policies
```

### Step 5: Create Indexes
```sql
-- Performance indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
-- ... (see DATABASE.md for all indexes)
```

### Step 6: Get API Keys
1. Go to Project Settings → API
2. Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy `service_role` key → `SUPABASE_SERVICE_ROLE` (keep secret!)

---

## **External Service Configuration**

### SendGrid Setup

**Step 1: Create SendGrid Account**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify sender email address
3. Create API key with "Mail Send" permissions

**Step 2: Configure Domain Authentication**
1. Go to Settings → Sender Authentication
2. Authenticate domain (tiscomarket.store)
3. Add DNS records to domain provider

**Step 3: Test Email Sending**
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "noreply@tiscomarket.store"},
    "subject": "Test Email",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'
```

### ZenoPay Setup

**Step 1: Register with ZenoPay**
1. Contact ZenoPay Tanzania
2. Complete merchant registration
3. Obtain API credentials

**Step 2: Configure Webhook**
1. Provide webhook URL: `https://tiscomarket.store/api/payments/webhooks`
2. Obtain webhook secret
3. Test webhook with ZenoPay sandbox

**Step 3: Test Payment Flow**
```bash
# Test payment initiation
curl -X POST https://tiscomarket.store/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": "uuid", "quantity": 1}],
    "phone_number": "+255748123456"
  }'
```

---

## **DNS Configuration**

### Domain Records

**Client Application (tiscomarket.store)**
```
Type    Name    Value                           TTL
A       @       76.76.21.21 (Vercel IP)        3600
CNAME   www     cname.vercel-dns.com           3600
```

**Admin Dashboard (admin.tiscomarket.store)**
```
Type    Name    Value                           TTL
CNAME   admin   cname.vercel-dns.com           3600
```

**Email (SendGrid)**
```
Type    Name                Value                       TTL
CNAME   em1234             u1234.wl.sendgrid.net      3600
CNAME   s1._domainkey      s1.domainkey.u1234.wl...   3600
CNAME   s2._domainkey      s2.domainkey.u1234.wl...   3600
```

---

## **Post-Deployment Verification**

### ✅ Functional Testing

**Client Application**
```bash
# Test homepage
curl https://tiscomarket.store

# Test API endpoints
curl https://tiscomarket.store/api/products

# Test authentication
# (manual browser testing)
```

**Admin Dashboard**
```bash
# Test admin homepage
curl https://admin.tiscomarket.store

# Test admin API
curl https://admin.tiscomarket.store/api/dashboard/revenue
```

### ✅ Performance Testing

**Lighthouse Audit**
```bash
npm install -g lighthouse
lighthouse https://tiscomarket.store --view
```

**Expected Scores**:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

### ✅ Security Testing

**SSL Certificate**
```bash
# Check SSL
curl -vI https://tiscomarket.store 2>&1 | grep -i ssl
```

**Security Headers**
```bash
# Check security headers
curl -I https://tiscomarket.store
```

Expected headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`

---

## **Monitoring & Maintenance**

### Application Monitoring

**Vercel Analytics** (Built-in)
- Real-time traffic monitoring
- Performance metrics
- Error tracking

**Recommended Additional Tools**:
- **Sentry**: Error tracking and monitoring
- **LogRocket**: Session replay and debugging
- **Uptime Robot**: Uptime monitoring

### Database Monitoring

**Supabase Dashboard**
- Database size and usage
- Query performance
- Connection pooling
- Backup status

### Email Monitoring

**SendGrid Dashboard**
- Delivery rates
- Bounce rates
- Spam reports
- Email opens/clicks

---

## **Backup Strategy**

### Database Backups

**Supabase Automatic Backups**
- Daily automatic backups (Pro plan)
- Point-in-time recovery
- Manual backup option

**Manual Backup**
```bash
# Export database
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  > backup_$(date +%Y%m%d).sql
```

### Code Backups

**Git Repository**
- Push to GitHub/GitLab regularly
- Tag releases
- Maintain changelog

---

## **Rollback Procedures**

### Vercel Rollback

**Via Dashboard**
1. Go to Deployments
2. Find previous working deployment
3. Click "Promote to Production"

**Via CLI**
```bash
vercel rollback
```

### Database Rollback

**Supabase Point-in-Time Recovery**
1. Go to Database → Backups
2. Select restore point
3. Create new database from backup
4. Update connection strings

---

## **Scaling Considerations**

### Horizontal Scaling
- Vercel automatically scales serverless functions
- Supabase connection pooling handles concurrent users
- CDN caching reduces server load

### Database Optimization
- Monitor slow queries
- Add indexes as needed
- Enable connection pooling
- Consider read replicas for high traffic

### Cost Optimization
- Monitor Vercel bandwidth usage
- Optimize image sizes
- Enable caching headers
- Use CDN for static assets

---

## **Troubleshooting**

### Build Failures

**Issue**: Build fails on Vercel
**Solution**:
```bash
# Test build locally first
npm run build

# Check build logs on Vercel
vercel logs

# Verify environment variables
vercel env ls
```

### Database Connection Issues

**Issue**: Cannot connect to Supabase
**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check API keys are valid
3. Verify IP allowlist (if enabled)
4. Test connection locally

### Email Delivery Issues

**Issue**: Emails not sending
**Solution**:
1. Verify SendGrid API key
2. Check sender authentication
3. Review SendGrid activity log
4. Test with SendGrid API directly

### Payment Webhook Issues

**Issue**: Webhooks not received
**Solution**:
1. Verify webhook URL is publicly accessible
2. Check webhook secret matches
3. Review ZenoPay webhook logs
4. Test webhook with curl

---

## **Security Best Practices**

### ✅ DO:
- Use environment variables for all secrets
- Enable HTTPS everywhere
- Implement rate limiting
- Regular security audits
- Keep dependencies updated
- Monitor error logs
- Use strong database passwords

### ❌ DON'T:
- Commit `.env` files
- Expose service role keys client-side
- Disable RLS policies
- Use default passwords
- Ignore security warnings
- Skip SSL certificate renewal

---

## **Support & Resources**

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)

### Community
- TISCO GitHub Issues
- Next.js Discord
- Supabase Discord

### Emergency Contacts
- **Platform Issues**: DevOps team
- **Database Issues**: Supabase support
- **Payment Issues**: ZenoPay support
- **Email Issues**: SendGrid support

---

## **Deployment Checklist Summary**

### Pre-Deployment
- [ ] Code tested and building successfully
- [ ] Environment variables documented
- [ ] Database schema applied
- [ ] External services configured

### Deployment
- [ ] Client application deployed
- [ ] Admin dashboard deployed
- [ ] DNS configured
- [ ] SSL certificates active

### Post-Deployment
- [ ] Functional testing complete
- [ ] Performance testing passed
- [ ] Security audit completed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Ongoing
- [ ] Monitor application health
- [ ] Review error logs daily
- [ ] Update dependencies monthly
- [ ] Database backups verified weekly
- [ ] Security patches applied promptly

---

**Deployment Status**: Ready for production with proper configuration and monitoring.

**Estimated Deployment Time**: 2-4 hours for initial setup, 30 minutes for subsequent deployments.

**Recommended Deployment Schedule**: Deploy during low-traffic hours (late evening Tanzania time).
