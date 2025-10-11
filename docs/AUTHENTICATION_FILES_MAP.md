# 🔐 TISCO Authentication System - Complete File Map

**Last Updated:** January 10, 2025  
**Platform:** TISCO E-Commerce (Next.js 15 + Supabase Auth)

---

## 📂 Directory Structure Overview

```
client/
├── app/
│   ├── auth/                          # Authentication Pages
│   │   ├── callback/                  # OAuth & Email Verification Callback
│   │   │   └── page.tsx              ✅ OAuth callback handler
│   │   ├── reset-callback/           # Password Reset Callback
│   │   │   └── page.tsx              ✅ Reset token verification
│   │   ├── reset-password/           # Request Password Reset
│   │   │   └── page.tsx              ✅ Request reset link page
│   │   ├── sign-in/                  # Sign In Page
│   │   │   └── page.tsx              ✅ Sign in form page
│   │   └── sign-up/                  # Sign Up Page
│   │       └── page.tsx              ✅ Sign up form page
│   │
│   ├── api/auth/                     # Authentication API Routes
│   │   ├── addresses/                # User Address Management
│   │   │   ├── route.ts             ✅ GET/POST user addresses
│   │   │   └── [id]/route.ts        ✅ PUT/DELETE specific address
│   │   ├── profile/                 # User Profile Management
│   │   │   └── route.ts             ✅ GET/PUT user profile
│   │   └── sync/                    # Auth State Sync
│   │       └── route.ts             ✅ Sync auth state to DB
│   │
│   ├── account/                      # Protected Account Pages
│   │   ├── page.tsx                 🔒 Account dashboard
│   │   ├── orders/page.tsx          🔒 Order history
│   │   └── bookings/page.tsx        🔒 Service bookings
│   │
│   └── checkout/                    # Checkout Flow
│       └── page.tsx                 🔒 Requires auth for payment
│
├── components/
│   ├── auth/                        # Auth UI Components
│   │   ├── AuthGuard.tsx           ✅ Protect pages (shows modal if not logged in)
│   │   ├── AuthModal.tsx           ✅ Sign in/sign up modal (used globally)
│   │   ├── ProfileDialog.tsx       ✅ Complete profile after OAuth/reset
│   │   ├── AuthPageShell.tsx       ✅ Layout for auth pages
│   │   ├── GlobalAuthModalManager.tsx  ✅ Global modal state manager
│   │   ├── SignInButton.tsx        ✅ Trigger auth modal button
│   │   └── UserButton.tsx          ✅ User menu dropdown
│   │
│   ├── AuthSync.tsx                ✅ Sync Supabase auth to public users table
│   ├── AuthDebugger.tsx            🐛 Debug auth state (dev only)
│   ├── PasswordResetRedirectHandler.tsx  ✅ Handle reset links on homepage
│   └── Navbar.tsx                  (uses UserButton for auth state)
│
├── hooks/
│   └── use-auth.tsx                ✅ React hook for auth state
│
├── lib/
│   ├── supabase.ts                 ✅ Client-side Supabase client (browser)
│   ├── supabase-server.ts          ✅ Server-side Supabase client (API routes)
│   ├── supabase-auth.ts            ✅ Supabase auth configuration
│   ├── supabase-factory.ts         ✅ Create Supabase clients
│   └── middleware.ts               (Auth utilities for middleware)
│
├── middleware.ts                   ✅ Edge middleware (route protection)
│
└── app/layout.tsx                  (Wraps app with AuthSync & GlobalAuthModalManager)
```

---

## 🗂️ Complete File List with Descriptions

### **1. Core Authentication Infrastructure**

#### **1.1 Middleware (Route Protection)**

| File | Lines | Purpose |
|------|-------|---------|
| `middleware.ts` | 277 | Edge middleware that runs before every request. Validates Supabase auth cookies, protects API routes, handles session errors. |

**Key Functions:**
- `isPublicRoute()` - Check if route is public
- `middleware()` - Main middleware function
- Cookie validation & UTF-8 error handling
- Automatic cookie cleanup on errors

**Protected Routes:**
```typescript
// Requires authentication:
- /api/orders
- /api/payments/mobile
- /api/service-bookings
- /api/auth/profile
- /api/auth/sync
- /api/auth/addresses
```

---

#### **1.2 Supabase Client Configuration**

| File | Purpose | Usage |
|------|---------|-------|
| `lib/supabase.ts` | Browser-side Supabase client | Components, client-side logic |
| `lib/supabase-server.ts` | Server-side Supabase client | API routes, server components |
| `lib/supabase-auth.ts` | Auth configuration & helpers | Centralized auth setup |
| `lib/supabase-factory.ts` | Client factory functions | Create clients with different configs |

