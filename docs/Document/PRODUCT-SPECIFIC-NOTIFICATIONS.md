# Product-Specific Admin Notifications

## Overview
This feature allows certain admin recipients to receive email notifications only when orders are created for specific products they're assigned to, instead of receiving all order creation notifications.

## Features

### ✅ Product Assignment
- Admins can be assigned to specific products through a searchable multi-select dropdown
- When products are assigned, the admin will **only** receive order creation notifications for those specific products
- Category-based notifications are automatically disabled when product filters are active

### ✅ Smart Filtering Logic
- **Product Filter Active**: Recipient only gets order notifications for assigned products (overrides categories)
- **No Product Filter**: Uses existing category-based filtering (orders, all, etc.)
- **Fallback System**: Critical notifications still use hardcoded admin emails as backup

### ✅ Audit Logging & Idempotency
- All notification attempts are logged in `notification_audit_logs` table
- Prevents duplicate emails using unique notification keys
- Tracks success/failure status for debugging

### ✅ Accessibility & Mobile Support
- 44px minimum touch targets for mobile devices
- Proper ARIA labels and roles for screen readers
- Keyboard navigation support
- Responsive design for all screen sizes

## Database Schema

### notification_recipients Table
```sql
ALTER TABLE notification_recipients 
ADD COLUMN assigned_product_ids UUID[] DEFAULT NULL;
```

### notification_audit_logs Table
```sql
CREATE TABLE notification_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_key VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    order_id VARCHAR(255),
    customer_email VARCHAR(255),
    notification_data JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);
```

## Usage Instructions

### Setting Up Product-Specific Recipients

1. Navigate to **Admin Panel → Notifications → Admin Recipients**
2. Fill in recipient email and name
3. Select department (optional)
4. **Product-Specific Notifications Section**:
   - Click on the product search dropdown
   - Type to search for products
   - Select one or multiple products
   - Category toggles will be automatically disabled

5. Click "Add / Update Recipient"

### Visual Indicators
- Recipients with product filters show an orange badge: "🔗 X products"
- Recipients with category filters show a gray badge with category names
- Warning message appears when product filters are active

### How Notifications Work

#### For Recipients WITH Product Filters:
```typescript
// Example: Admin assigned to products A, B, C
// Order contains products A, D, E
// → Admin receives notification (product A matches)

// Order contains products D, E, F  
// → Admin does NOT receive notification (no matches)
```

#### For Recipients WITHOUT Product Filters:
```typescript
// Uses existing category-based filtering
// Recipients with "all" → get all notifications
// Recipients with "orders" → get order-related notifications
// Recipients with "payments" → get payment-related notifications
```

## API Changes

### Recipients API (`/api/admin/notifications/recipients`)
```typescript
// POST body now accepts:
{
  email: string
  name?: string
  department?: string
  notification_categories: string[] // Ignored if assigned_product_ids present
  assigned_product_ids?: string[] | null // New field
}

// GET response now includes:
{
  recipients: Array<{
    id: string
    email: string
    name?: string
    is_active: boolean
    department?: string | null
    notification_categories?: string[] | null
    assigned_product_ids?: string[] | null // New field
    created_at: string
  }>
}
```

### Products API (`/api/admin/products`)
```typescript
// GET /api/admin/products?search=query&limit=50
{
  products: Array<{
    id: string
    name: string
    price: string
    image_url?: string | null
  }>
  total: number
  offset: number
  limit: number
}
```

## Implementation Details

### Notification Service Changes
- `notifyAdminOrderCreated()` now accepts `items` array with `product_id` field
- Product filtering logic runs before category filtering
- Audit logging integrated for all notification attempts
- Idempotency prevents duplicate notifications

### UI Components
- `ProductMultiSelect`: Reusable product selection component
- Accessibility compliant with ARIA labels and keyboard navigation
- Mobile-optimized with 44px touch targets
- Loading states and error handling

### Backward Compatibility
- ✅ Existing recipients continue to work with category-based filtering
- ✅ No breaking changes to existing notification flows
- ✅ Fallback systems ensure critical notifications are never missed
- ✅ Optional product filtering - recipients can use categories or products

## Error Handling

### Duplicate Prevention
```typescript
// Unique notification key format:
// "admin_order_created_{order_id}_{recipient_email}"
// Prevents same notification being sent twice
```

### Fallback Logic
1. Primary: Database recipients (with product/category filtering)
2. Secondary: Environment variable `ADMIN_EMAIL`
3. Tertiary: Hardcoded admin emails

### Audit Trail
- All notification attempts logged with status
- Failed notifications include error messages
- Searchable by order ID, recipient email, event type

## Testing Checklist

### ✅ Product Assignment
- [ ] Can search and select products
- [ ] Can remove selected products
- [ ] Category toggles disable when products selected
- [ ] Warning message shows when products active

### ✅ Notification Logic
- [ ] Recipients with matching products receive notifications
- [ ] Recipients without matching products don't receive notifications
- [ ] Recipients without product filters use category logic
- [ ] Fallback emails work when no recipients configured

### ✅ Accessibility
- [ ] Screen reader announces selected products count
- [ ] Keyboard navigation works in dropdown
- [ ] Touch targets are minimum 44px on mobile
- [ ] Remove buttons have descriptive labels

### ✅ Database Integration
- [ ] Product IDs saved correctly as UUID array
- [ ] Audit logs created for each notification attempt
- [ ] Duplicate notifications prevented
- [ ] Error messages logged appropriately

## Troubleshooting

### Product Selection Not Working
1. Check `/api/admin/products` endpoint responds correctly
2. Verify Supabase service role has access to products table
3. Check browser network tab for API errors

### Notifications Not Filtering
1. Verify `assigned_product_ids` field exists in database
2. Check order data includes `items` array with `product_id` fields
3. Review notification service logs for filtering logic

### Duplicate Notifications
1. Check `notification_audit_logs` table for duplicate entries
2. Verify unique notification key generation
3. Review audit service error logs

## Migration Notes

This feature is fully backward compatible. Existing recipients will continue to work with category-based filtering. The product filtering is purely additive and optional.

No action required for existing deployments - the feature will work immediately after deployment with database migrations applied.
