# TISCO Market - Complete Testing Guide
## Client to Admin Functionality Verification

This document provides comprehensive testing scenarios to verify all functionality from the client application to the admin panel.

---

## 🚀 Pre-Testing Setup

### Environment Requirements
- **Client App**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3001` 
- **Database**: Supabase connection active
- **Authentication**: Clerk service running
- **Email Service**: Mock or real email service configured
- **Payment Provider**: Test mode enabled

### Test Data Prerequisites
- At least 2-3 test products in database
- Test user accounts (both regular and admin)
- Sample categories and images
- Test payment credentials
- Email notification templates configured

### Running the Applications

```bash
# Terminal 1 - Client App
cd client
npm install
npm run dev

# Terminal 2 - Admin Panel
cd admin
npm install
npm run dev
```

---

## 📱 CLIENT APPLICATION TESTING

### 1. Authentication & User Management

#### 1.1 User Registration/Login
- [ ] Visit `/sign-up` - verify registration form works
- [ ] Complete registration with valid email
- [ ] Check email verification process
- [ ] Login with created credentials at `/sign-in`
- [ ] Verify user profile appears in navbar
- [ ] Test logout functionality

#### 1.2 User Profile Management
- [ ] Navigate to `/account` page
- [ ] Update user profile information
- [ ] Add/edit shipping addresses
- [ ] Verify changes persist after refresh

### 2. Product Browsing & Search

#### 2.1 Homepage Functionality
- [ ] Verify homepage loads at `/`
- [ ] Check hero carousel navigation
- [ ] Verify featured products display
- [ ] Test promotional cards links
- [ ] Confirm brand slider works
- [ ] Validate services preview section

#### 2.2 Product Catalog
- [ ] Navigate to `/products` page
- [ ] Test search functionality with keywords
- [ ] Apply category filters
- [ ] Test price range filters
- [ ] Verify pagination works
- [ ] Test sort options (price, name, popularity)

#### 2.3 Product Details
- [ ] Click on any product card
- [ ] Verify product images gallery works
- [ ] Check product information display
- [ ] Test quantity selector
- [ ] Verify "Add to Cart" functionality
- [ ] Check related products section
- [ ] Test product reviews (if available)

### 3. Shopping Cart & Checkout

#### 3.1 Cart Management
- [ ] Add multiple products to cart
- [ ] Open cart sidebar (click cart icon)
- [ ] Modify quantities in cart
- [ ] Remove items from cart
- [ ] Verify cart totals calculation
- [ ] Test cart persistence (refresh page)

#### 3.2 Checkout Process
- [ ] Navigate to `/checkout` with items in cart
- [ ] Fill shipping information
- [ ] Select payment method
- [ ] Review order summary
- [ ] Complete order placement
- [ ] Verify order confirmation page
- [ ] Check order appears in `/account/orders`

### 4. Order Management

#### 4.1 Order History
- [ ] Visit `/account/orders`
- [ ] Verify all placed orders appear
- [ ] Click on order details
- [ ] Check order status display
- [ ] Test order filtering/search

#### 4.2 Order Modifications
- [ ] Try updating shipping address (pending orders)
- [ ] Test order cancellation (if allowed)
- [ ] Verify order status updates

### 5. Additional Features

#### 5.1 About Page
- [ ] Navigate to `/about`
- [ ] Verify "Founded in 2025" badge displays
- [ ] Check mission statement content
- [ ] Confirm neutral color scheme
- [ ] Test responsive design on mobile

#### 5.2 WhatsApp Integration
- [ ] Verify WhatsApp button appears bottom-right
- [ ] Hover over button to see tooltip
- [ ] Click button - should open WhatsApp with number `255748624684`
- [ ] Test on mobile and desktop
- [ ] Confirm button doesn't interfere with other UI elements

#### 5.3 Currency & Localization
- [ ] Test currency switching (if implemented)
- [ ] Verify price formatting
- [ ] Check responsive design on different screen sizes

---

## 🔧 ADMIN PANEL TESTING

### 1. Admin Authentication
- [ ] Access admin panel (separate URL/subdomain)
- [ ] Login with admin credentials
- [ ] Verify admin dashboard loads
- [ ] Check admin navigation menu

### 2. Product Management

#### 2.1 Product CRUD Operations
- [ ] Navigate to Products section
- [ ] **Create**: Add new product with details
  - [ ] Upload product images
  - [ ] Set categories
  - [ ] Configure pricing
  - [ ] Set stock quantities
- [ ] **Read**: View products list
  - [ ] Search products
  - [ ] Filter by category/status
- [ ] **Update**: Edit existing product
  - [ ] Modify product details
  - [ ] Update images
  - [ ] Change stock levels
- [ ] **Delete**: Remove test product

#### 2.2 Product Images Management
- [ ] Upload multiple images for product
- [ ] Set main product image
- [ ] Reorder product images
- [ ] Delete individual images

### 3. Order Management

#### 3.1 Order Processing
- [ ] View orders dashboard
- [ ] Check order details from client purchases
- [ ] Update order status
- [ ] Process order fulfillment
- [ ] Handle order cancellations

#### 3.2 Order Analytics
- [ ] View order statistics
- [ ] Check revenue reports
- [ ] Monitor order trends

### 4. User Management

#### 4.1 Customer Management
- [ ] View registered users list
- [ ] Search for specific users
- [ ] View user order history
- [ ] Update user information (if needed)

### 5. Category Management
- [ ] Create new product categories
- [ ] Edit existing categories
- [ ] Delete unused categories
- [ ] Verify category hierarchy

### 6. Inventory Management
- [ ] Monitor stock levels
- [ ] Update inventory quantities
- [ ] Set low stock alerts
- [ ] Track inventory changes

---

## 🔄 INTEGRATION TESTING

### 1. Real-time Synchronization Testing

#### 1.1 Cart Real-time Updates
- [ ] Open client in two browser windows with same user
- [ ] Add item to cart in window 1
- [ ] Verify cart updates in window 2 within 2 seconds
- [ ] Modify quantity in window 2
- [ ] Verify update appears in window 1
- [ ] Open admin cart management
- [ ] Verify admin sees real-time cart changes

#### 1.2 Inventory Real-time Updates
- [ ] Open product page in client
- [ ] Open same product in admin
- [ ] Reduce stock to 5 in admin
- [ ] Verify "Low Stock" indicator appears on client
- [ ] Set stock to 0 in admin
- [ ] Verify "Out of Stock" appears on client immediately
- [ ] Verify "Add to Cart" button is disabled

### 2. Client-Admin Data Sync

#### 1.1 Product Updates
- [ ] Update product in admin panel
- [ ] Verify changes appear on client immediately
- [ ] Test product availability updates
- [ ] Check price changes reflection

#### 1.2 Order Flow Sync
- [ ] Place order on client
- [ ] Verify order appears in admin panel
- [ ] Update order status in admin
- [ ] Check status updates on client account

#### 1.3 Inventory Sync
- [ ] Reduce stock in admin
- [ ] Verify stock levels on client product pages
- [ ] Test out-of-stock scenarios
- [ ] Check stock updates after orders

### 2. Real-time Features
- [ ] Test cart synchronization across devices
- [ ] Verify real-time stock updates
- [ ] Check live order status updates

---

## 🐛 ERROR HANDLING TESTING

### 1. Client Error Scenarios
- [ ] Test with invalid product IDs
- [ ] Try checkout with empty cart
- [ ] Test network disconnection scenarios
- [ ] Verify error messages are user-friendly

### 2. Admin Error Scenarios
- [ ] Try uploading invalid file formats
- [ ] Test with missing required fields
- [ ] Verify permission restrictions
- [ ] Check data validation errors

### 3. Database Error Handling
- [ ] Test with database connection issues
- [ ] Verify graceful degradation
- [ ] Check error logging

---

## 📊 PERFORMANCE TESTING

### 1. Load Testing
- [ ] Test with multiple products in cart
- [ ] Check page load times
- [ ] Verify image loading performance
- [ ] Test with large product catalogs

### 2. Mobile Performance
- [ ] Test on various mobile devices
- [ ] Check touch interactions
- [ ] Verify responsive layouts
- [ ] Test mobile-specific features

---

## ✅ SECURITY TESTING

### 1. Authentication Security
- [ ] Test unauthorized access attempts
- [ ] Verify session management
- [ ] Check password security requirements
- [ ] Test logout functionality

### 2. Data Security
- [ ] Verify user data isolation
- [ ] Test SQL injection prevention
- [ ] Check XSS protection
- [ ] Verify HTTPS enforcement

---

## 🔐 AUTHENTICATION TESTING

### 1. Clerk Integration
- [ ] Sign up with new email
- [ ] Verify email confirmation works
- [ ] Check user appears in Supabase users table
- [ ] Sign out and sign back in
- [ ] Test "Forgot Password" flow
- [ ] Verify session persistence
- [ ] Test OAuth providers (if configured)

### 2. Role-based Access
- [ ] Regular user cannot access admin panel
- [ ] Admin user can access both client and admin
- [ ] API endpoints respect authentication
- [ ] Unauthorized requests return 401

---

## 📧 EMAIL NOTIFICATION TESTING

### 1. Email Templates
- [ ] Order confirmation sent on order placement
- [ ] Payment success notification delivered
- [ ] Order status updates trigger emails
- [ ] Contact form replies sent correctly
- [ ] All email templates render properly
- [ ] Unsubscribe links work (if applicable)

### 2. Email Queue
- [ ] Check email_notifications table populates
- [ ] Verify retry logic for failed emails
- [ ] Test email scheduling functionality
- [ ] Monitor email delivery rates

---

## 💳 PAYMENT TESTING

### 1. Payment Flow
- [ ] Test mobile money integration
- [ ] Verify payment webhooks process
- [ ] Check payment status updates
- [ ] Test failed payment handling
- [ ] Verify refund process (if applicable)

### 2. Payment Security
- [ ] SSL/HTTPS enforced on checkout
- [ ] Sensitive data not logged
- [ ] Payment tokens properly handled
- [ ] PCI compliance maintained

---

## 🚀 PERFORMANCE TESTING

### 1. Page Load Times
- [ ] Homepage loads < 3 seconds
- [ ] Product pages load < 2 seconds
- [ ] Search results appear < 1 second
- [ ] Images optimized and lazy loaded

### 2. Database Performance
- [ ] Complex queries execute < 100ms
- [ ] Indexes properly utilized
- [ ] No N+1 query problems
- [ ] Connection pooling working

### 3. Stress Testing
- [ ] Add 50+ items to cart
- [ ] Search with 1000+ products
- [ ] Handle 10 concurrent orders
- [ ] Test with slow network (3G)

---

## 🔍 SEO & ACCESSIBILITY TESTING

### 1. SEO Checklist
- [ ] Meta tags present on all pages
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Structured data implemented
- [ ] Open Graph tags working

### 2. Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Alt text on all images
- [ ] ARIA labels proper

---

## 📱 MOBILE TESTING

### Device Testing Matrix
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet

### Mobile-Specific Features
- [ ] Touch gestures work
- [ ] WhatsApp button accessible
- [ ] Payment forms mobile-friendly
- [ ] Images sized appropriately

---

## 🛡️ SECURITY TESTING CHECKLIST

### 1. Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attacks prevented
- [ ] CSRF protection active
- [ ] File upload restrictions enforced

### 2. Authentication Security
- [ ] Passwords properly hashed
- [ ] Session hijacking prevented
- [ ] Rate limiting on login
- [ ] Secure password requirements

### 3. API Security
- [ ] All endpoints authenticated
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Sensitive data encrypted

---

## 🐛 REGRESSION TESTING

Before each deployment:
- [ ] Run full test suite
- [ ] Check critical user paths
- [ ] Verify no features broken
- [ ] Test database migrations
- [ ] Confirm integrations working

---

## 📝 TEST RESULTS TEMPLATE

### Test Session Information
- **Date**: ___________
- **Tester**: ___________
- **Environment**: ___________
- **Browser/Device**: ___________

### Summary
- **Total Tests**: ___________
- **Passed**: ___________
- **Failed**: ___________
- **Blocked**: ___________

### Critical Issues Found
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations
1. ________________________________
2. ________________________________
3. ________________________________

---

## 🚨 CRITICAL TEST PRIORITIES

### Must Test First (High Priority)
1. User authentication flow
2. Product display and cart functionality
3. Order placement and processing
4. Admin product management
5. WhatsApp integration

### Secondary Testing (Medium Priority)
1. Advanced search and filtering
2. Multi-image product galleries
3. Order status updates
4. Admin analytics

### Nice to Have Testing (Low Priority)
1. Performance optimization
2. Advanced error scenarios
3. Edge case handling

---

## 📞 SUPPORT CONTACTS

- **WhatsApp Business**: +255748624684
- **Test Issues**: Document in this file
- **Critical Bugs**: Immediate escalation required

---

*Last Updated: January 2025*
*Version: 2.0*

---

## 🔧 AUTOMATED TESTING SETUP

### End-to-End Testing with Playwright

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install

# Create test file: tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  // Navigate to site
  await page.goto('http://localhost:3000')
  
  // Add product to cart
  await page.click('text=Add to Cart')
  
  // Go to checkout
  await page.click('text=Checkout')
  
  // Fill shipping info
  await page.fill('[name="firstName"]', 'Test')
  await page.fill('[name="lastName"]', 'User')
  
  // Complete order
  await page.click('text=Place Order')
  
  // Verify success
  await expect(page).toHaveURL(/\/order-confirmation/)
})

# Run tests
npx playwright test
```

### API Testing with Jest

```typescript
// tests/api/orders.test.ts
import { createMocks } from 'node-mocks-http'

describe('/api/orders', () => {
  test('creates order successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        items: [{ product_id: '123', quantity: 1, price: 100 }],
        shipping_address: 'Test Address',
      },
    })
    
    await handler(req, res)
    
    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toHaveProperty('order_id')
  })
})
```

---

## 📊 TEST METRICS & REPORTING

### Key Metrics to Track
1. **Test Coverage**: Aim for >80%
2. **Test Execution Time**: < 10 minutes for full suite
3. **Flaky Test Rate**: < 5%
4. **Bug Escape Rate**: < 2%

### Reporting Tools
- Playwright HTML Reporter
- Jest Coverage Reports
- Custom Dashboard (optional)

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```
