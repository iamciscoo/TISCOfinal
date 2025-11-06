# Customer Metrics Implementation

## Overview

This document outlines the comprehensive customer analytics system implemented for the TISCO admin panel. The system tracks user activity, device information, and provides detailed metrics for business intelligence.

## Features Implemented

### 1. Database Schema

#### **user_sessions** Table
Tracks individual user sessions with detailed device and browser information:

- **User Information**
  - `user_id`: Link to users table (nullable for guest sessions)
  - `session_id`: Unique session identifier

- **Device & Browser Data**
  - `device_type`: desktop, tablet, or mobile
  - `os_name` & `os_version`: Operating system details
  - `browser_name` & `browser_version`: Browser details

- **Location & Network**
  - `ip_address`: IP address (INET type)
  - `country` & `city`: Geographic location

- **Session Tracking**
  - `started_at`: Session start timestamp
  - `last_activity_at`: Last activity update
  - `ended_at`: Session end (if explicitly ended)
  - `landing_page`: First page visited
  - `referrer`: Traffic source

#### **user_activity_summary** Table
Aggregated metrics for quick dashboard access:

- `total_sessions`: Count of all user sessions
- `total_orders`: Orders placed by user
- `total_bookings`: Service bookings made
- `last_login_at`: Most recent login
- `primary_device_type`: Most frequently used device
- `primary_browser`: Most frequently used browser
- `primary_os`: Most frequently used OS

### 2. Automated Session Tracking

#### **SessionTracker Component** (`/client/components/SessionTracker.tsx`)
- Automatically tracks every page visit
- Detects device type (desktop/tablet/mobile)
- Captures OS and browser information
- Updates session activity every 5 minutes
- Generates unique session IDs with 30-minute expiry

**Device Detection:**
- Tablet: iPad, Android tablets, PlayBook, Silk
- Mobile: Phones, iPod, mobile browsers
- Desktop: All other devices

**Browser Detection:**
- Firefox, Edge, Chrome, Safari, Opera
- Includes version numbers

**OS Detection:**
- Windows (with version)
- macOS (with version)
- Linux
- Android (with version)
- iOS (with version)

### 3. API Endpoints

#### **Client-Side Analytics API**

**POST `/api/analytics/session`**
- Creates new session record
- Captures device, browser, OS info
- Records IP address and referrer
- Links to user_id if authenticated

**PATCH `/api/analytics/session`**
- Updates `last_activity_at` for existing session
- Called automatically every 5 minutes

#### **Admin Metrics API**

**GET `/api/customers/metrics?interval=daily|weekly|monthly`**

Returns comprehensive metrics including:

```typescript
{
  success: true,
  data: {
    interval: 'weekly',
    statistics: {
      total_users: 150,
      total_sessions: 450,
      unique_users_in_period: 87,
      device_breakdown: { desktop: 200, mobile: 180, tablet: 70 },
      browser_breakdown: { Chrome: 250, Firefox: 100, Safari: 80 },
      os_breakdown: { Windows: 200, iOS: 120, Android: 100 }
    },
    users: [
      {
        id: 'uuid',
        email: 'user@example.com',
        full_name: 'John Doe',
        registered_at: '2024-01-01',
        total_orders: 5,
        total_bookings: 2,
        total_sessions: 15,
        last_login: '2024-01-15',
        primary_device: 'mobile',
        primary_browser: 'Chrome 120',
        primary_os: 'Android 13',
        recent_sessions: [...]
      }
    ]
  }
}
```

### 4. Admin Dashboard

#### **Customer Metrics Page** (`/admin/src/app/customers/metrics/page.tsx`)

**Features:**
- **Interval Selection**: View data for last 24 hours, 7 days, or 30 days
- **Statistics Cards**: 
  - Total Users (registered)
  - Active Users (in period)
  - Total Sessions
  - Orders & Bookings count

**Device/Browser/OS Breakdown:**
- Visual breakdown with badges
- Sorted by usage frequency
- Icons for different device types

**User Activity Table:**
- Sortable columns
- Expandable rows for detailed session info
- Shows:
  - User details (name, email, phone)
  - Registration date
  - Order and booking counts
  - Session frequency
  - Last login time
  - Primary device/browser/OS

**Session Details (Expandable):**
- Last 5 sessions per user
- Device type with icon
- Browser and OS versions
- Location (city/country)
- IP address
- Session timestamp

### 5. Integration

#### **Added to Client Layout** (`/client/app/layout.tsx`)
```tsx
<SessionTracker />
```

