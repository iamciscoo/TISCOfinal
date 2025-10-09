# Authentication & Authorization Architecture

**Last Updated:** October 9, 2025  
**Version:** 3.1  
**Status:** ✅ All Critical Issues Resolved

## Overview

TISCO uses Supabase Auth as the primary authentication system with Google OAuth support, password-based authentication, and comprehensive password reset functionality. The system implements Row Level Security (RLS) for data access control.

## 🆕 Recent Critical Fixes (October 2025)

### **1. Password Reset Flow Fix** ✅
**Problem**: Users clicking password reset links were redirected to homepage without the reset dialog appearing.

**Solution**:
- Enhanced `PasswordResetRedirectHandler` with PKCE format support (`token_hash`)
- Added legacy token format support (`access_token` + `refresh_token`)
- Fixed OAuth vs password reset detection logic
- Added comprehensive error handling for expired/invalid/used tokens

**Files Modified**:
- `/client/components/PasswordResetRedirectHandler.tsx`
- `/client/app/auth/reset-callback/page.tsx`

### **2. OAuth Flow Fix** ✅
**Problem**: Google OAuth users were incorrectly prompted to set passwords during sign-up.

**Solution**:
- Fixed `PasswordResetRedirectHandler` to properly distinguish OAuth from password reset
- OAuth flows now correctly route to `/auth/callback` instead of `/auth/reset-callback`
- New OAuth users get `ProfileDialog` with `isPasswordReset={false}` (no password required)
- Existing OAuth users redirect directly to homepage

**Files Modified**:
- `/client/components/PasswordResetRedirectHandler.tsx`
- `/client/app/auth/callback/page.tsx`
- `/client/components/auth/ProfileDialog.tsx`

### **3. Mobile UX Improvements** ✅
**Problem**: Auth errors showed as toast popups instead of inline errors, and toast close buttons were hidden on mobile.

**Solution**:
- Auth failures now display inline red alert box within `AuthModal`
- Error automatically clears when user types
- Toast close button changed from `opacity-0` to `opacity-70` on mobile
- Touch-friendly interaction patterns

**Files Modified**:
- `/client/components/auth/AuthModal.tsx`
- `/client/components/ui/toast.tsx`

### **4. Password Validation Enhancement** ✅
**Features Added**:
- Password visibility toggles (eye icons)
- Real-time validation with visual indicators (✓/✗)
- Dynamic validation for: 8+ characters, lowercase, uppercase, numbers
- Password matching indicator
- Color-coded feedback (green=valid, red=invalid)
- Gradient background for password reset sections

**Files Modified**:
- `/client/components/auth/ProfileDialog.tsx`

## Authentication Methods

### 1. Email/Password Authentication
- **Registration**: Email verification required
- **Login**: Email + password combination
- **Password Requirements**: 8+ characters, mixed case, numbers
- **Security**: Passwords hashed with bcrypt

### 2. Google OAuth (Single Sign-On)
- **Provider**: Google OAuth 2.0
- **Flow**: Authorization code flow with PKCE
- **Scopes**: Email, profile information
- **Avatar**: Google profile pictures supported

### 3. Password Reset
- **Method**: Email-based password reset links
- **Security**: Time-limited tokens with PKCE verification
- **UX**: Modern password validation with real-time feedback

## Authentication Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flows                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │   Email/Pass    │    │  Google OAuth   │    │ Password     │ │
│  │  Registration   │    │    Sign-in      │    │   Reset      │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
│           │                       │                      │      │
│           └───────────────────────┼──────────────────────┘      │
│                                   │                             │
│              ┌─────────────────────────────────────┐            │
│              │      PasswordResetRedirectHandler   │            │
│              │    (Homepage Route Detection)       │            │
│              └─────────────────────────────────────┘            │
│                                   │                             │
│        ┌──────────────────────────┼──────────────────────────┐  │
│        │                          │                          │  │
│  ┌───────────────┐         ┌─────────────────┐               │  │
│  │ /auth/callback│         │/auth/reset-     │               │  │
│  │ (OAuth)       │         │callback         │               │  │
│  └───────────────┘         └─────────────────┘               │  │
│        │                          │                          │  │
│        └──────────────────────────┼──────────────────────────┘  │
│                                   │                             │
│              ┌─────────────────────────────────────┐            │
│              │         ProfileDialog               │            │
│              │   (Profile Completion/Password)     │            │
│              └─────────────────────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Client-Side Authentication

### Core Components

#### 1. AuthProvider (`/client/hooks/use-auth.tsx`)
```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: any) => Promise<void>
}
```

**Features**:
- Global authentication state
- Session persistence
- Real-time auth state updates
- Error handling

#### 2. PasswordResetRedirectHandler
**Location**: `/client/components/PasswordResetRedirectHandler.tsx`

**Purpose**: Detect authentication flows on homepage and route appropriately

**Detection Logic**:
```typescript
// Password Reset Detection
const isPasswordReset = searchParams.get('type') === 'recovery' && 
                       (searchParams.get('token_hash') || 
                        hash.includes('access_token'))

// OAuth Detection  
const isOAuth = (searchParams.get('code') || 
                searchParams.get('provider_token') || 
                hash.includes('provider_token')) && 
                !isPasswordReset
```

**Routing**:
- Password Reset → `/auth/reset-callback`
- OAuth → `/auth/callback`
- Regular page view → No redirect

#### 3. Password Reset Flow
**Components**:
- `PasswordResetRedirectHandler` - Homepage detection
- `/auth/reset-callback/page.tsx` - Token verification
- `ProfileDialog` - Password change interface

