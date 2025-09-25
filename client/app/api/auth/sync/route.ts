import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getUser } from '@/lib/supabase-server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read JSON body ONCE and reuse
    type GuestItem = { id: string; quantity: number }
    type Payload = {
      action?: 'sync_profile' | 'merge_guest_data' | 'cleanup_session'
      guest_cart?: GuestItem[]
      guest_cart_items?: GuestItem[]
    }
    const payload: Payload = await req.json().catch(() => ({} as Payload))
    const { action } = payload

    switch (action) {
      case 'sync_profile':
        // Normalize names from social login metadata
        const meta = user.user_metadata || {}
        const fullName: string = meta.full_name || meta.name || ''
        const given: string = meta.given_name || ''
        const family: string = meta.family_name || ''
        let firstName: string = meta.first_name || given || ''
        let lastName: string = meta.last_name || family || ''
        if (!firstName && fullName) {
          const parts = fullName.trim().split(/\s+/)
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
        }
        const avatarUrl: string | null = meta.avatar_url || meta.picture || null

        // If auth metadata lacks normalized names, update via Admin API (service role)
        try {
          const needFirst = !!firstName && meta.first_name !== firstName
          const needLast = !!lastName && meta.last_name !== lastName
          const needAvatar = !!avatarUrl && meta.avatar_url !== avatarUrl
          if (needFirst || needLast || needAvatar) {
            const { error: adminErr } = await supabase.auth.admin.updateUserById(user.id, {
              user_metadata: {
                ...meta,
                ...(needFirst ? { first_name: firstName } : {}),
                ...(needLast ? { last_name: lastName } : {}),
                ...(needAvatar ? { avatar_url: avatarUrl } : {}),
              }
            })
            if (adminErr) {
              console.warn('Auth admin metadata update failed:', adminErr)
            }
          }
        } catch (e) {
          console.warn('Auth admin update exception:', e)
        }

        // Sync Supabase user data to users table with normalized names
        const { data: userProfile, error } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            auth_user_id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            is_verified: user.email_confirmed_at ? true : false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'auth_user_id' })
          .select()
          .single()
        
        if (error) {
          console.error('Error upserting user profile:', error)
          return NextResponse.json({ error: 'Failed to sync user profile' }, { status: 500 })
        }
        
        if (!userProfile) {
          return NextResponse.json({ error: 'Failed to sync user profile' }, { status: 500 })
        }

        return NextResponse.json({ 
          message: 'User profile synced',
          user: userProfile 
        }, { status: 200 })

      case 'merge_guest_data':
        // Merge guest cart and other data when user logs in
        const guestCart = Array.isArray(payload?.guest_cart)
          ? payload.guest_cart
          : Array.isArray(payload?.guest_cart_items)
            ? payload.guest_cart_items
            : []

        if (guestCart && guestCart.length > 0) {
          // Use the existing guest cart conversion API - use local origin for internal calls
          const url = `${req.nextUrl.origin}/api/cart/guest`
          const cookieStore = await cookies()
          const conversionResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Forward cookies to preserve auth context
              Cookie: cookieStore.toString(),
            },
            body: JSON.stringify({
              guest_cart: guestCart
            })
          })

          if (!conversionResponse.ok) {
            const details = await conversionResponse.text().catch(() => '')
            return NextResponse.json({ 
              error: 'Failed to merge guest cart',
              details: details || undefined
            }, { status: 500 })
          }

          const conversionResult = await conversionResponse.json()
          
          return NextResponse.json({ 
            message: 'Guest data merged successfully',
            cart_conversion: conversionResult
          }, { status: 200 })
        }

        return NextResponse.json({ 
          message: 'No guest data to merge' 
        }, { status: 200 })

      case 'cleanup_session':
        // Clean up any orphaned session data
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', user.id)
          .lt('expires_at', new Date().toISOString())

        return NextResponse.json({ 
          message: 'Session cleanup completed' 
        }, { status: 200 })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (error: unknown) {
    console.error('Auth sync error:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to sync authentication' },
      { status: 500 }
    )
  }
}