**Example Usage:**
```typescript
// Client-side (components)
import { createClient } from '@/lib/supabase'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Server-side (API routes)
import { getUser } from '@/lib/supabase-server'
const user = await getUser()
```

---

### **2. Authentication Pages (User-Facing)**

#### **2.1 Sign In/Sign Up**

| File | Purpose | Features |
|------|---------|----------|
| `app/auth/sign-in/page.tsx` | Dedicated sign-in page | Email/password, OAuth (Google), redirects |
| `app/auth/sign-up/page.tsx` | Dedicated sign-up page | Email/password, OAuth (Google), validation |

**Note:** Most users interact with `AuthModal` (popup) instead of these pages.

---

#### **2.2 OAuth & Email Verification**

| File | Lines | Purpose |
|------|-------|---------|
| `app/auth/callback/page.tsx` | ~200 | Handles OAuth redirects (Google), email verification, new user detection |

**Flow:**
```
1. Google OAuth → Redirects to /auth/callback?code=...&provider=google
2. Callback page exchanges code for session
3. Checks if new user → Show ProfileDialog
4. Existing user → Redirect to homepage
```

**Key Functions:**
```typescript
- Detect new vs existing OAuth user
- Exchange OAuth code for session
- Profile completion for new users
- Error handling for invalid codes
```

---

#### **2.3 Password Reset**

| File | Lines | Purpose |
|------|-------|---------|
| `app/auth/reset-password/page.tsx` | ~150 | Request password reset (enter email) |
| `app/auth/reset-callback/page.tsx` | ~250 | Verify reset token & show ProfileDialog to set new password |
| `components/PasswordResetRedirectHandler.tsx` | ~120 | Detects reset links on homepage & redirects to reset-callback |

**Flow:**
```
1. User requests reset → Email sent with link
2. User clicks link → Homepage with ?token_hash=...&type=recovery
3. PasswordResetRedirectHandler detects → Redirects to /auth/reset-callback
4. Reset-callback verifies token → Shows ProfileDialog with password fields
5. User sets new password → Redirected to homepage
```

**Supported Formats:**
- Modern PKCE: `token_hash=...&type=recovery`
- Legacy: `access_token=...&refresh_token=...&type=recovery`

---

### **3. Authentication Components**

#### **3.1 Core UI Components**

| Component | Size | Purpose | Usage |
|-----------|------|---------|-------|
| `AuthModal.tsx` | 19KB | Main sign-in/sign-up modal | Global (triggered by SignInButton, AuthGuard) |
| `AuthGuard.tsx` | 2.4KB | Protect pages without auth | Wrap protected page components |
| `ProfileDialog.tsx` | 28KB | Complete profile after OAuth/reset | Auto-shown for new users |
| `UserButton.tsx` | 3.2KB | User menu dropdown (logged in) | Navbar |
| `SignInButton.tsx` | 1.4KB | Trigger auth modal | Navbar, landing pages |

**Example: Using AuthGuard**
```tsx
// app/account/page.tsx
import AuthGuard from '@/components/auth/AuthGuard'

export default function AccountPage() {
  return (
    <AuthGuard requireAuth>
      <div>Protected content here</div>
    </AuthGuard>
  )
}
```

**Example: Trigger AuthModal**
```tsx
import { SignInButton } from '@/components/auth/SignInButton'

<SignInButton />
// Automatically opens AuthModal when clicked
```

---

#### **3.2 Auth State Management**

| Component | Purpose |
|-----------|---------|
| `GlobalAuthModalManager.tsx` | Manages auth modal state globally (open/close) |
| `AuthSync.tsx` | Syncs Supabase auth.users to public.users table on login |
| `AuthDebugger.tsx` | Shows auth state in dev mode (user ID, email, session) |

**AuthSync Flow:**
```
1. User logs in (email, OAuth, etc.)
2. AuthSync detects auth state change
3. Calls /api/auth/sync
4. Creates/updates record in public.users table
5. Links auth.users.id to public.users.auth_user_id
```

**Why AuthSync?**
- Supabase `auth.users` is private (admin-only access)
- `public.users` table stores additional profile data
- Allows querying user data in RLS policies

---

### **4. Authentication API Routes**

#### **4.1 Profile Management**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/profile` | GET | Fetch user profile | ✅ Yes |
| `/api/auth/profile` | PUT | Update user profile | ✅ Yes |

**Example Request:**
```typescript
// Update profile
fetch('/api/auth/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    phone: '0742123456'
  })
})
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "0742123456"
  }
}
```

---

