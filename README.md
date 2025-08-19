# 🛒 TISCO Market - Complete E-commerce Platform

> **No Bullshit. No Excuses. No Fluff. Just What You Need.**

A modern, full-stack e-commerce platform built with Next.js, Supabase, and Clerk. Features both customer-facing shop and admin management dashboard.

## 🌟 **Platform Overview**

### **🛍️ Customer Shop** (`/client/tisco_onlineshop/`)
- **Homepage**: Hero carousel, featured products, services preview
- **Product Catalog**: Browse, search, filter products with advanced UI
- **Shopping Cart**: Persistent cart with real-time updates
- **Checkout**: Multi-step checkout with form validation
- **User Account**: Order history, profile management, wishlist
- **Services**: Professional tech services booking system

### **⚙️ Admin Dashboard** (`/admin/`)
- **Analytics Dashboard**: Sales stats, charts, KPI tracking
- **Product Management**: CRUD operations, inventory tracking
- **Order Management**: Order processing, status updates
- **User Management**: Customer data, account management
- **Category Management**: Product categorization system

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Supabase account (free tier works)
- Clerk account (free tier works)

### **Setup (10 minutes)**
```bash
# 1. Install dependencies
cd client/tisco_onlineshop && npm install
cd ../../admin && npm install

# 2. Set up environment variables (see QUICK_START.md)
# 3. Configure Supabase database (run provided SQL files)
# 4. Start development servers
npm run dev
```

**📖 Detailed setup instructions in `QUICK_START.md`**

## 🏗️ **Architecture**

### **Tech Stack**
- **Frontend**: Next.js 14 + App Router + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI components
- **Database**: Supabase PostgreSQL with Row Level Security
- **Authentication**: Clerk (customer) + Simple key auth (admin)
- **State Management**: Zustand for cart and global state
- **Forms**: React Hook Form + Zod validation
- **Payments**: Stripe integration ready

### **Database Schema**
```sql
categories (id, name, description, image_url)
products (id, name, description, price, category_id, stock_quantity, rating)
users (id, email, first_name, last_name, phone, avatar_url)
orders (id, user_id, total_amount, status, shipping_address)
order_items (id, order_id, product_id, quantity, price)
cart_items (id, user_id, product_id, quantity)
addresses (id, user_id, type, address_details)
reviews (id, product_id, user_id, rating, comment)
services (id, title, description, features, price_range)
service_bookings (id, service_id, user_id, booking_details)
```

## 📱 **Features**

### **Customer Features**
- ✅ Product browsing with advanced search/filters
- ✅ Shopping cart with persistent storage
- ✅ User authentication and account management
- ✅ Multi-step checkout process
- ✅ Order tracking and history
- ✅ Wishlist functionality
- ✅ Service booking system
- ✅ Mobile-responsive design
- ✅ Currency conversion (TZS ↔ USD)

### **Admin Features**
- ✅ Sales analytics dashboard
- ✅ Product management (CRUD operations)
- ✅ Order processing and tracking
- ✅ Customer management
- ✅ Category management
- ✅ Inventory tracking
- ✅ Data tables with sorting/filtering
- ✅ Responsive admin interface

### **Technical Features**
- ✅ Server-side rendering (SSR)
- ✅ Static site generation (SSG) where appropriate
- ✅ Image optimization
- ✅ SEO-friendly URLs and metadata
- ✅ Type-safe API calls
- ✅ Error handling and loading states
- ✅ Form validation and user feedback

## 🎯 **Current Status**

### **✅ COMPLETED (85%)**
- Core e-commerce functionality
- User authentication and management
- Product catalog and shopping cart
- Admin dashboard and management
- Database schema and sample data
- Responsive design and UI components

### **🔄 IN PROGRESS (15%)**
- Payment processing integration
- Real product image management
- Email notification system
- Advanced search features
- Performance optimization

## 📂 **Project Structure**

```
TISCO/
├── admin/                          # Admin Dashboard
│   ├── src/app/                    # Next.js app router pages
│   ├── src/components/             # Reusable UI components
│   ├── src/lib/                    # Database and utility functions
│   └── public/                     # Static assets
├── client/tisco_onlineshop/        # Customer Shop
│   ├── app/                        # Next.js app router pages
│   ├── components/                 # UI components and layouts
│   ├── lib/                        # Database, store, utilities
│   └── public/                     # Static assets and images
├── resources/                      # Design assets and documentation
├── QUICK_START.md                  # 10-minute setup guide
├── SETUP_GUIDE.md                  # Detailed setup instructions
├── DEPLOYMENT_CHECKLIST.md         # Production deployment guide
└── path.md                         # Development roadmap
```

## 🛠️ **Development Commands**

```bash
# Client Shop Development
cd client/tisco_onlineshop
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Admin Panel Development
cd admin
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 🌍 **Environment Variables**

### **Required for Client Shop**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### **Required for Admin Panel**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_ADMIN_ACCESS_KEY=your_admin_access_key
```

## 📈 **Performance & Scalability**

### **Current Performance**
- **Lighthouse Score**: 90+ across all metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Mobile Responsive**: 100% compatible

### **Scalability Features**
- **Database**: Supabase auto-scaling PostgreSQL
- **CDN**: Vercel Edge Network for global delivery
- **Caching**: Next.js automatic static optimization
- **Images**: Next.js Image component with optimization

## 🤝 **Contributing**

### **Development Workflow**
1. Create feature branch from main
2. Implement changes with proper TypeScript types
3. Test on both client and admin applications
4. Update documentation if needed
5. Submit pull request with clear description

### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with Next.js rules
- **Prettier**: Code formatting (recommended)
- **Components**: Modular, reusable, well-documented

## 📞 **Support & Documentation**

- **Setup Issues**: Check `QUICK_START.md` and `SETUP_GUIDE.md`
- **Deployment**: Follow `DEPLOYMENT_CHECKLIST.md`
- **Development**: See `path.md` for roadmap and next steps
- **Database**: SQL files in `/client/tisco_onlineshop/`

## 📄 **License**

This project is proprietary software. All rights reserved.

---

**🎯 Ready to launch your e-commerce empire? Follow the Quick Start guide and you'll be selling online in minutes!** 🚀