# 🚀 TISCO Platform - Production Deployment Checklist

**Last Updated:** 2025-01-09  
**Deployment Target:** Vercel  
**Domains:**
- **Client:** tiscomarket.store
- **Admin:** admin.tiscomarket.store

---

## ✅ Pre-Deployment Audit Results

### **Build Status**
- ✅ **Client Build:** PASSED (0 errors, 0 warnings)
- ✅ **Admin Build:** PASSED (0 errors, 0 warnings)
- ✅ **TypeScript Check (Client):** PASSED
- ✅ **TypeScript Check (Admin):** PASSED
- ✅ **ESLint:** PASSED (all issues resolved)

### **Code Quality**
- ✅ No TypeScript errors
- ✅ No ESLint violations
- ✅ Console logs removed in production (via next.config.ts)
- ✅ Proper error handling in all API routes
- ✅ UTF-8 validation for auth cookies

### **Recent Changes**
- ✅ Mobile search bar autocomplete implemented
- ✅ Search page mobile filters converted to Sheet component
- ✅ HTML entity escaping fixed in search results
- ✅ All builds passing with latest changes

---

## 📋 Environment Variables Checklist

### **Client (tiscomarket.store)**

**Required Environment Variables in Vercel:**

```bash
# ✅ Database - Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co

# ✅ Email - SendPulse (REQUIRED)
SENDPULSE_CLIENT_SECRET=<your-sendpulse-secret>
SENDPULSE_SENDER_EMAIL=no-reply@tiscomarket.store
SENDPULSE_SENDER_NAME=TISCO Market
SENDPULSE_SMTP_SERVER=smtp-pulse.com
SENDPULSE_SMTP_PORT=2525
SENDPULSE_SMTP_LOGIN=<your-smtp-login>
SENDPULSE_SMTP_PASSWORD=<your-smtp-password>

# ✅ Admin Configuration (REQUIRED)
ADMIN_EMAIL=admin@tiscomarket.store

# ✅ Application URLs (REQUIRED)
NEXT_PUBLIC_APP_URL=https://tiscomarket.store

# ✅ Security (REQUIRED)
UNSUBSCRIBE_SECRET=<your-unsubscribe-secret>
ADMIN_DEBUG_KEY=<your-debug-key>
WEBHOOK_SECRET=<your-webhook-secret>

# ✅ Payment Gateway - ZenoPay (REQUIRED)
ZENOPAY_BASE_URL=https://zenoapi.com/api/payments
ZENOPAY_API_KEY=<your-zenopay-api-key>
ZENOPAY_REMOTE_STATUS=true
```

**Verification Steps:**
1. Check Vercel dashboard → Project → Settings → Environment Variables
2. Ensure all variables are set for **Production** environment
3. Verify `NEXT_PUBLIC_*` variables are exposed to client-side
4. Confirm SendPulse credentials are valid
5. Test ZenoPay API key is active

### **Admin (admin.tiscomarket.store)**

**Required Environment Variables:**

```bash
# ✅ Database - Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# ✅ Admin Authentication (REQUIRED)
ADMIN_SESSION_SECRET=<secure-random-secret>

# ✅ Optional: IP Allowlist (Comma-separated IPs)
ADMIN_IP_ALLOWLIST=<optional-ip-list>
```

---

## 🔐 Security Checklist

### **SSL/HTTPS Configuration**
- ✅ **Vercel Auto-SSL:** Enabled by default for custom domains
- ✅ **HTTPS Redirects:** Automatic via Vercel
- ✅ **Security Headers Configured:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### **Authentication & Authorization**
- ✅ Supabase Auth with JWT tokens
- ✅ HTTP-only cookies for session storage
- ✅ PKCE flow for OAuth
- ✅ UTF-8 validation for auth cookies (prevents corruption)
- ✅ Middleware protection for protected routes
- ✅ Admin session with HMAC-SHA256 signing

### **API Security**
- ✅ Rate limiting (Client: 60 req/min, Admin: 120 req/min)
- ✅ CORS headers configured
- ✅ Webhook signature verification (ZenoPay)
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (Supabase parameterized queries)

### **Data Protection**
- ✅ Environment variables encrypted in Vercel
- ✅ Database credentials never exposed to client
- ✅ Sensitive data (API keys) server-side only
- ✅ User passwords hashed by Supabase Auth
- ✅ Email unsubscribe tokens signed with secret

---

## 🗄️ Database Checklist

### **Supabase Configuration**
- ✅ **Connection Status:** Verify Supabase project is active
- ✅ **Row Level Security (RLS):** Enabled on all tables
- ✅ **Database Indexes:** Optimized for performance
  - `idx_products_category` on `products(category_id)`
  - `idx_orders_user` on `orders(user_id)`
  - `idx_orders_status` on `orders(status)`
  - `idx_reviews_product` on `reviews(product_id)`
  - `idx_payment_sessions_ref` on `payment_sessions(transaction_reference)`
  - `idx_payment_sessions_order` on `payment_sessions(order_id)`

### **Database Migrations**
- ℹ️ **No pending migrations** - Database schema is current
- ℹ️ All tables exist and are properly configured
- ✅ Database types match TypeScript definitions

