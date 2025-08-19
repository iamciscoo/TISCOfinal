# ⚡ TISCO Market - Quick Start Guide

## 🚀 **GET RUNNING IN 10 MINUTES**

### **Step 1: Clone & Install (2 minutes)**
```bash
# Install dependencies for client shop
cd client/tisco_onlineshop
npm install

# Install dependencies for admin panel
cd ../../admin
npm install
```

### **Step 2: Database Setup (3 minutes)**
1. **Create Supabase Account**: [supabase.com](https://supabase.com)
2. **Create New Project**: Choose a name and password
3. **Get Your Keys**: Go to Settings → API
4. **Run Database Setup**:
   - Open Supabase SQL Editor
   - Copy/paste content from `client/tisco_onlineshop/database_setup.sql`
   - Click "Run"

### **Step 3: Configure Environment (2 minutes)**
```bash
# Client app environment
cd client/tisco_onlineshop
cp env.example .env.local

# Admin app environment  
cd ../../admin
cp .env.example .env.local  # Create this file
```

**Edit both `.env.local` files with your Supabase keys:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### **Step 4: Authentication Setup (2 minutes)**
1. **Create Clerk Account**: [clerk.com](https://clerk.com)
2. **Create Application**: Choose "Next.js"
3. **Copy Keys**: Add to `client/tisco_onlineshop/.env.local`
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
CLERK_SECRET_KEY=sk_test_your-key
```

### **Step 5: Start Applications (1 minute)**
```bash
# Terminal 1 - Client Shop (Port 3000)
cd client/tisco_onlineshop
npm run dev

# Terminal 2 - Admin Panel (Port 3001)
cd admin
npm run dev -- --port 3001
```

## 🎯 **VERIFY EVERYTHING WORKS**

### **Client Shop (localhost:3000)**
- [ ] Homepage loads with hero carousel
- [ ] Products page shows sample products
- [ ] Cart functionality works
- [ ] Sign-in/sign-up redirects to Clerk
- [ ] Search functionality works

### **Admin Panel (localhost:3001)**
- [ ] Login with key: `admin_secret_key_123`
- [ ] Dashboard shows stats and charts
- [ ] Products page displays database products
- [ ] Users/Orders pages load (may be empty initially)

### **Database Connection**
- [ ] Visit `localhost:3000/test-db` to verify connection
- [ ] Should show categories and products from database
- [ ] If errors, check Supabase keys in `.env.local`

## 🚨 **TROUBLESHOOTING**

### **Database Connection Issues**
```bash
# Check if Supabase keys are correct
# Verify RLS policies are enabled
# Ensure database tables exist
```

### **Authentication Issues**
```bash
# Verify Clerk keys in .env.local
# Check Clerk dashboard for application status
# Ensure redirect URLs match your local setup
```

### **Build Issues**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Reinstall dependencies if needed
rm -rf node_modules package-lock.json
npm install
```

## 🎉 **YOU'RE READY WHEN:**
- ✅ Both applications start without errors
- ✅ Database connection test passes
- ✅ You can browse products and add to cart
- ✅ Admin panel shows real database data
- ✅ Authentication redirects work properly

## 🚀 **NEXT STEPS AFTER SETUP**
1. **Add Real Products**: Use admin panel to add your actual products
2. **Configure Payments**: Set up Stripe for payment processing
3. **Customize Branding**: Update logos, colors, and content
4. **Deploy to Production**: Use Vercel for easy deployment
5. **Set up Monitoring**: Add analytics and error tracking

**🎯 Total Setup Time: ~10 minutes**
**🎯 Time to First Sale: ~30 minutes** (with payment setup)

---

**Need help? Check the detailed guides:**
- `SETUP_GUIDE.md` - Complete setup instructions
- `DEPLOYMENT_CHECKLIST.md` - Production deployment guide
- `path.md` - Full development roadmap