# TISCO Platform - Complete Architecture Documentation

## 📋 Overview

This repository contains comprehensive documentation for the TISCO (TISCOマーケット) e-commerce platform - a dual-application system serving Tanzania and East African markets with a customer marketplace and admin dashboard.

## 🏗️ Architecture Documentation

### Core Documentation Files

| File | Description |
|------|-------------|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | High-level system architecture and technology stack |
| [`DATABASE.md`](./DATABASE.md) | Complete database schema, relationships, and patterns |
| [`API-ENDPOINTS.md`](./API-ENDPOINTS.md) | Comprehensive API documentation for all endpoints |
| [`DEPENDENCIES.md`](./DEPENDENCIES.md) | Analysis of all dependencies with justification |
| [`AUTHENTICATION.md`](./AUTHENTICATION.md) | Authentication flows and security architecture |
| [`USER-FLOWS.md`](./USER-FLOWS.md) | Step-by-step user journey documentation |
| [`ADDRESS-STORAGE-PATTERN.md`](./ADDRESS-STORAGE-PATTERN.md) | Dual address storage pattern explanation |
| [`DEPLOYMENT-GUIDE.md`](./DEPLOYMENT-GUIDE.md) | Comprehensive deployment procedures |
| [`ENVIRONMENT-VARIABLES.md`](./ENVIRONMENT-VARIABLES.md) | Environment configuration guide |
| `architecturediagram.png` | Visual architecture diagram (PNG image) |

## 🎯 Quick Summary

### System Architecture
- **Client App**: Next.js 15 customer marketplace (tiscomarket.store)
- **Admin Dashboard**: Next.js 15 management interface 
- **Database**: Supabase PostgreSQL with Row Level Security
- **Payments**: ZenoPay Mobile Money API for Tanzania
- **Email**: SendGrid with dark mode compatible templates
- **Real-time**: Supabase subscriptions for cart/auth sync

### Key Metrics
- **Bundle Size**: 81% reduction (37.2kB → 6.83kB homepage)
- **Performance**: Optimized with caching, lazy loading, and CDN
- **Security**: RLS policies, webhook verification, JWT auth
- **Scalability**: Serverless architecture with auto-scaling

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI**: React 19, TailwindCSS v4, Radix UI
- **State**: Zustand, TanStack Query
- **Build**: Turbopack, TypeScript 5

### Backend  
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API routes (Node.js)
- **Auth**: Supabase Auth + Google OAuth
- **Real-time**: Supabase subscriptions

### External Services
- **Payments**: ZenoPay (Tanzania Mobile Money - M-Pesa, Tigo Pesa, Airtel Money)
- **Email**: SendGrid (transactional emails with dark mode support)
- **Support**: WhatsApp integration (direct link, not Business API)
- **Webhook Verification**: Svix library for secure webhook handling

## 📊 Database Schema

### Core Tables
- **users** - Customer accounts with role-based access
- **products** - Product catalog with pricing/inventory
- **categories** - Product categorization
- **orders** - Order management with status tracking  
- **order_items** - Individual order line items
- **cart_items** - Shopping cart with real-time sync
- **reviews** - Product reviews and ratings
- **addresses** - Customer shipping addresses
- **service_bookings** - Custom service requests

### Key Relationships
```
users (1:N) orders (1:N) order_items (N:1) products
users (1:N) cart_items (N:1) products  
users (1:N) reviews (N:1) products
categories (1:N) products
```

## 🔐 Authentication & Security

### Authentication Methods
1. **Email/Password** with enhanced UX validation
2. **Google OAuth** with streamlined onboarding
3. **Password Reset** with PKCE security and modern UI

### Security Features
- **Row Level Security (RLS)** at database level
- **Webhook Signature Verification** for payments
- **JWT Token Management** with auto-refresh
- **Input Validation** with Zod schemas
- **CORS Protection** and secure headers

## 🔄 User Flows

