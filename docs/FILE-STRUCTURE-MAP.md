# 📁 TISCO File Structure - Complete Map

**Purpose:** Understand where everything lives and what each file does

---

## 🎯 Client Application Structure

```
/client
│
├── 📂 app/                          # Next.js 15 App Router
│   │
│   ├── 📄 page.tsx                  # Homepage (/)
│   ├── 📄 layout.tsx                # Root layout (wraps all pages)
│   ├── 📄 globals.css               # Global styles
│   │
│   ├── 📂 (auth)/                   # Authentication pages
│   │   ├── login/page.tsx           # Login page
│   │   └── register/page.tsx        # Sign-up page
│   │
│   ├── 📂 api/                      # Backend API endpoints
│   │   ├── orders/
│   │   │   └── route.ts             # GET/POST /api/orders
│   │   ├── payments/
│   │   │   ├── sessions/route.ts    # Create payment session
│   │   │   └── webhooks/route.ts    # ⭐ ZenoPay webhooks
│   │   ├── products/
│   │   │   └── route.ts             # Product CRUD
│   │   ├── service-bookings/
│   │   │   └── route.ts             # Service bookings
│   │   └── notifications/
│   │       └── email/route.ts       # Manual email sending
│   │
│   ├── 📂 products/
│   │   ├── page.tsx                 # Product catalog (/products)
│   │   └── [id]/page.tsx            # Product details (/products/123)
│   │
│   ├── 📂 cart/
│   │   └── page.tsx                 # Shopping cart page
│   │
│   ├── 📂 checkout/
│   │   └── page.tsx                 # Checkout page
│   │
│   ├── 📂 orders/
│   │   ├── page.tsx                 # Order history
│   │   └── [id]/page.tsx            # Order details
│   │
│   ├── 📂 services/
│   │   ├── page.tsx                 # Services catalog
│   │   └── [id]/page.tsx            # Service details
│   │
│   └── 📂 auth/
│       ├── callback/page.tsx        # OAuth callback
│       └── reset-callback/page.tsx  # Password reset
│
├── 📂 components/                   # Reusable UI components
│   │
│   ├── 📂 ui/                       # Base UI primitives
│   │   ├── button.tsx               # Button component
│   │   ├── input.tsx                # Input field
│   │   ├── card.tsx                 # Card container
│   │   ├── toast.tsx                # Toast notifications
│   │   ├── dialog.tsx               # Modal dialogs
│   │   └── ...                      # More UI components
│   │
│   ├── 📂 auth/
│   │   ├── AuthModal.tsx            # Login/Register modal
│   │   └── ProfileDialog.tsx        # User profile editor
│   │
│   ├── 📂 products/
│   │   ├── ProductCard.tsx          # Product display card
│   │   ├── ProductGrid.tsx          # Product grid layout
│   │   └── ProductFilters.tsx       # Filter sidebar
│   │
│   ├── 📂 cart/
│   │   ├── CartDrawer.tsx           # Sliding cart panel
│   │   ├── CartItem.tsx             # Single cart item
│   │   └── CartSummary.tsx          # Price summary
│   │
│   ├── 📂 orders/
│   │   ├── OrderCard.tsx            # Order display card
│   │   └── OrderStatus.tsx          # Status badge
│   │
│   ├── Navigation.tsx               # Main navigation bar
│   ├── Footer.tsx                   # Site footer
│   └── LazyImage.tsx                # ⭐ Optimized images
│
├── 📂 lib/                          # Core business logic
│   │
│   ├── 📄 supabase.ts               # ⭐ Database client (browser)
│   ├── 📄 supabase-server.ts        # ⭐ Database client (server)
│   ├── 📄 logger.ts                 # ⭐ Logging system
│   ├── 📄 errors.ts                 # Error handling
│   ├── 📄 email-templates.ts        # ⭐ Email HTML templates
│   │
│   ├── 📂 notifications/
│   │   ├── service.ts               # ⭐ Notification routing
│   │   ├── sendpulse.ts             # ⭐ Email delivery
│   │   └── audit.ts                 # Notification audit logs
│   │
│   └── 📂 utils/
│       ├── formatters.ts            # Format currency, dates
│       └── validators.ts            # Input validation
│
├── 📂 store/                        # Global state (Zustand)
│   │
│   ├── useCartStore.ts              # ⭐ Shopping cart state
│   ├── useAuthStore.ts              # Authentication state
│   └── useUIStore.ts                # UI state (modals, etc.)
│
├── 📂 types/                        # TypeScript definitions
│   ├── database.ts                  # Database table types
│   ├── api.ts                       # API response types
│   └── common.ts                    # Shared types
│
├── 📄 next.config.js                # Next.js configuration
├── 📄 tailwind.config.js            # TailwindCSS config
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 package.json                  # Dependencies
└── 📄 .env.local                    # Environment variables
```

---

## 🔑 Most Important Files (⭐ Stars)

### **1. /app/api/payments/webhooks/route.ts**
**What:** Receives payment notifications from ZenoPay  
**Why Critical:** Creates orders when payment succeeds  
**Touches:** Database, notifications, email system

### **2. /lib/supabase-server.ts**
**What:** Server-side database client  
**Why Critical:** All database queries use this  
**Touches:** Every API route, authentication

### **3. /lib/notifications/service.ts**
**What:** Routes all notifications to recipients  
**Why Critical:** Category filtering, product-specific notifications  
**Touches:** Email system, database, admin notifications

### **4. /store/useCartStore.ts**
**What:** Shopping cart state management  
**Why Critical:** Powers entire shopping experience  
**Touches:** All product pages, checkout