#### **4.2 Address Management**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/addresses` | GET | List user addresses | ✅ Yes |
| `/api/auth/addresses` | POST | Create new address | ✅ Yes |
| `/api/auth/addresses/[id]` | PUT | Update address | ✅ Yes |
| `/api/auth/addresses/[id]` | DELETE | Delete address | ✅ Yes |

**Use Case:** Saved shipping addresses for checkout

---

#### **4.3 Auth State Sync**

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/sync` | POST | Sync auth.users → public.users | ✅ Yes |

**Called by:** `AuthSync.tsx` component

**What it does:**
1. Gets authenticated user from Supabase
2. Checks if user exists in `public.users`
3. Creates or updates user record
4. Syncs email, metadata (name, phone)

---

### **5. React Hooks**

#### **5.1 useAuth Hook**

**File:** `hooks/use-auth.tsx` (55 auth references)

**Purpose:** Central hook for auth state across the app

**Exports:**
```typescript
export function useAuth() {
  return {
    user,           // Current user object
    loading,        // Auth state loading
    signIn,         // Sign in function
    signUp,         // Sign up function
    signOut,        // Sign out function
    updateProfile,  // Update user profile
  }
}
```

**Usage Example:**
```tsx
import { useAuth } from '@/hooks/use-auth'

function MyComponent() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>
  
  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

---

## 🔄 Authentication Flows

### **Flow 1: Email/Password Sign Up**

```
1. User clicks "Sign Up" → AuthModal opens
2. User enters email, password, name
3. AuthModal → POST to Supabase auth.signup()
4. Supabase sends verification email
5. User clicks email link → /auth/callback
6. Callback verifies email → Creates session
7. AuthSync → Syncs to public.users table
8. User redirected to homepage (logged in)
```

**Files Involved:**
- `AuthModal.tsx` - UI
- `lib/supabase.ts` - Supabase client
- `app/auth/callback/page.tsx` - Email verification
- `AuthSync.tsx` - Sync to DB
- `middleware.ts` - Session management

---

### **Flow 2: Google OAuth Sign In**

```
1. User clicks "Continue with Google" → AuthModal
2. AuthModal → Supabase auth.signInWithOAuth({provider: 'google'})
3. Redirects to Google → User authorizes
4. Google redirects back → /auth/callback?code=...&provider=google
5. Callback page exchanges code for session
6. Checks if new user:
   a. NEW → Show ProfileDialog (optional profile completion)
   b. EXISTING → Redirect to homepage
7. AuthSync → Syncs to public.users table
8. User logged in
```

**Files Involved:**
- `AuthModal.tsx` - Trigger OAuth
- `app/auth/callback/page.tsx` - OAuth callback handler
- `components/auth/ProfileDialog.tsx` - Profile completion
- `AuthSync.tsx` - Sync to DB

---

### **Flow 3: Password Reset**

```
1. User clicks "Forgot Password" → AuthModal
2. AuthModal shows email input
3. User enters email → Supabase sends reset email
4. User clicks reset link → Homepage with ?token_hash=...&type=recovery
5. PasswordResetRedirectHandler detects reset params
6. Redirects to /auth/reset-callback
7. Reset-callback verifies token with Supabase
8. Shows ProfileDialog with isPasswordReset={true}
9. User enters new password
10. Password updated → Session created
11. User redirected to homepage (logged in)
```

**Files Involved:**
- `AuthModal.tsx` - Request reset
- `components/PasswordResetRedirectHandler.tsx` - Detect reset link
- `app/auth/reset-callback/page.tsx` - Verify token
- `components/auth/ProfileDialog.tsx` - Set new password

---

### **Flow 4: Protected Page Access**

```
# Scenario: Unauthenticated user tries to access /account

1. User navigates to /account
2. Middleware.ts checks auth:
   a. No session → Allows page load (doesn't block)
3. Page loads → AuthGuard component mounts
4. AuthGuard checks auth:
   a. Not logged in → Opens AuthModal
5. User signs in via modal
6. AuthModal success → Modal closes
7. Page content now visible (user authenticated)
```

**Files Involved:**
- `middleware.ts` - Initial auth check
- `AuthGuard.tsx` - Component-level protection
- `AuthModal.tsx` - Sign in UI
- `GlobalAuthModalManager.tsx` - Modal state

---

## 📋 Database Tables

### **Users Table Schema**

```sql
-- public.users table (stores user profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id),  -- Links to Supabase auth
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT CHECK (char_length(phone) >= 10 OR phone IS NULL),  -- Important constraint!
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_addresses table (saved addresses)
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Tanzania',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical Constraint:**
```sql
-- Phone numbers must be NULL or >= 10 characters
-- NEVER use empty string ''
CHECK (char_length(phone) >= 10 OR phone IS NULL)
```

**Correct Usage:**
```typescript
// ✅ CORRECT
const phone = user.user_metadata?.phone || null

