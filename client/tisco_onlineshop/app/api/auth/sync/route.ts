import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
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
        // Sync Clerk user data to Supabase users table
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          return NextResponse.json({ error: fetchError.message }, { status: 500 })
        }

        if (!existingUser) {
          // Create new user record
          const isVerified = (
            user.emailAddresses?.some((e) => e?.verification?.status === 'verified') ||
            user.phoneNumbers?.some((p) => p?.verification?.status === 'verified')
          ) ?? false

          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.emailAddresses[0]?.emailAddress,
              first_name: user.firstName,
              last_name: user.lastName,
              phone: user.phoneNumbers[0]?.phoneNumber,
              avatar_url: user.imageUrl,
              is_verified: isVerified
            })
            .select()
            .single()

          if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 })
          }

          return NextResponse.json({ 
            message: 'User profile created',
            user: newUser 
          }, { status: 201 })
        } else {
          // Update existing user record
          const isVerified = (
            user.emailAddresses?.some((e) => e?.verification?.status === 'verified') ||
            user.phoneNumbers?.some((p) => p?.verification?.status === 'verified')
          ) ?? false

          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              email: user.emailAddresses[0]?.emailAddress,
              first_name: user.firstName,
              last_name: user.lastName,
              phone: user.phoneNumbers[0]?.phoneNumber,
              avatar_url: user.imageUrl,
              is_verified: isVerified,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select()
            .single()

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }

          return NextResponse.json({ 
            message: 'User profile updated',
            user: updatedUser 
          }, { status: 200 })
        }

      case 'merge_guest_data':
        // Merge guest cart and other data when user logs in
        const guestCart = Array.isArray(payload?.guest_cart)
          ? payload.guest_cart
          : Array.isArray(payload?.guest_cart_items)
            ? payload.guest_cart_items
            : []

        if (guestCart && guestCart.length > 0) {
          // Use the existing guest cart conversion API
          const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || req.nextUrl.origin
          const url = `${base}/api/cart/guest`
          const conversionResponse = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Forward cookies to preserve Clerk auth context for currentUser()
              Cookie: cookies().toString(),
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
