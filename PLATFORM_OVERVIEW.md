# TISCO Market Platform Overview

## Executive Summary
TISCO Market is a modern e-commerce platform designed for the Tanzanian market, featuring a customer-facing storefront and comprehensive admin dashboard. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase, the platform provides real-time inventory management, secure payment processing, and seamless user experiences.

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel
- **Email**: SendGrid/Resend (configurable)
- **Payments**: ZenoPay (Tanzania), Stripe (International)

### Application Structure
```
TISCO/
├── client/           # Customer-facing e-commerce application
├── admin/            # Administrative dashboard
├── docs/             # Documentation and SQL migrations
│   └── resources/
│       └── sql/      # Database migration files
└── Guides/           # Deployment, testing, and setup guides
```

## Key Features

### Customer Application (`/client`)
1. **User Management**
   - Clerk authentication integration
   - User profile management
   - Order history tracking
   - Address management

2. **Product Catalog**
   - Advanced search and filtering
   - Category browsing
   - Product image galleries
   - Stock availability indicators
   - Currency conversion (TZS/USD)

3. **Shopping Cart**
   - Real-time cart synchronization
   - Guest cart persistence
   - Automatic user cart merging on login
   - Stock validation

4. **Checkout & Payments**
   - Multiple payment methods
   - Mobile money integration (Tanzania)
   - Office payment option
   - Order confirmation emails

5. **Real-time Features**
   - Live inventory updates
   - Cart synchronization across devices
   - Order status tracking
   - WhatsApp integration

### Admin Dashboard (`/admin`)
1. **Authentication**
   - Secure session-based auth
   - IP allowlist support
   - Rate limiting

2. **Product Management**
   - CRUD operations
   - Bulk updates
   - Image management
   - Stock tracking
   - Category management

3. **Order Management**
   - Order processing workflow
   - Status updates with validation
   - Inventory adjustment on delivery
   - Customer notifications

4. **Analytics & Reporting**
   - Revenue tracking
   - Order analytics
   - User activity monitoring
   - Cart abandonment tracking

5. **Customer Support**
   - Message management
   - Email notifications
   - User management

## Database Schema

### Core Tables
- **users**: Customer profiles synced with Clerk
- **products**: Product catalog with stock management
- **categories**: Product categorization
- **orders**: Order records with status tracking
- **order_items**: Individual items within orders
- **cart_items**: Shopping cart persistence
- **reviews**: Product reviews and ratings
- **email_notifications**: Email queue system
- **payment_sessions**: Payment transaction tracking

### Key Features
- Row Level Security (RLS) policies
- Real-time subscriptions enabled
- Automated stock management functions
- Performance indexes on key columns

## Security Features

### Authentication & Authorization
- Clerk integration for customer auth
- Separate admin authentication system
- Role-based access control
- Session management

### Data Protection
- RLS policies on all tables
- Service role key for admin operations
- Input validation and sanitization
- XSS and SQL injection prevention

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Webhook signature verification
- Environment variable protection

## Real-time Synchronization

### Implementation
- Supabase Realtime for database changes
- Server-Sent Events (SSE) for admin updates
- Optimistic UI updates
- Cache invalidation strategies

### Synchronized Features
1. **Cart Updates**
   - Multi-device cart sync
   - Admin cart monitoring
   - Real-time item updates

2. **Inventory Management**
   - Stock level updates
   - Out-of-stock notifications
   - Low stock warnings

3. **Order Status**
   - Customer order tracking
   - Admin status updates
   - Email notifications

## Email System

### Architecture
- Database-backed email queue
- Template system with HTML emails
- Retry logic for failed sends
- Multiple provider support

### Email Types
- Order confirmations
- Payment notifications
- Status updates
- Cart abandonment
- Contact form replies
- Welcome emails

## Payment Integration

### Supported Methods
1. **Mobile Money** (Tanzania)
   - M-Pesa
   - Tigo Pesa
   - Airtel Money
   - Halo Pesa

2. **Other Methods**
   - Bank transfer
   - Office payment
   - International cards (via Stripe)

### Payment Flow
1. Order creation with pending payment
2. Payment processing via provider
3. Webhook confirmation
4. Order status update
5. Email notification

## Performance Optimizations

### Database
- Efficient indexes on key columns
- Connection pooling
- Query optimization
- Materialized views for analytics

### Application
- Static generation where possible
- Image optimization
- Code splitting
- Edge runtime for API routes
- CDN caching

### Real-time
- Debounced updates
- Selective subscriptions
- Efficient state management

## Deployment Architecture

### Infrastructure
- **Hosting**: Vercel (automatic scaling)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Vercel Edge Network
- **File Storage**: Supabase Storage

### Environments
- Development (local)
- Preview (branch deployments)
- Production (main branch)

### CI/CD
- Automatic deployments via GitHub
- Preview deployments for PRs
- Environment variable management
- Rollback capabilities

## Monitoring & Analytics

### Application Monitoring
- Vercel Analytics
- Error tracking
- Performance metrics
- User behavior tracking

### Business Metrics
- Revenue tracking
- Conversion rates
- Cart abandonment
- Customer lifetime value

## Known Limitations & Future Enhancements

### Current Limitations
1. Email service requires manual integration
2. SMS notifications not implemented
3. Limited payment provider options
4. Basic analytics dashboard

### Planned Enhancements
1. Advanced analytics dashboard
2. Mobile application
3. Multi-vendor support
4. AI-powered recommendations
5. Advanced inventory management
6. Automated marketing campaigns

## Support & Maintenance

### Regular Tasks
- Database backups (automated daily)
- Security updates
- Performance monitoring
- Bug fixes and patches

### Documentation
- Comprehensive deployment guide
- Detailed testing procedures
- Email setup instructions
- API documentation

### Contact
- WhatsApp: +255748624684
- Technical documentation in `/docs`
- Admin access via separate URL

---

**Platform Status**: Production Ready  
**Version**: 1.0  
**Last Updated**: January 2025

## Quick Links
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Testing Guide](TESTING_GUIDE.md) 
- [Email Setup](EMAIL_SETUP_GUIDE.md)
- [Payment Documentation](PAYMENT_FLOW_DOCUMENTATION.md)
