# Supabase Production Configuration Guide

## Overview
This guide covers configuring your Supabase project for production use with your TISCO platform deployed on Vercel.

## Step 1: Authentication Configuration

### 1.1 Update Site URL
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `hgxvlbpvxbliefqlxzak`
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following URLs:

**Site URL**: `https://your-client-domain.vercel.app`

**Additional Redirect URLs** (add these):
```
https://your-client-domain.vercel.app/auth/callback
https://your-admin-domain.vercel.app/auth/callback
https://your-client-domain.vercel.app
https://your-admin-domain.vercel.app
```

### 1.2 Configure CORS Settings
1. Navigate to **Settings** → **API**
2. In **CORS Configuration**, add your production domains:
```
https://your-client-domain.vercel.app
https://your-admin-domain.vercel.app
```

## Step 2: Database Security

### 2.1 Review RLS Policies
Your existing RLS policies should work for production, but verify:

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 2.2 Verify Service Role Usage
Ensure your admin APIs use the service role key for elevated permissions:
- Admin CRUD operations
- Image uploads
- Order management
- User management

## Step 3: Storage Configuration

### 2.1 Update Storage Policies
1. Navigate to **Storage** → **Policies**
2. Verify bucket policies for production domains
3. Update CORS settings for your storage bucket:

```sql
-- Update storage bucket CORS
UPDATE storage.buckets 
SET cors = '[
  {
    "allowedOrigins": ["https://your-client-domain.vercel.app", "https://your-admin-domain.vercel.app"],
    "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
    "allowedHeaders": ["*"],
    "maxAge": 3600
  }
]'::jsonb
WHERE name = 'product-images';
```

## Step 4: Environment Variables Verification

Your production environment should use these Supabase settings:

### Client App (.env.production):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHZsYnB2eGJsaWVmcWx4emFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjUyMjQsImV4cCI6MjA3MTEwMTIyNH0.ensri-AI6SJRzW279b7j6gifpl3WhPSvU1of8jcXbGs
SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHZsYnB2eGJsaWVmcWx4emFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUyNTIyNCwiZXhwIjoyMDcxMTAxMjI0fQ.r7PTpDtAlRZGACUg4mOX3ryl_Orz8D3DrLJVj_UmwjA
```

### Admin App (.env.production):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHZsYnB2eGJsaWVmcWx4emFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjUyMjQsImV4cCI6MjA3MTEwMTIyNH0.ensri-AI6SJRzW279b7j6gifpl3WhPSvU1of8jcXbGs
SUPABASE_URL=https://hgxvlbpvxbliefqlxzak.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHZsYnB2eGJsaWVmcWx4emFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTUyNTIyNCwiZXhwIjoyMDcxMTAxMjI0fQ.r7PTpDtAlRZGACUg4mOX3ryl_Orz8D3DrLJVj_UmwjA
```

## Step 5: Performance Optimization

### 5.1 Connection Pooling
For production, consider enabling connection pooling:
1. Navigate to **Settings** → **Database**
2. Enable **Connection Pooling** if not already enabled
3. Use pooled connection string for high-traffic scenarios

### 5.2 Database Indexes
Verify critical indexes exist for production performance:

```sql
-- Check existing indexes
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## Step 6: Monitoring and Logging

### 6.1 Enable Logging
1. Navigate to **Logs** → **Settings**
2. Enable relevant log types:
   - API logs
   - Database logs
   - Auth logs
   - Storage logs

### 6.2 Set Up Alerts
Configure alerts for:
- High error rates
- Unusual traffic patterns
- Database performance issues
- Storage quota limits

## Step 7: Backup and Recovery

### 7.1 Automated Backups
Verify automated backups are configured:
1. Navigate to **Settings** → **Database**
2. Check **Backup** settings
3. Ensure daily backups are enabled

### 7.2 Point-in-Time Recovery
For critical production data, consider upgrading to a plan that includes point-in-time recovery.

## Step 8: Security Hardening

### 8.1 API Key Rotation
Plan for regular rotation of:
- Anon key (if compromised)
- Service role key (quarterly)

### 8.2 Database Security
```sql
-- Review and tighten RLS policies
-- Ensure no unnecessary public access
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check for any public tables that shouldn't be
SELECT schemaname, tablename 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

## Step 9: Testing Checklist

After configuration:
- [ ] Client app can read products
- [ ] Client app can create orders
- [ ] Admin app can manage products
- [ ] Admin app can view orders
- [ ] Image uploads work from admin
- [ ] Authentication works on both apps
- [ ] Cart operations persist correctly
- [ ] Real-time features work (if implemented)

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Check allowed origins in Supabase dashboard
2. **Auth Failures**: Verify redirect URLs are correct
3. **Permission Denied**: Check RLS policies and user roles
4. **Image Upload Fails**: Verify storage bucket policies and CORS

### Debug Commands:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check user permissions
SELECT * FROM auth.users LIMIT 5;

-- Check recent errors
SELECT * FROM pg_stat_statements ORDER BY calls DESC LIMIT 10;
```

## Production Checklist

Before going live:
- [ ] All URLs updated in Supabase dashboard
- [ ] CORS configured for production domains
- [ ] RLS policies reviewed and tested
- [ ] Storage policies updated
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured
- [ ] Performance indexes verified
- [ ] Security review completed