#### **Added to Admin Sidebar** (`/admin/src/components/AppSidebar.tsx`)
```tsx
<SidebarMenuItem>
  <SidebarMenuButton asChild tooltip="Customer Metrics">
    <Link href="/customers/metrics">
      <TrendingUp />
      <span>Customer Metrics</span>
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

## Database Functions & Triggers

### **update_user_activity_summary()**
Automatically updates user_activity_summary when new sessions are created:
- Increments total_sessions count
- Updates last_login_at timestamp
- Creates summary record if doesn't exist

**Trigger:** `trigger_update_user_activity_summary`
- Fires AFTER INSERT on user_sessions
- Ensures real-time summary updates

## Security & Privacy

### Row Level Security (RLS)
- Users can only view their own sessions
- Service role has full access for admin operations
- Policies prevent unauthorized access

### Data Protection
- IP addresses stored securely
- Location data derived from IP (no GPS tracking)
- Guest sessions supported (user_id can be NULL)

## Performance Optimizations

### Indexes Created
```sql
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX idx_user_sessions_device_type ON user_sessions(device_type);
CREATE INDEX idx_user_activity_summary_user_id ON user_activity_summary(user_id);
CREATE INDEX idx_user_activity_summary_last_login ON user_activity_summary(last_login_at DESC);
```

### Query Optimizations
- Aggregated data in user_activity_summary for fast dashboard loads
- Limited result sets (default 100 users)
- Indexed timestamp columns for interval queries
- Debounced session updates (5-minute intervals)

## Usage Examples

### Admin Workflow
1. Navigate to "Customers" → "Customer Metrics" in admin sidebar
2. Select time interval (Daily/Weekly/Monthly)
3. View aggregate statistics in cards
4. Review device/browser/OS breakdowns
5. Click "Details" on any user to see:
   - Recent session history
   - Device patterns
   - Geographic data
   - Login frequency

### Metrics Available
- **Sign-in Frequency**: Daily, weekly, monthly active users
- **Total Registered Users**: Complete user count
- **Orders per User**: Track customer purchase behavior
- **Bookings per User**: Service booking patterns
- **Device Preferences**: Desktop vs mobile vs tablet usage
- **Browser Stats**: Most popular browsers
- **OS Distribution**: Operating system breakdown
- **Location Data**: Country and city information
- **Session Duration**: Started and last activity timestamps

## Future Enhancements

Potential additions:
1. **Session Duration Analytics**: Calculate average session length
2. **Page View Tracking**: Track most visited pages per user
3. **Conversion Funnels**: Track user journey from visit to purchase
4. **Cohort Analysis**: Group users by registration date
5. **Retention Metrics**: Track returning vs new users
6. **Geographic Heatmaps**: Visual representation of user locations
7. **Export Functionality**: CSV/Excel export of metrics
8. **Automated Reports**: Scheduled email reports for admins

## Migration Details

**Migration Name**: `create_user_analytics_tables`

**Created Tables**:
- `user_sessions`
- `user_activity_summary`

**Created Functions**:
- `update_user_activity_summary()`

**Created Triggers**:
- `trigger_update_user_activity_summary`

**Created Policies**:
- User self-access policies
- Service role full access policies

## Files Created/Modified

### New Files
1. `/client/app/api/analytics/session/route.ts` - Session tracking API
2. `/client/components/SessionTracker.tsx` - Client-side tracker
3. `/admin/src/app/api/customers/metrics/route.ts` - Admin metrics API
4. `/admin/src/app/customers/metrics/page.tsx` - Metrics dashboard UI

### Modified Files
1. `/client/app/layout.tsx` - Added SessionTracker component
2. `/admin/src/components/AppSidebar.tsx` - Added metrics navigation link

## Testing

To verify the implementation:

1. **Client-Side Tracking**:
   - Visit any page on client
   - Check browser DevTools Network tab for POST to `/api/analytics/session`
   - Verify session updates every 5 minutes

2. **Database**:
   ```sql
   SELECT * FROM user_sessions ORDER BY started_at DESC LIMIT 10;
   SELECT * FROM user_activity_summary;
   ```

3. **Admin Dashboard**:
   - Navigate to `/customers/metrics`
   - Verify statistics cards display correctly
   - Test interval selector (daily/weekly/monthly)
   - Expand user rows to view session details

## Maintenance

### Database Cleanup
Consider implementing a cleanup job to archive old sessions:
```sql
-- Archive sessions older than 90 days
DELETE FROM user_sessions 
WHERE started_at < NOW() - INTERVAL '90 days';
```

### Monitoring
- Monitor table sizes (user_sessions can grow large)
- Check index usage for optimization
- Review query performance for large datasets

## Support

For questions or issues, refer to:
- Supabase documentation for RLS and triggers
- Next.js documentation for API routes
- Lucide React icons for additional icons