### Customer Journey
1. **Discovery** → Browse products, search, categories
2. **Authentication** → Register/login with email or Google
3. **Shopping** → Add to cart with real-time sync
4. **Checkout** → Choose Mobile Money or Pay at Office
5. **Payment** → ZenoPay integration or office payment
6. **Fulfillment** → Order tracking and notifications

### Admin Workflow  
1. **Dashboard** → Analytics, metrics, recent activity
2. **Order Management** → Process orders, update status
3. **Product Management** → Catalog maintenance
4. **Customer Support** → User management, communications
5. **Analytics** → Revenue tracking, performance metrics

## 🚀 API Architecture

### Client APIs (`/client/app/api/`)
- `/products` - Product catalog and search
- `/orders` - Order creation and management
- `/payments` - ZenoPay integration and webhooks
- `/auth` - Authentication and profile management
- `/cart` - Shopping cart operations
- `/reviews` - Product review system
- `/services` - Service booking system

### Admin APIs (`/admin/src/app/api/`)
- `/analytics` - Dashboard metrics and reports
- `/orders` - Administrative order management
- `/products` - Product catalog administration
- `/users` - Customer account management
- `/notifications` - Communication management

## 🎨 Key Features

### Customer Experience
- **Modern UI/UX** with responsive design
- **Real-time Cart Sync** across devices
- **Multiple Payment Methods** (Mobile Money, Pay at Office)
- **Product Reviews** with purchase verification
- **Service Bookings** for custom tech services
- **WhatsApp Support** integration

### Admin Experience
- **Comprehensive Dashboard** with key metrics
- **Order Processing** with status management
- **Product Management** with inventory tracking
- **Customer Support** tools and communication
- **Analytics & Reporting** for business insights

### Technical Excellence
- **Performance Optimized** bundle and caching
- **Dark Mode Email Templates** cross-client compatible
- **Real-time Synchronization** for cart and auth
- **Comprehensive Error Handling** with user feedback
- **Security Best Practices** throughout the stack

## 🐛 Known Issues & Solutions

Based on the memory of previous fixes:

### ✅ Resolved Issues
1. **Admin Order Display** - Fixed product names showing as IDs
2. **Phone Number Constraints** - Resolved database constraint violations  
3. **Password Reset Flow** - Enhanced PKCE support and error handling
4. **OAuth Authentication** - Fixed Google SSO password prompts
5. **Email Dark Mode** - Comprehensive dark mode email templates
6. **Admin Notifications** - Fixed missing notifications for mobile payments

### 🔧 Architectural Patterns
- **Defensive Coding** for Supabase relation naming conventions
- **Graceful Fallbacks** for missing database fields
- **Null Handling** instead of empty strings for optional fields
- **Comprehensive Validation** with Zod schemas

## 📈 Performance Metrics

### Bundle Optimization
- **Homepage**: 6.83kB (81% reduction)
- **Critical Path**: Optimized with selective imports
- **Image Loading**: Next.js Image with CDN
- **Code Splitting**: Dynamic imports for heavy components

### Caching Strategy
- **API Responses**: Strategic cache headers
- **Static Assets**: CDN with long-term caching
- **Database Queries**: Efficient indexing and batching

## 🚦 Deployment Architecture

### Production Setup
- **Client App**: Vercel/Netlify deployment
- **Admin Dashboard**: Separate deployment
- **Database**: Supabase hosted PostgreSQL
- **CDN**: Global edge network for assets
- **Monitoring**: Error tracking and performance metrics

### Environment Management
- **Development**: Local with Turbopack
- **Staging**: Pre-production testing
- **Production**: Optimized builds with monitoring

---

## 📞 Support & Maintenance

This documentation provides a complete reference for understanding, maintaining, and extending the TISCO platform. Each section contains detailed technical information with code examples and architectural decisions.

For specific implementation details, refer to the individual documentation files linked above.