**Enhanced Features** (Fixed Issues):
- ✅ PKCE format support (`token_hash` parameter)
- ✅ Legacy token format support (`access_token` + `refresh_token`)
- ✅ Proper OAuth vs password reset distinction
- ✅ Comprehensive error handling
- ✅ Mobile-responsive design

**Security**:
- Time-limited tokens
- Single-use tokens
- PKCE verification
- Secure token transmission

#### 4. OAuth Flow
**Google OAuth Configuration**:
```typescript
const signInWithGoogle = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}
```

**Flow Steps**:
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent
3. Google redirects to `/auth/callback`
4. Token exchange and session creation
5. Profile completion if new user
6. Redirect to application

**Fixed Issues**:
- ✅ OAuth users no longer prompted for passwords
- ✅ Proper new vs existing user detection
- ✅ Correct routing (callback vs reset-callback)

### Real-time Authentication Sync

#### AuthSync Component
```typescript
// /client/components/AuthSync.tsx
export default function AuthSync() {
  const { setUser, setSession } = useAuth()
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
}
```

**Purpose**: Synchronize auth state across tabs and devices

## Server-Side Authentication

### Supabase Client Configuration

#### Browser Client
```typescript
// /client/lib/supabase-auth.ts
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### Server Client
```typescript
// /client/lib/supabase-server.ts  
export const createServerClient = () => {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookies().set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### API Route Authentication

#### Protected Route Pattern
```typescript
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Protected logic here
}
```

#### Admin Route Protection
```typescript
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check admin role in users table
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()
    
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

## Database Security (Row Level Security)

### RLS Policies

#### Users Table
```sql
-- Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users  
    FOR UPDATE USING (auth.uid() = id);

-- Admins can read all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

#### Orders Table
```sql
-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all orders  
CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );
```

#### Cart Items Table
```sql
-- Users can manage their own cart
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);
```

### Security Features

#### Phone Number Constraint
```sql
-- Prevents empty string phone numbers and enforces valid length (database constraint)
ALTER TABLE users ADD CONSTRAINT chk_users_phone_length 
CHECK (phone IS NULL OR (length(trim(phone)) >= 8 AND length(trim(phone)) <= 20));
```

**Pattern**: Always use `null` instead of empty strings for phone numbers

#### Data Validation
```typescript
// API routes use Zod for validation
const createUserSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().nullable(), // Null instead of empty string
})
```

## User Profile Management

### ProfileDialog Component
**Location**: `/client/components/auth/ProfileDialog.tsx`

**Features**:
- ✅ Password visibility toggles
- ✅ Real-time password validation
- ✅ Visual validation indicators (✓/✗)
- ✅ Password strength requirements
- ✅ Conditional password fields based on context

**Usage Contexts**:
1. **Password Reset** (`isPasswordReset={true}`)
   - Required password fields
   - Password confirmation required
   - Enhanced validation

2. **OAuth New User** (`isPasswordReset={false}`)
   - Optional password fields
   - Profile completion focus
   - No password requirement

3. **Profile Update**
   - Optional password change
   - Existing profile data
   - Update confirmation

### Password Validation
```typescript
const validations = {
  minLength: password.length >= 8,
  hasLowerCase: /[a-z]/.test(password),
  hasUpperCase: /[A-Z]/.test(password),
  hasNumbers: /\d/.test(password),
  passwordsMatch: password === confirmPassword && password.length > 0
}
```

**Visual Indicators**:
- ✅ Green checkmark for valid requirements
- ❌ Red X for invalid requirements
- 🔒 Lock icon for security messaging

## Session Management

### Session Persistence
- **Storage**: HTTP-only cookies (secure)
- **Duration**: Configurable (default: 7 days)
- **Refresh**: Automatic token refresh
- **Cross-tab**: Real-time sync via AuthSync

### Session Security
- **CSRF Protection**: Same-site cookie attributes
- **XSS Protection**: HTTP-only cookies
- **Secure Transmission**: HTTPS-only in production

## Error Handling & UX

### Authentication Errors
```typescript
interface AuthError {
  message: string
  code: string
  status: number
}

// Specific error handling
switch (error.code) {
  case 'invalid_credentials':
    return 'Invalid email or password'
  case 'email_not_confirmed':
    return 'Please check your email and confirm your account'
  case 'signup_disabled':
    return 'Account registration is currently disabled'
  default:
    return 'An authentication error occurred'
}
```

### User Feedback
- **Loading States**: Skeleton components during auth checks
- **Error Messages**: Inline errors within auth modal (not toast popups) ✅
- **Success Feedback**: Toast notifications for positive actions
- **Mobile-Friendly**: Toast close buttons visible on mobile (70% opacity) ✅
- **Progressive Enhancement**: Works without JavaScript for core flows
- **Real-time Validation**: Instant feedback during password creation ✅

## Admin Authentication

### Admin Dashboard Security
- **Separate Application**: Isolated admin interface
- **Role-based Access**: Database-level role checking
- **Session Isolation**: Independent admin sessions
- **Audit Logging**: Admin action tracking

### Admin Access
**Note**: The current implementation does not have a formal role-based permission system in the database. Admin access is controlled at the application level through:
- Separate admin application with independent authentication
- Service role key usage for privileged operations
- Manual admin user management

**Future Enhancement**: Consider implementing a formal roles table with granular permissions:
```typescript
type AdminRole = 'admin' | 'manager' | 'editor'

interface AdminPermissions {
  orders: 'read' | 'write'
  products: 'read' | 'write'  
  users: 'read' | 'write'
  analytics: boolean
  system: boolean
}
```

This authentication architecture provides secure, user-friendly authentication with modern UX patterns, comprehensive security measures, and robust error handling.
