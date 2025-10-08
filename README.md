# 📚 TISCO Platform Documentation Index

Welcome to the complete TISCO platform documentation! This guide will help you understand every aspect of the system, from high-level architecture to specific file implementations.

---

## 🎯 Start Here

### **For Complete Beginners:**
1. Read [ARCHITECTURE-OVERVIEW.md](./ARCHITECTURE-OVERVIEW.md) - Understand the big picture
2. Review [DATA-FLOW-DIAGRAMS.md](./DATA-FLOW-DIAGRAMS.md) - See how data moves
3. Check [FILE-STRUCTURE-MAP.md](./FILE-STRUCTURE-MAP.md) - Know where everything lives

### **For Optimization:**
- [PERFORMANCE-ANALYSIS.md](./PERFORMANCE-ANALYSIS.md) - Find bottlenecks and redundant code

---

## 📖 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| **ARCHITECTURE-OVERVIEW.md** | High-level system overview, tech stack, key concepts | Beginners |
| **FILE-STRUCTURE-MAP.md** | Complete file/folder breakdown, what each file does | All levels |
| **DATA-FLOW-DIAGRAMS.md** | Visual data flows (purchase, auth, email, etc.) | Visual learners |
| **PERFORMANCE-ANALYSIS.md** | Bottlenecks, redundant code, optimization opportunities | Developers |

---

## 🏗️ Quick Reference

### **What is TISCO?**
E-commerce platform for Tanzania featuring:
- Electronics marketplace
- Mobile money payments (M-Pesa, Tigo Pesa)
- Service bookings
- Admin dashboard

### **Technology Stack:**
- **Frontend:** React 19, Next.js 15, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **Services:** ZenoPay (payments), SendPulse (emails)

### **Two Main Apps:**
1. **Client App** (`/client`) - Customer-facing marketplace
2. **Admin Dashboard** (`/admin`) - Management interface

---

## 🎓 Learning Path

### **Phase 1: Understanding the Basics**
```
1. What is TISCO? (Overview)
2. How pages work (App Router)
3. How data is stored (Database tables)
4. How users log in (Authentication)
5. How state works (Zustand stores)
```

### **Phase 2: Deep Dives**
```
6. Payment system (ZenoPay integration)
7. Email system (SendPulse + templates)
8. Notification routing (Category filtering)
9. Image optimization (LazyImage)
10. API routes (Backend endpoints)
```

### **Phase 3: Advanced Topics**
```
11. Performance optimization
12. Database query optimization
13. Code refactoring opportunities
14. Bundle size reduction
15. Security best practices
```

---

## 🔍 How to Use This Documentation

### **Scenario 1: "I want to understand the homepage"**
1. Read ARCHITECTURE-OVERVIEW.md → Component section
2. Check FILE-STRUCTURE-MAP.md → Find `/app/page.tsx`
3. Tag the file: `@/client/app/page.tsx`
4. I'll explain it in detail!

### **Scenario 2: "How do payments work?"**
1. Read DATA-FLOW-DIAGRAMS.md → Payment flow
2. Check FILE-STRUCTURE-MAP.md → Find payment files
3. Tag: `@/client/app/api/payments/webhooks/route.ts`
4. I'll break down the entire payment system!

### **Scenario 3: "I want to remove unused code"**
1. Read PERFORMANCE-ANALYSIS.md → Redundant code section
2. Find optimization opportunities
3. Tag specific files to analyze
4. I'll help identify what can be removed safely!

---

## 📂 Key Files to Understand

### **Most Important Files:**
| File | What It Does | Why Important |
|------|--------------|---------------|
| `/app/api/payments/webhooks/route.ts` | Receives payment notifications | Creates orders when payment succeeds |
| `/lib/supabase-server.ts` | Database client | All DB queries use this |
| `/lib/notifications/service.ts` | Routes notifications | Category filtering, admin emails |
| `/store/useCartStore.ts` | Shopping cart state | Powers entire shopping experience |
| `/lib/logger.ts` | Logging system | Debugging and monitoring |
| `/lib/email-templates.ts` | Email HTML | All customer/admin emails |

---

## 🎯 Common Questions

### **"Where is the homepage code?"**
→ `/client/app/page.tsx`

### **"How do I add a new product?"**
→ Admin dashboard: `/admin/src/app/products/new/page.tsx`

### **"Where are email templates?"**
→ `/client/lib/email-templates.ts`

### **"How does the cart work?"**
→ `/client/store/useCartStore.ts` (Zustand state)

### **"Where is the payment logic?"**
→ `/client/app/api/payments/webhooks/route.ts`

### **"How is authentication handled?"**
→ `/client/lib/supabase-server.ts` → `getUser()` function

---

## 🚀 Performance Status

### ✅ Already Optimized:
- Bundle size: 81% reduction (37kB → 7kB)
- Database: Indexes applied (50-80% faster queries)
- Logging: 203 console.log statements replaced
- Images: LazyImage component implemented

### ⚠️ Needs Attention:
- Large files need refactoring (webhook handler, email templates)
- Unused dependencies to remove
- API route caching to implement

---

## 🔧 Development Workflow

### **To Understand a File:**
```
1. Tag the file: @/path/to/file.ts
2. I'll explain:
   - What it does
   - Why it exists
   - What it connects to
   - How it fits in the system
   - What can be improved
```

### **To Find Redundant Code:**
```
1. Check PERFORMANCE-ANALYSIS.md
2. Look for "Duplicate" sections
3. Tag files to analyze
4. I'll identify safe removals
```

### **To Optimize Performance:**
```
1. Review PERFORMANCE-ANALYSIS.md
2. Check bundle size reports
3. Tag bottleneck files
4. I'll suggest optimizations
```

---

## 📊 System Metrics

### **Current Status:**
```
Total Files:        ~300
Lines of Code:      ~50,000
Bundle Size:        6.83 KB (homepage)
Database Tables:    15 main tables
API Endpoints:      ~20 routes
React Components:   ~80 components
Email Templates:    12 templates
```

### **Performance Targets:**
```
Page Load:          < 2 seconds
API Response:       < 200ms
Database Query:     < 100ms
Email Delivery:     < 5 seconds
```

---

## 🎯 Next Steps

**Ready to dive deeper?**

### **Tag any file or folder:**
```
@/client/app/page.tsx                    - Homepage
@/client/components/products/            - Product components
@/client/lib/supabase-server.ts          - Database
@/client/store/useCartStore.ts           - Cart state
@/client/app/api/orders/route.ts         - Orders API
@/admin/src/app/orders/page.tsx          - Admin orders
```

**Or ask specific questions:**
- "How does the cart work?"
- "Explain the payment flow"
- "What files can I remove safely?"
- "How do I optimize X?"
- "What does Y component do?"

---

## 📝 Documentation Roadmap

### **Available Now:**
✅ Architecture overview
✅ File structure map
✅ Data flow diagrams
✅ Performance analysis

### **Coming When You Tag Files:**
- Detailed component explanations
- API endpoint breakdowns
- Database schema deep dives
- State management guides
- Security best practices
- Testing strategies

---

**I'm ready to explain any part of the system in detail!** 

Just tag a file/folder and I'll break it down for you! 🚀