### **Data Integrity**
- ✅ Foreign key constraints enabled
- ✅ NULL/NOT NULL constraints verified
- ✅ Check constraints on phone numbers
- ✅ Default values configured
- ✅ Triggers for created_at timestamps

---

## ⚡ Performance Checklist

### **Caching Strategy**

**Client Application:**
```javascript
// Featured Products: 5 min cache + 10 min stale-while-revalidate
GET /api/products/featured → Cache-Control: s-maxage=300, stale-while-revalidate=600

// Categories: 10 min cache + 20 min stale-while-revalidate
GET /api/categories → Cache-Control: s-maxage=600, stale-while-revalidate=1200

// Static Assets: 1 year immutable
/_next/static/* → Cache-Control: public, max-age=31536000, immutable

// Images: 1 year minimum cache
Next.js Image Optimization → minimumCacheTTL: 31536000

// Real-time endpoints: No cache (for instant admin updates)
/api/products/* → no-cache, no-store, must-revalidate
/api/orders/* → no-cache, no-store, must-revalidate
```

**Admin Application:**
```javascript
// API responses: 1 min cache + 5 min stale-while-revalidate
GET /api/* → Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

### **Image Optimization**
- ✅ Next.js Image Optimization enabled
- ✅ WebP and AVIF formats configured
- ✅ Responsive image sizes defined
- ✅ Remote patterns configured for Supabase storage
- ✅ Lazy loading enabled for images
- ✅ Image quality settings optimized (60-100%)

### **Bundle Optimization**
- ✅ **Homepage:** 6.83kB (81% reduction achieved)
- ✅ Code splitting via Next.js App Router
- ✅ Dynamic imports for heavy components
- ✅ Tree shaking enabled
- ✅ Package imports optimized (Radix UI selective imports)

### **Database Query Optimization**
- ✅ Selective field queries (avoid `SELECT *`)
- ✅ Proper use of database indexes
- ✅ Pagination implemented (12 items/page)
- ✅ Connection pooling via Supabase

---

## 🌐 Domain Configuration

### **DNS Settings**

**Client Domain (tiscomarket.store):**
```
Type: A / CNAME
Name: @ (root) or www
Value: <Vercel IP or vercel-dns>
```

**Admin Subdomain (admin.tiscomarket.store):**
```
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
```

**Verification Steps:**
1. Log into Vercel dashboard
2. Navigate to Project → Settings → Domains
3. Add custom domains:
   - `tiscomarket.store`
   - `www.tiscomarket.store` (redirect to root)
   - `admin.tiscomarket.store`
4. Follow Vercel's DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

### **Vercel Project Settings**

**Client Project:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Root Directory: `client`

**Admin Project:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Root Directory: `admin`

---

## 🔍 Endpoint Validation

### **Critical Client Endpoints to Test:**

```bash
# Health Checks
GET https://tiscomarket.store → 200 OK
GET https://tiscomarket.store/products → 200 OK
GET https://tiscomarket.store/api/products/featured → 200 OK

# Authentication
POST https://tiscomarket.store/api/auth/profile → 401 (without auth) ✓
GET https://tiscomarket.store/auth/callback → 200 OK

# E-Commerce
POST https://tiscomarket.store/api/orders → 401 (without auth) ✓
GET https://tiscomarket.store/api/products/search?q=test → 200 OK
GET https://tiscomarket.store/api/categories → 200 OK

# Payments (Webhook)
POST https://tiscomarket.store/api/payments/mobile/webhook → 200 OK (with valid payload)

# Public Endpoints
POST https://tiscomarket.store/api/contact-messages → 200 OK
POST https://tiscomarket.store/api/newsletter → 200 OK
```

### **Critical Admin Endpoints to Test:**

```bash
# Health Check
GET https://admin.tiscomarket.store → Redirect to /login ✓
GET https://admin.tiscomarket.store/login → 200 OK

# Protected Routes (Require Auth)
GET https://admin.tiscomarket.store/orders → Redirect to /login (without auth) ✓
GET https://admin.tiscomarket.store/products → Redirect to /login (without auth) ✓