// ❌ WRONG
const phone = user.user_metadata?.phone || ''  // Violates constraint!
```

---

## 🔍 Key Concepts

### **1. Supabase Auth vs Public Users**

**Two User Tables:**

| Table | Purpose | Access |
|-------|---------|--------|
| `auth.users` | Supabase auth (login credentials) | Admin-only |
| `public.users` | Profile data (name, phone, etc.) | Public (RLS protected) |

**Why Both?**
- `auth.users` is private by design (security)
- `public.users` allows RLS policies like:
  ```sql
  -- Allow users to see their own orders
  CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());
  ```

**Sync Mechanism:**
- `AuthSync.tsx` runs on every auth state change
- Calls `/api/auth/sync` to update `public.users`
- Links via `public.users.auth_user_id = auth.users.id`

---

### **2. Session Management**

**How Sessions Work:**

1. **Login** → Supabase creates JWT token
2. **Token Storage** → Stored in cookies:
   - `sb-{project}-auth-token` (access token)
   - `sb-{project}-auth-token-refresh` (refresh token)
3. **Middleware** → Validates token on every request
4. **Expiry** → Access token expires after 1 hour
5. **Refresh** → Refresh token auto-renews access token

**Token Validation (Middleware):**
```typescript
// middleware.ts
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  // Unauthenticated
}
```

---

### **3. OAuth vs Email/Password**

| Aspect | Email/Password | OAuth (Google) |
|--------|----------------|----------------|
| **Password Storage** | Supabase bcrypt hash | No password (Google handles) |
| **Email Verification** | Required (email link) | Auto-verified (trusted provider) |
| **Profile Data** | Manual entry | Auto-populated from Google |
| **Account Linking** | Separate accounts | Can link existing email |
| **Security** | User responsibility | Google security |

---

## 🛠️ Development Tools

### **AuthDebugger Component**

**File:** `components/AuthDebugger.tsx`

**Purpose:** Show current auth state in dev mode

**Shows:**
- User ID
- Email
- Session expiry
- Cookie contents
- Auth errors

**Usage:**
```tsx
// Add to layout for dev debugging
{process.env.NODE_ENV === 'development' && <AuthDebugger />}
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Phone constraint violation"**

**Error:** `violates check constraint "chk_users_phone_length"`

**Cause:** Trying to insert empty string `''` for phone

**Solution:**
```typescript
// ✅ ALWAYS use null for missing phone
const phone = user.user_metadata?.phone || null
```

---

### **Issue 2: "OAuth redirecting to password reset"**

**Error:** Google OAuth users asked to set password

**Cause:** `PasswordResetRedirectHandler` catching OAuth codes

**Solution:** Already fixed - handler now checks for `type=recovery`

**Files:**
- `components/PasswordResetRedirectHandler.tsx` (fixed detection)
- `app/auth/callback/page.tsx` (proper OAuth handling)

---

### **Issue 3: "Session not persisting"**

**Cause:** Cookie corruption or UTF-8 errors

**Solution:** `middleware.ts` auto-clears corrupted cookies

**Debug:**
```typescript
// Check cookies in browser DevTools
// Application → Cookies → Look for sb-*-auth-token
```

---

## 📦 Dependencies

### **Authentication Libraries**

```json
{
  "@supabase/supabase-js": "^2.x.x",     // Main Supabase client
  "@supabase/ssr": "^0.x.x",             // Server-side rendering support
  "@supabase/auth-js": "^2.x.x",         // Auth helpers (auto-installed)
  "next": "^15.x.x"                       // Next.js framework
}
```

### **Environment Variables**

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key  # Server-side only
```

---

## 📖 Documentation

### **Existing Docs**

| File | Location | Purpose |
|------|----------|---------|
| `AUTHENTICATION.md` | `/docs/Document/` | Detailed auth flow documentation |
| `ARCHITECTURE-OVERVIEW.md` | `/docs/` | System architecture |
| `FILE-STRUCTURE-MAP.md` | `/docs/` | Complete file structure |

---

## ✅ Summary

**Total Auth-Related Files: ~30**

**Categories:**
- 🎨 UI Components: 7 files
- 📄 Pages: 5 files
- 🔌 API Routes: 4 files
- 🧰 Utilities/Hooks: 5 files
- ⚙️ Config: 5 files
- 🛡️ Middleware: 1 file

**Key Technologies:**
- Supabase Auth (JWT-based)
- OAuth 2.0 (Google)
- PKCE (Proof Key for Code Exchange)
- Server-side session validation
- Edge middleware (Next.js)

**All authentication flows are production-ready and fully functional!** 🎉
