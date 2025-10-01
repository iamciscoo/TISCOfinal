# TISCO Platform Architecture

## Overview

TISCO (TISCOマーケット) is a comprehensive e-commerce platform built for Tanzania and East African markets. It consists of two main applications: a customer-facing marketplace and an admin dashboard, both built with Next.js 15 and sharing a Supabase PostgreSQL backend.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TISCO Platform                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │   Client App    │              │  Admin Dashboard │          │
│  │  (tiscomarket)  │              │    (admin)      │          │
│  │   Next.js 15    │              │   Next.js 15    │          │
│  │   React 19      │              │   React 19      │          │
│  └─────────────────┘              └─────────────────┘          │
│           │                                │                   │
│           └────────────┬───────────────────┘                   │
│                        │                                       │
│              ┌─────────────────┐                               │
│              │   Supabase      │                               │
│              │  PostgreSQL     │                               │
│              │   Database      │                               │
│              └─────────────────┘                               │
│                        │                                       │
│       ┌────────────────┼────────────────┐                     │
│       │                │                │                     │
│ ┌───────────┐  ┌──────────────┐  ┌─────────────┐              │
│ │  ZenoPay  │  │   SendGrid   │  │  WhatsApp   │              │
│ │ (Payments)│  │   (Email)    │  │ Integration │              │
│ └───────────┘  └──────────────┘  └─────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Runtime**: React 19
- **Styling**: TailwindCSS v4 (Client), TailwindCSS v3 (Admin), Radix UI components
- **State Management**: Zustand, React Query (TanStack Query)
- **Authentication**: Supabase Auth with Google OAuth
- **Performance**: Turbopack, optimized bundle (6.83kB homepage)
- **Validation**: Zod v4 (Client), Zod v3 (Admin)

### Backend
- **Database**: Supabase (PostgreSQL)
- **API**: Next.js API routes (Node.js runtime)
- **Authentication**: Supabase Auth + RLS policies
- **Real-time**: Supabase real-time subscriptions

### External Services
- **Payments**: ZenoPay Mobile Money API (Tanzania)
- **Email**: SendGrid for transactional emails
- **Communication**: WhatsApp integration
- **Currency**: Real-time exchange rates (TZS/USD)

### Development & Deployment
- **Language**: TypeScript 5
- **Bundler**: Turbopack (dev), Next.js (production)
- **Linting**: ESLint 9
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (admin dashboard)

## Application Structure

### Client Application (`/client`)
- **Domain**: tiscomarket.store
- **Purpose**: Customer-facing e-commerce marketplace
- **Features**: Product catalog, cart, checkout, user accounts, reviews, service bookings

### Admin Dashboard (`/admin`)
- **Purpose**: Administrative interface for platform management
- **Features**: Order management, product management, user management, analytics, notifications

## Key Features

### E-commerce Core
- **Product Management**: Catalog with categories, pricing, inventory
- **Order Processing**: Cart → Checkout → Payment → Fulfillment
- **User Accounts**: Registration, profiles, order history
- **Reviews & Ratings**: Customer feedback system

### Payments
- **Mobile Money**: ZenoPay integration for Tanzania market
- **Payment Methods**: Mobile Money (M-Pesa, Tigo Pesa, Airtel Money), Pay at Office
- **Webhooks**: Real-time payment status updates with HMAC signature verification
- **Session Management**: Payment sessions with expiration tracking

### Communication
- **Email Templates**: Order confirmations, payment status, newsletters
- **WhatsApp**: Customer support integration
- **Admin Notifications**: Order alerts, system notifications

### Real-time Features
- **Cart Sync**: Real-time cart updates across devices
- **Auth Sync**: Session synchronization
- **Order Updates**: Live order status changes

## Security & Performance

### Security
- **Row Level Security (RLS)**: Database-level access control
- **Environment Variables**: Secure API key management
- **CORS**: Proper cross-origin resource sharing
- **Webhook Verification**: Signed payload validation

### Performance
- **Bundle Optimization**: 81% reduction (37.2kB → 6.83kB)
- **Image Optimization**: Next.js Image component with CDN
- **Caching**: Strategic API response caching
- **Database Optimization**: Indexed queries, batch operations

## Deployment Architecture

Both applications are designed for standalone deployment with:
- **Static Generation**: Pre-rendered pages where possible
- **Server-Side Rendering**: Dynamic content with proper caching
- **API Routes**: Serverless functions for backend logic
- **Edge Optimization**: CDN-friendly headers and caching

## Documentation Structure

- [`DATABASE.md`](./DATABASE.md) - Database schema and relationships
- [`API-ENDPOINTS.md`](./API-ENDPOINTS.md) - Complete API documentation
- [`DEPENDENCIES.md`](./DEPENDENCIES.md) - All dependencies and their purposes
- [`USER-FLOWS.md`](./USER-FLOWS.md) - User journey documentation
- [`AUTHENTICATION.md`](./AUTHENTICATION.md) - Auth system architecture