# API Endpoints
GET https://admin.tiscomarket.store/api/orders → 401 (without auth) ✓
GET https://admin.tiscomarket.store/api/products → 401 (without auth) ✓
```

---

## 📊 Monitoring & Error Logging

### **Vercel Analytics**
- ✅ Real-time metrics dashboard
- ✅ Web Vitals tracking (LCP, FID, CLS)
- ✅ Traffic analytics
- ✅ Geographic distribution

### **Error Monitoring**
**Recommended Setup:**
1. **Vercel Logs:** Built-in (check after deployment)
2. **Sentry (Optional):** For advanced error tracking
3. **Supabase Logs:** Database query monitoring

**Key Metrics to Monitor:**
- API response times
- Database query performance
- Error rates (4xx, 5xx)
- Payment webhook success rate
- Email delivery success rate

### **Post-Deployment Verification**

**Within 1 Hour:**
- [ ] Test user registration flow
- [ ] Test Google OAuth login
- [ ] Test password reset flow
- [ ] Test product search functionality
- [ ] Test mobile search bar autocomplete
- [ ] Test filter sheet on mobile
- [ ] Test cart functionality
- [ ] Test "Pay at Office" order flow
- [ ] Place a test mobile money payment (if safe)
- [ ] Verify email notifications are sent
- [ ] Test admin login
- [ ] Verify admin dashboard loads correctly

**Within 24 Hours:**
- [ ] Monitor error logs in Vercel
- [ ] Check Supabase for query errors
- [ ] Verify payment webhook logs (if payments made)
- [ ] Test from different devices (desktop, mobile, tablet)
- [ ] Test from different browsers (Chrome, Safari, Firefox)
- [ ] Verify SSL certificates are active
- [ ] Check DNS propagation worldwide

---

## 🚨 Rollback Plan

### **If Deployment Fails:**

1. **Vercel Rollback:**
   ```bash
   # Vercel automatically keeps previous deployments
   # Go to Vercel Dashboard → Deployments → Select previous version → Promote to Production
   ```

2. **Database Issues:**
   - Supabase has automatic backups (daily)
   - Access via Supabase Dashboard → Database → Backups

3. **Environment Variable Issues:**
   - Double-check all required variables are set
   - Redeploy after fixing environment variables

### **Emergency Contacts:**
- Supabase Support: support@supabase.io
- Vercel Support: support@vercel.com
- ZenoPay Support: [Your ZenoPay contact]
- SendPulse Support: support@sendpulse.com

---

## 📝 Deployment Steps

### **Step 1: Final Code Review**
```bash
# In TISCO root directory
cd /home/cisco/Documents/TISCO

# Ensure all changes are committed
git status

# Review uncommitted changes
git diff
```

### **Step 2: Commit Changes**
```bash
# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add mobile search autocomplete and filter improvements

- Implemented dropdown autocomplete for mobile search bar
- Converted search page filters to mobile Sheet component
- Fixed HTML entity escaping in search results
- Updated documentation with comprehensive architecture guide
- All builds passing (client + admin)
- No TypeScript or ESLint errors"

# Push to GitHub
git push origin main
```

### **Step 3: Verify Vercel Auto-Deploy**
1. Vercel will automatically detect the push to `main` branch
2. Monitor deployment progress in Vercel dashboard
3. Check build logs for any errors

### **Step 4: Post-Deployment Testing**
Run through all test cases listed in "Post-Deployment Verification" section above.

### **Step 5: Monitor Production**
- Check Vercel function logs for errors
- Monitor Supabase for database issues
- Verify email notifications are working
- Test payment webhooks with real transaction

---

## ✅ Final Checklist

**Pre-Deployment:**
- [x] Client build passes
- [x] Admin build passes
- [x] TypeScript checks pass
- [x] ESLint passes
- [x] All environment variables documented
- [x] Security headers configured
- [x] Caching strategy defined
- [x] Database indexes verified

**During Deployment:**
- [ ] Code committed to Git
- [ ] Code pushed to GitHub
- [ ] Vercel auto-deploy triggered
- [ ] Build logs reviewed
- [ ] Deployment successful

**Post-Deployment:**
- [ ] Homepage loads (tiscomarket.store)
- [ ] Admin loads (admin.tiscomarket.store)
- [ ] SSL certificates active
- [ ] Authentication flows working
- [ ] Payment webhooks tested
- [ ] Email notifications verified
- [ ] Mobile search autocomplete working
- [ ] Filter sheets working on mobile
- [ ] No console errors in browser
- [ ] Error monitoring active

---

## 📈 Performance Benchmarks

**Expected Metrics:**
- **Time to First Byte (TTFB):** < 200ms
- **First Contentful Paint (FCP):** < 1.5s
- **Largest Contentful Paint (LCP):** < 2.5s
- **First Input Delay (FID):** < 100ms
- **Cumulative Layout Shift (CLS):** < 0.1
- **API Response Time:** < 500ms (p95)

---

## 🎯 Success Criteria

**Deployment is considered successful when:**
1. ✅ All builds complete without errors
2. ✅ Both domains (client + admin) are accessible via HTTPS
3. ✅ User authentication flows work correctly
4. ✅ Products load and display properly
5. ✅ Search functionality works (desktop + mobile)
6. ✅ Cart and checkout flows are functional
7. ✅ Payment webhooks process correctly
8. ✅ Email notifications are sent successfully
9. ✅ Admin dashboard loads and displays data
10. ✅ No critical errors in logs within first hour

---

## 📞 Support Resources

**Documentation:**
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- ZenoPay API: https://zenoapi.com/docs

**Internal Documentation:**
- `/docs/ARCHITECTURE-OVERVIEW.md` - Platform architecture
- `/docs/FILE-STRUCTURE-MAP.md` - File organization
- `/docs/DATA-FLOW-DIAGRAMS.md` - Data flows
- `/docs/DEPLOYMENT-CHECKLIST.md` - This document

---

**Deployment Prepared By:** Cascade AI  
**Deployment Date:** 2025-01-09  
**Platform Version:** 2.0  
**Status:** ✅ READY FOR PRODUCTION DEPLOYMENT