### **5. /lib/logger.ts**
**What:** Centralized logging system  
**Why Critical:** Debugging, monitoring, error tracking  
**Touches:** Every file (recently refactored)

---

## 📊 File Dependencies (Who Uses What)

```
page.tsx (Homepage)
    ↓ imports
ProductCard.tsx
    ↓ imports
useCartStore.ts
    ↓ uses
localStorage (browser)

─────────────────────────────

/api/orders/route.ts
    ↓ imports
supabase-server.ts
    ↓ calls
Supabase Database

─────────────────────────────

/api/payments/webhooks/route.ts
    ↓ imports
notifications/service.ts
    ↓ imports
sendpulse.ts
    ↓ calls
SendPulse API
```

---

## 🎨 Admin Dashboard Structure

```
/admin/src
│
├── 📂 app/                          # Admin pages
│   ├── page.tsx                     # Dashboard home
│   ├── layout.tsx                   # Admin layout
│   │
│   ├── 📂 orders/
│   │   ├── page.tsx                 # All orders
│   │   └── [id]/page.tsx            # Order details
│   │
│   ├── 📂 products/
│   │   ├── page.tsx                 # Product management
│   │   ├── new/page.tsx             # Add new product
│   │   └── [id]/page.tsx            # Edit product
│   │
│   ├── 📂 customers/
│   │   ├── page.tsx                 # Customer list
│   │   └── [id]/page.tsx            # Customer details
│   │
│   ├── 📂 analytics/
│   │   └── page.tsx                 # Sales analytics
│   │
│   ├── 📂 notifications/
│   │   └── page.tsx                 # Admin notification settings
│   │
│   └── 📂 settings/
│       └── page.tsx                 # Platform settings
│
├── 📂 components/                   # Admin UI components
│   ├── Sidebar.tsx                  # Navigation sidebar
│   ├── DataTable.tsx                # Reusable table
│   └── Charts/                      # Analytics charts
│
└── 📂 lib/
    ├── database.ts                  # Admin database queries
    └── types.ts                     # Admin type definitions
```

---

## 📦 Key Configuration Files

### **next.config.js** - Next.js Settings
```javascript
{
  images: { domains: ['...'] },   // Allowed image hosts
  env: { ... },                    // Environment variables
  experimental: { ... }            // Beta features
}
```

### **tailwind.config.js** - Styling Config
```javascript
{
  theme: {
    colors: { ... },               // Custom colors
    spacing: { ... },              // Spacing scale
    screens: { ... }               // Breakpoints
  }
}
```

### **.env.local** - Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=...       # Database URL
SUPABASE_SERVICE_ROLE=...          # Database key
ZENOPAY_API_KEY=...                # Payment API key
SENDPULSE_API_ID=...               # Email API ID
```

---

## 🔄 Data Flow Through Files

### **Example: User Places Order**

```
1. /checkout/page.tsx
   → User clicks "Place Order"
   
2. POST /api/orders/route.ts
   → Validates user
   → Creates order in database
   
3. /lib/supabase-server.ts
   → Inserts into 'orders' table
   → Inserts into 'order_items' table
   
4. /lib/notifications/service.ts
   → Sends confirmation email
   → Notifies admins
   
5. /lib/notifications/sendpulse.ts
   → Delivers email via SendPulse API
   
6. /lib/logger.ts
   → Logs entire flow for debugging
```

---

## 🚫 Files to Potentially Remove

### **Candidates for Cleanup:**

```
❓ /app/test-email-dark-mode.html     # Test file, not needed in production
❓ /components/old-*.tsx               # Check for old versions
❓ /lib/unused-*.ts                    # Check for unused utilities
❓ Unused dependencies in package.json
```

### **How to Check:**
```bash
# Find unused exports
npx ts-prune

# Find unused dependencies
npx depcheck

# Find large files
find . -type f -size +100k -not -path "./node_modules/*"
```

---

## 📈 File Complexity Analysis

### **High Complexity (Need Attention):**
- `/app/api/payments/webhooks/route.ts` - 1000+ lines
- `/lib/email-templates.ts` - 1400+ lines
- `/lib/notifications/service.ts` - 1300+ lines

### **Refactoring Opportunities:**
1. **Split webhook handler** into smaller functions
2. **Extract email templates** into separate files
3. **Modularize notification logic** by event type

---

## 🔍 Import Analysis

### **Most Imported Files (High Impact):**
```
/lib/supabase-server.ts       → 45+ imports
/lib/logger.ts                → 30+ imports
/store/useCartStore.ts        → 20+ imports
/components/ui/button.tsx     → 50+ imports
```

**These files affect many others - changes here have wide impact!**

---

## 📝 File Naming Conventions

```
✅ GOOD:
- ProductCard.tsx             # PascalCase for components
- useCartStore.ts             # camelCase for hooks
- api/orders/route.ts         # kebab-case for routes

❌ AVOID:
- product-card.tsx            # Inconsistent with components
- UseCartStore.ts             # Wrong case for hooks
- API/ORDERS/route.ts         # All caps
```

---

## 🎯 Quick Reference: Find What You Need

**Need to change...**

| What | File Location |
|------|---------------|
| Homepage | `/app/page.tsx` |
| Navigation | `/components/Navigation.tsx` |
| Cart logic | `/store/useCartStore.ts` |
| Database queries | `/lib/supabase-server.ts` |
| Email templates | `/lib/email-templates.ts` |
| Payment processing | `/app/api/payments/webhooks/route.ts` |
| Product display | `/components/products/ProductCard.tsx` |
| Styling | `/app/globals.css` + TailwindCSS |
| Auth | `/lib/supabase-server.ts` |
| Logging | `/lib/logger.ts` |

---

**Next:** Tag any file and I'll explain it in detail! 📂
