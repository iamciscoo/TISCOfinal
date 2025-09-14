# Environment Variables Update Guide

## Critical Environment Variable Changes

Your TISCO platform has been refactored to use standardized environment variable names. **You must update your production environment variables** to prevent deployment failures.

## Required Changes

### 1. Standardized Variable Names

| Old Variable Name | New Variable Name | Used In |
|-------------------|-------------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SERVICE_ROLE` | All server-side API routes |
| Various inconsistent names | `SUPABASE_SERVICE_ROLE` | Standardized across platform |

### 2. Environment Files to Update

#### Client Application (`/client`)
```bash
# .env.local
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

#### Admin Application (`/admin`)
```bash
# .env.local
# .env.production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_admin_clerk_key
CLERK_SECRET_KEY=your_admin_clerk_secret
```

### 3. Deployment Platform Updates

#### Vercel
1. Go to your project settings
2. Navigate to Environment Variables
3. Update/add these variables:
   - `SUPABASE_SERVICE_ROLE` (replace any old variants)
   - Ensure all other variables match the standardized names

#### Netlify
1. Go to Site settings > Environment variables
2. Update/add the standardized variable names
3. Remove any old variable names to avoid conflicts

#### Other Platforms
Update your deployment configuration to use the standardized variable names listed above.

## Verification Steps

After updating your environment variables:

1. **Test Newsletter API**: `POST /api/newsletter` should work without errors
2. **Test Cart API**: `GET /api/cart` should return user cart data
3. **Check Admin Panel**: Newsletter management should load properly
4. **Monitor Logs**: Look for any "Missing environment variable" errors

## Files Updated in This Refactor

The following files now use the standardized `SUPABASE_SERVICE_ROLE` variable:

- `client/app/api/newsletter/route.ts`
- `admin/src/app/api/newsletter/route.ts`
- All cart API endpoints
- All product API endpoints
- All order API endpoints
- Authentication routes
- Payment processing routes

## Rollback Plan

If you encounter issues, you can temporarily add both old and new variable names:

```bash
# Temporary compatibility
SUPABASE_SERVICE_ROLE=your_service_role_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Remove after verification
```

## Support

If you encounter deployment issues after updating environment variables:

1. Check deployment logs for specific error messages
2. Verify all variable names match exactly (case-sensitive)
3. Ensure no typos in variable values
4. Test locally first with updated `.env.local` files

---

**⚠️ IMPORTANT**: Update your production environment variables **before** your next deployment to avoid service interruptions.
